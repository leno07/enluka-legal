import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import { hasMinRole } from "@/lib/roles";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ matterId: string }> }
) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const { matterId } = await params;

  const bundles = await prisma.bundle.findMany({
    where: { matterId, matter: { firmId: user.firmId } },
    include: {
      createdBy: {
        select: { id: true, firstName: true, lastName: true },
      },
      _count: { select: { documents: true, shareLinks: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bundles);
}

const createBundleSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  documentIds: z.array(
    z.object({
      documentId: z.string(),
      section: z.string().default("Main"),
      position: z.number(),
    })
  ),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matterId: string }> }
) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  if (!hasMinRole(user.role, "SOLICITOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { matterId } = await params;

  try {
    const body = await req.json();
    const validated = createBundleSchema.parse(body);

    const matter = await prisma.matter.findFirst({
      where: { id: matterId, firmId: user.firmId },
    });

    if (!matter) {
      return NextResponse.json({ error: "Matter not found" }, { status: 404 });
    }

    const bundle = await prisma.$transaction(async (tx) => {
      const b = await tx.bundle.create({
        data: {
          matterId,
          createdById: user.id,
          title: validated.title,
          description: validated.description || null,
          status: "DRAFT",
        },
      });

      if (validated.documentIds.length > 0) {
        await tx.bundleDocument.createMany({
          data: validated.documentIds.map((doc) => ({
            bundleId: b.id,
            documentId: doc.documentId,
            section: doc.section,
            position: doc.position,
          })),
        });
      }

      return b;
    });

    await auditLog({
      firmId: user.firmId,
      userId: user.id,
      action: "CREATE",
      entityType: "Bundle",
      entityId: bundle.id,
      newValue: { title: bundle.title },
      req,
    });

    return NextResponse.json(bundle, { status: 201 });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create bundle error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
