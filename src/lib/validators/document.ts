import { z } from "zod";

export const initiateUploadSchema = z.object({
  fileName: z.string().min(1).max(500),
  mimeType: z.string().min(1),
  fileSize: z.number().positive().max(100 * 1024 * 1024), // 100MB max
  category: z
    .enum([
      "COURT_ORDER",
      "WITNESS_STATEMENT",
      "EXPERT_REPORT",
      "SKELETON_ARGUMENT",
      "CORRESPONDENCE",
      "EVIDENCE",
      "PLEADING",
      "APPLICATION",
      "OTHER",
    ])
    .optional(),
  description: z.string().max(1000).optional(),
});

export const confirmUploadSchema = z.object({
  uploaded: z.literal(true),
});

export type InitiateUploadInput = z.infer<typeof initiateUploadSchema>;
