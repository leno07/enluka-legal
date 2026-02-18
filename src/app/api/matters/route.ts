import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth-middleware";
import { createMatterSchema } from "@/lib/validators/matter";
import { auditLog } from "@/lib/audit";
import { hasMinRole } from "@/lib/roles";
import { PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(
    PAGINATION_MAX_LIMIT,
    Math.max(1, parseInt(url.searchParams.get("limit") || String(PAGINATION_DEFAULT_LIMIT)))
  );
  const status = url.searchParams.get("status") || undefined;
  const search = url.searchParams.get("search") || undefined;

  const where: any = { firmId: user.firmId };

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { reference: { contains: search, mode: "insensitive" } },
      { clientName: { contains: search, mode: "insensitive" } },
      { caseNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  // Non-admin users only see matters they're assigned to or own
  if (!hasMinRole(user.role, "SUPERVISOR")) {
    where.OR = [
      { ownerId: user.id },
      { assignments: { some: { userId: user.id } } },
      ...(where.OR || []),
    ];
  }

  const [matters, total] = await Promise.all([
    prisma.matter.findMany({
      where,
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: {
          select: { directions: true, documents: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.matter.count({ where }),
  ]);

  return NextResponse.json({
    data: matters,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const user = requireRole(req, "SOLICITOR", "SENIOR_SOLICITOR", "SUPERVISOR", "PARTNER", "COLP", "ADMIN");
  if (user instanceof NextResponse) return user;

  try {
    const body = await req.json();
    const validated = createMatterSchema.parse(body);

    // Generate reference
    const reference = await generateMatterReference(
      user.firmId,
      validated.clientName
    );

    const matter = await prisma.$transaction(async (tx) => {
      const m = await tx.matter.create({
        data: {
          firmId: user.firmId,
          reference,
          title: validated.title,
          clientName: validated.clientName,
          clientReference: validated.clientReference || null,
          court: validated.court || null,
          caseNumber: validated.caseNumber || null,
          judge: validated.judge || null,
          description: validated.description || null,
          ownerId: user.id,
        },
        include: {
          owner: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      // Auto-assign owner
      await tx.matterAssignment.create({
        data: {
          matterId: m.id,
          userId: user.id,
          role: "OWNER",
        },
      });

      // Assign additional users
      if (validated.assigneeIds?.length) {
        await tx.matterAssignment.createMany({
          data: validated.assigneeIds
            .filter((id) => id !== user.id)
            .map((userId) => ({
              matterId: m.id,
              userId,
              role: "ASSIGNED",
            })),
          skipDuplicates: true,
        });
      }

      return m;
    });

    await auditLog({
      firmId: user.firmId,
      userId: user.id,
      action: "CREATE",
      entityType: "Matter",
      entityId: matter.id,
      newValue: { reference: matter.reference, title: matter.title },
      req,
    });

    return NextResponse.json(matter, { status: 201 });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create matter error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function generateMatterReference(
  firmId: string,
  clientName: string
): Promise<string> {
  const initials = clientName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
  const year = new Date().getFullYear();
  const prefix = `${initials}-${year}-`;

  const count = await prisma.matter.count({
    where: { firmId, reference: { startsWith: prefix } },
  });

  return `${prefix}${String(count + 1).padStart(3, "0")}`;
}
