import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import { hasMinRole } from "@/lib/roles";
import { auditLog } from "@/lib/audit";

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

  const bundle = await prisma.bundle.findFirst({
    where: { id: bundleId, matterId, matter: { firmId: user.firmId } },
    include: {
      documents: { include: { document: true } },
    },
  });

  if (!bundle) {
    return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
  }

  if (bundle.documents.length === 0) {
    return NextResponse.json(
      { error: "Bundle has no documents" },
      { status: 400 }
    );
  }

  if (bundle.status === "GENERATING") {
    return NextResponse.json(
      { error: "Bundle is already being generated" },
      { status: 409 }
    );
  }

  // For now, enqueue via direct import. When Redis is available, use BullMQ.
  // Mark as generating
  await prisma.bundle.update({
    where: { id: bundleId },
    data: { status: "GENERATING" },
  });

  await auditLog({
    firmId: user.firmId,
    userId: user.id,
    action: "GENERATE",
    entityType: "Bundle",
    entityId: bundleId,
    newValue: { documentCount: bundle.documents.length },
    req,
  });

  // TODO: When Redis is running, enqueue to BullMQ instead
  // getBundleQueue().add("generate", { bundleId });

  return NextResponse.json({
    message: "Bundle generation started",
    bundleId,
    status: "GENERATING",
  });
}
