import { z } from "zod";

export const createKeyDateSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(2000).optional(),
  dueDate: z.string().min(1, "Due date is required"),
  keyDateOwnerId: z.string().min(1, "Key date owner is required"),
  priority: z.enum(["HIGH", "NORMAL", "LOW"]).optional(),
});

export const updateKeyDateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).nullable().optional(),
  dueDate: z.string().optional(),
  status: z.enum(["ON_TRACK", "AT_RISK", "OVERDUE", "BREACH"]).optional(),
  keyDateOwnerId: z.string().optional(),
  priority: z.enum(["HIGH", "NORMAL", "LOW"]).optional(),
  completedAt: z.string().nullable().optional(),
});

export type CreateKeyDateInput = z.infer<typeof createKeyDateSchema>;
export type UpdateKeyDateInput = z.infer<typeof updateKeyDateSchema>;
