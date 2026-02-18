import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { verifyAccessToken, TokenPayload } from "./auth";

export interface AuthUser {
  id: string;
  firmId: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
}

export function getAuthUser(req: NextRequest): AuthUser | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  const payload = verifyAccessToken(token);
  if (!payload) {
    return null;
  }

  return {
    id: payload.sub,
    firmId: payload.firmId,
    email: payload.email,
    role: payload.role,
    firstName: payload.firstName,
    lastName: payload.lastName,
  };
}

export function requireAuth(req: NextRequest): AuthUser | NextResponse {
  const user = getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}

export function requireRole(
  req: NextRequest,
  ...roles: Role[]
): AuthUser | NextResponse {
  const result = requireAuth(req);
  if (result instanceof NextResponse) return result;

  if (roles.length > 0 && !roles.includes(result.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return result;
}

type ApiHandler = (
  req: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

export function withAuth(
  handler: (
    req: NextRequest,
    user: AuthUser,
    context: { params: Promise<Record<string, string>> }
  ) => Promise<NextResponse>,
  options?: { roles?: Role[] }
): ApiHandler {
  return async (req, context) => {
    const result = options?.roles
      ? requireRole(req, ...options.roles)
      : requireAuth(req);

    if (result instanceof NextResponse) return result;
    return handler(req, result, context);
  };
}
