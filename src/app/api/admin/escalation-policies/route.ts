import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth-middleware";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const policies = await prisma.escalationPolicy.findMany({
    where: { firmId: user.firmId },
    orderBy: { offsetHours: "desc" },
  });

  return NextResponse.json(policies);
}

const updatePolicySchema = z.object({
  tier: z.enum(["T_14D", "T_7D", "T_48H", "T_24H", "OVERDUE"]),
  offsetHours: z.number().min(0),
  escalateTo: z.string().min(1),
  channels: z.array(z.enum(["IN_APP", "EMAIL", "SMS", "PUSH"])),
  isActive: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const user = requireRole(req, "ADMIN");
  if (user instanceof NextResponse) return user;

  try {
    const body = await req.json();
    const validated = updatePolicySchema.parse(body);

    const policy = await prisma.escalationPolicy.upsert({
      where: {
        firmId_tier: { firmId: user.firmId, tier: validated.tier },
      },
      update: {
        offsetHours: validated.offsetHours,
        escalateTo: validated.escalateTo,
        channels: validated.channels,
        isActive: validated.isActive ?? true,
      },
      create: {
        firmId: user.firmId,
        ...validated,
      },
    });

    return NextResponse.json(policy);
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Escalation policy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
