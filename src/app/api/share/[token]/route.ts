import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateDownloadUrl } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    include: {
      bundle: {
        select: {
          id: true,
          title: true,
          storageKey: true,
          status: true,
          totalPages: true,
          matter: { select: { reference: true, title: true } },
        },
      },
    },
  });

  if (!shareLink) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  if (shareLink.revokedAt) {
    return NextResponse.json({ error: "Link has been revoked" }, { status: 410 });
  }

  if (shareLink.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link has expired" }, { status: 410 });
  }

  if (shareLink.maxAccess && shareLink.accessCount >= shareLink.maxAccess) {
    return NextResponse.json(
      { error: "Maximum access count reached" },
      { status: 410 }
    );
  }

  if (!shareLink.bundle.storageKey) {
    return NextResponse.json(
      { error: "Bundle not yet generated" },
      { status: 404 }
    );
  }

  // Increment access count
  await prisma.shareLink.update({
    where: { id: shareLink.id },
    data: { accessCount: { increment: 1 } },
  });

  const downloadUrl = await generateDownloadUrl(
    process.env.S3_BUCKET_BUNDLES || "bundles",
    shareLink.bundle.storageKey,
    3600
  );

  return NextResponse.json({
    bundle: {
      title: shareLink.bundle.title,
      totalPages: shareLink.bundle.totalPages,
      matterReference: shareLink.bundle.matter.reference,
      matterTitle: shareLink.bundle.matter.title,
    },
    downloadUrl,
  });
}
