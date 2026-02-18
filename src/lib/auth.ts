import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { Role } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET!;
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || "15m";
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || "7d";

export interface TokenPayload {
  sub: string;
  firmId: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload as object, JWT_SECRET, {
    expiresIn: ACCESS_EXPIRY,
  } as SignOptions);
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, {
    expiresIn: REFRESH_EXPIRY,
  } as SignOptions);
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload & {
      iat: number;
      exp: number;
    };
    return {
      sub: decoded.sub,
      firmId: decoded.firmId,
      email: decoded.email,
      role: decoded.role,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
    };
  } catch {
    return null;
  }
}

export function verifyRefreshToken(
  token: string
): { sub: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string };
  } catch {
    return null;
  }
}
