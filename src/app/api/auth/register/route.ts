import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signAccessToken, signRefreshToken } from "@/lib/auth";
import { registerSchema } from "@/lib/validators/auth";
import { auditLog } from "@/lib/audit";
import { REFRESH_TOKEN_COOKIE } from "@/lib/constants";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(validated.password);

    const result = await prisma.$transaction(async (tx) => {
      const firm = await tx.firm.create({
        data: {
          name: validated.firmName,
          sraNumber: validated.sraNumber || null,
        },
      });

      const user = await tx.user.create({
        data: {
          firmId: firm.id,
          email: validated.email,
          passwordHash,
          firstName: validated.firstName,
          lastName: validated.lastName,
          role: "ADMIN",
          lastLoginAt: new Date(),
        },
      });

      // Create default escalation policies
      await tx.escalationPolicy.createMany({
        data: [
          {
            firmId: firm.id,
            tier: "T_14D",
            offsetHours: 336,
            escalateTo: "ASSIGNED",
            channels: ["IN_APP", "EMAIL"],
          },
          {
            firmId: firm.id,
            tier: "T_7D",
            offsetHours: 168,
            escalateTo: "SUPERVISOR",
            channels: ["IN_APP", "EMAIL"],
          },
          {
            firmId: firm.id,
            tier: "T_48H",
            offsetHours: 48,
            escalateTo: "OWNER",
            channels: ["IN_APP", "EMAIL"],
          },
          {
            firmId: firm.id,
            tier: "T_24H",
            offsetHours: 24,
            escalateTo: "PARTNER_COLP",
            channels: ["IN_APP", "EMAIL"],
          },
        ],
      });

      const refreshTokenValue = crypto.randomBytes(64).toString("hex");
      const refreshToken = await tx.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshTokenValue,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return { firm, user, refreshToken };
    });

    const accessToken = signAccessToken({
      sub: result.user.id,
      firmId: result.firm.id,
      email: result.user.email,
      role: result.user.role,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
    });

    await auditLog({
      firmId: result.firm.id,
      userId: result.user.id,
      action: "CREATE",
      entityType: "User",
      entityId: result.user.id,
      newValue: { email: result.user.email, role: result.user.role },
      req,
    });

    const response = NextResponse.json(
      {
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role,
          firmId: result.firm.id,
          firmName: result.firm.name,
        },
        accessToken,
      },
      { status: 201 }
    );

    response.cookies.set(REFRESH_TOKEN_COOKIE, result.refreshToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
