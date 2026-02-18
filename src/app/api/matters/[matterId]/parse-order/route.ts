import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth-middleware";
import { extractDirectionsFromPdf } from "@/lib/anthropic";
import { uploadToS3, downloadFromS3 } from "@/lib/storage";
import { auditLog } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matterId: string }> }
) {
  const user = requireRole(
    req,
    "SOLICITOR",
    "SENIOR_SOLICITOR",
    "SUPERVISOR",
    "PARTNER",
    "COLP",
    "ADMIN"
  );
  if (user instanceof NextResponse) return user;

  const { matterId } = await params;

  const matter = await prisma.matter.findFirst({
    where: { id: matterId, firmId: user.firmId },
  });

  if (!matter) {
    return NextResponse.json({ error: "Matter not found" }, { status: 404 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const documentId = formData.get("documentId") as string | null;

    let pdfBuffer: Buffer;
    let sourceDocumentId: string | null = null;

    if (file) {
      // Direct file upload
      const bytes = await file.arrayBuffer();
      pdfBuffer = Buffer.from(bytes);

      // Store the court order
      const storageKey = `${user.firmId}/${matterId}/court-orders/${Date.now()}-${file.name}`;
      const bucket = process.env.S3_BUCKET_COURT_ORDERS || "court-orders";

      await uploadToS3(bucket, storageKey, pdfBuffer, "application/pdf");

      // Create document record
      const doc = await prisma.document.create({
        data: {
          matterId,
          uploadedBy: user.id,
          fileName: file.name,
          fileSize: pdfBuffer.length,
          mimeType: "application/pdf",
          storageKey,
          bucket,
          category: "COURT_ORDER",
        },
      });
      sourceDocumentId = doc.id;
    } else if (documentId) {
      // Use existing document
      const doc = await prisma.document.findFirst({
        where: { id: documentId, matterId, matter: { firmId: user.firmId } },
      });
      if (!doc) {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }
      pdfBuffer = await downloadFromS3(doc.bucket, doc.storageKey);
      sourceDocumentId = doc.id;
    } else {
      return NextResponse.json(
        { error: "Provide either a file or documentId" },
        { status: 400 }
      );
    }

    // Extract directions using Claude API
    const pdfBase64 = pdfBuffer.toString("base64");
    const extraction = await extractDirectionsFromPdf(pdfBase64);

    // Update matter with extracted court info if available
    if (extraction.courtName || extraction.caseNumber || extraction.judgeName) {
      await prisma.matter.update({
        where: { id: matterId },
        data: {
          court: extraction.courtName || matter.court,
          caseNumber: extraction.caseNumber || matter.caseNumber,
          judge: extraction.judgeName || matter.judge,
        },
      });
    }

    // Create direction records
    const directions = await prisma.$transaction(
      extraction.directions.map((dir) =>
        prisma.direction.create({
          data: {
            matterId,
            sourceDocumentId,
            orderNumber: dir.orderNumber,
            title: dir.title,
            description: dir.description,
            dueDate: dir.dueDate ? new Date(dir.dueDate) : null,
            status: "PENDING_REVIEW",
            confidenceScore: dir.confidence,
            rawExtraction: dir as any,
          },
        })
      )
    );

    await auditLog({
      firmId: user.firmId,
      userId: user.id,
      action: "PARSE",
      entityType: "Direction",
      entityId: matterId,
      newValue: {
        directionsExtracted: directions.length,
        sourceDocumentId,
        courtName: extraction.courtName,
      },
      req,
    });

    return NextResponse.json({
      directionsCount: directions.length,
      directions,
      extraction: {
        courtName: extraction.courtName,
        caseNumber: extraction.caseNumber,
        judgeName: extraction.judgeName,
        orderDate: extraction.orderDate,
      },
    });
  } catch (error: any) {
    console.error("Parse order error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse court order" },
      { status: 500 }
    );
  }
}
