import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  firmName: z.string().min(1, "Firm name is required").max(200),
  sraNumber: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  role: z.enum([
    "PARALEGAL",
    "TRAINEE",
    "SOLICITOR",
    "SENIOR_SOLICITOR",
    "SUPERVISOR",
    "PARTNER",
    "COLP",
    "ADMIN",
  ]),
  supervisorId: z.string().optional(),
});

export const updateMemberSchema = z.object({
  role: z
    .enum([
      "PARALEGAL",
      "TRAINEE",
      "SOLICITOR",
      "SENIOR_SOLICITOR",
      "SUPERVISOR",
      "PARTNER",
      "COLP",
      "ADMIN",
    ])
    .optional(),
  supervisorId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
