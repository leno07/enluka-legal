import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import { generateDownloadUrl } from "@/lib/storage";
import { auditLog } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ matterId: string; documentId: string }> }
) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const { matterId, documentId } = await params;

  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      matterId,
      matter: { firmId: user.firmId },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const downloadUrl = await generateDownloadUrl(
    document.bucket,
    document.storageKey,
    3600
  );

  await auditLog({
    firmId: user.firmId,
    userId: user.id,
    action: "DOWNLOAD",
    entityType: "Document",
    entityId: documentId,
    newValue: { fileName: document.fileName },
    req,
  });

  return NextResponse.json({ downloadUrl });
}
