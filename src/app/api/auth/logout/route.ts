import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import { auditLog } from "@/lib/audit";
import { REFRESH_TOKEN_COOKIE } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof NextResponse) return user;

    const refreshTokenValue = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

    if (refreshTokenValue) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshTokenValue, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await auditLog({
      firmId: user.firmId,
      userId: user.id,
      action: "LOGOUT",
      entityType: "User",
      entityId: user.id,
      req,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
