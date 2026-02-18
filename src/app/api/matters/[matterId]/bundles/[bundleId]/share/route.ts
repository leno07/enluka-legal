import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import { hasMinRole } from "@/lib/roles";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

const createShareLinkSchema = z.object({
  expiresInDays: z.number().min(1).max(90).default(7),
  maxAccess: z.number().min(1).nullable().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matterId: string; bundleId: string }> }
) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  if (!hasMinRole(user.role, "SOLICITOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { matterId, bundleId } = await params;

  try {
    const body = await req.json();
    const validated = createShareLinkSchema.parse(body);

    const bundle = await prisma.bundle.findFirst({
      where: {
        id: bundleId,
        matterId,
        matter: { firmId: user.firmId },
        status: "READY",
      },
    });

    if (!bundle) {
      return NextResponse.json(
        { error: "Bundle not found or not ready" },
        { status: 404 }
      );
    }

    const shareLink = await prisma.shareLink.create({
      data: {
        bundleId,
        expiresAt: new Date(
          Date.now() + validated.expiresInDays * 24 * 60 * 60 * 1000
        ),
        maxAccess: validated.maxAccess ?? null,
      },
    });

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/share/${shareLink.token}`;

    await auditLog({
      firmId: user.firmId,
      userId: user.id,
      action: "SHARE",
      entityType: "Bundle",
      entityId: bundleId,
      newValue: {
        shareLinkId: shareLink.id,
        expiresAt: shareLink.expiresAt,
      },
      req,
    });

    return NextResponse.json(
      {
        shareLink: {
          id: shareLink.id,
          token: shareLink.token,
          url: shareUrl,
          expiresAt: shareLink.expiresAt,
        },
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
    console.error("Create share link error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
