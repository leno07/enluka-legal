import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import { initiateUploadSchema } from "@/lib/validators/document";
import { generateUploadUrl } from "@/lib/storage";
import { auditLog } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ matterId: string }> }
) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const { matterId } = await params;

  const matter = await prisma.matter.findFirst({
    where: { id: matterId, firmId: user.firmId },
  });

  if (!matter) {
    return NextResponse.json({ error: "Matter not found" }, { status: 404 });
  }

  const documents = await prisma.document.findMany({
    where: { matterId },
    include: {
      uploader: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matterId: string }> }
) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const { matterId } = await params;

  try {
    const body = await req.json();
    const validated = initiateUploadSchema.parse(body);

    const matter = await prisma.matter.findFirst({
      where: { id: matterId, firmId: user.firmId },
    });

    if (!matter) {
      return NextResponse.json({ error: "Matter not found" }, { status: 404 });
    }

    // Create document record
    const storageKey = `${user.firmId}/${matterId}/${Date.now()}-${validated.fileName}`;
    const bucket = process.env.S3_BUCKET_DOCUMENTS || "documents";

    const document = await prisma.document.create({
      data: {
        matterId,
        uploadedBy: user.id,
        fileName: validated.fileName,
        fileSize: validated.fileSize,
        mimeType: validated.mimeType,
        storageKey,
        bucket,
        category: validated.category || "OTHER",
        description: validated.description || null,
      },
    });

    // Generate presigned upload URL
    const uploadUrl = await generateUploadUrl(
      bucket,
      storageKey,
      validated.mimeType,
      3600
    );

    await auditLog({
      firmId: user.firmId,
      userId: user.id,
      action: "UPLOAD",
      entityType: "Document",
      entityId: document.id,
      newValue: { fileName: validated.fileName, category: validated.category },
      req,
    });

    return NextResponse.json(
      {
        document: {
          id: document.id,
          fileName: document.fileName,
          storageKey: document.storageKey,
        },
        uploadUrl,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Document upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
