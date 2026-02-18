import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ matterId: string; bundleId: string }> }
) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const { matterId, bundleId } = await params;

  const bundle = await prisma.bundle.findFirst({
    where: { id: bundleId, matterId, matter: { firmId: user.firmId } },
    include: {
      createdBy: {
        select: { id: true, firstName: true, lastName: true },
      },
      documents: {
        include: {
          document: {
            select: { id: true, fileName: true, fileSize: true, category: true },
          },
        },
        orderBy: [{ section: "asc" }, { position: "asc" }],
      },
      shareLinks: {
        select: {
          id: true,
          token: true,
          expiresAt: true,
          accessCount: true,
          revokedAt: true,
          createdAt: true,
        },
      },
    },
  });

  if (!bundle) {
    return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
  }

  return NextResponse.json(bundle);
}
