import { z } from "zod";

export const createMatterSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  clientName: z.string().min(1, "Client name is required").max(200),
  clientReference: z.string().max(100).optional(),
  court: z.string().max(200).optional(),
  caseNumber: z.string().max(100).optional(),
  judge: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  assigneeIds: z.array(z.string()).optional(),
});

export const updateMatterSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  clientName: z.string().min(1).max(200).optional(),
  clientReference: z.string().max(100).nullable().optional(),
  court: z.string().max(200).nullable().optional(),
  caseNumber: z.string().max(100).nullable().optional(),
  judge: z.string().max(200).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  status: z.enum(["ACTIVE", "ON_HOLD", "CLOSED", "ARCHIVED"]).optional(),
});

export const assignMatterSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["ASSIGNED", "SUPERVISOR", "COUNSEL"]).optional(),
});

export type CreateMatterInput = z.infer<typeof createMatterSchema>;
export type UpdateMatterInput = z.infer<typeof updateMatterSchema>;
export type AssignMatterInput = z.infer<typeof assignMatterSchema>;
