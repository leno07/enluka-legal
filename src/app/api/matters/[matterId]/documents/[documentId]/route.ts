import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import { generateDownloadUrl } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ matterId: string; documentId: string }> }
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
    include: {
      uploader: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json(document);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ matterId: string; documentId: string }> }
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

  await prisma.document.delete({ where: { id: documentId } });

  return NextResponse.json({ success: true });
}
