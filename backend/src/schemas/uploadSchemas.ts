import { z } from "zod";

const ALLOWED_CONTENT_TYPES = [
  // Images (for meal analysis & food logging)
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  // Videos (for workout form review)
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
] as const;

export const presignUploadSchema = z.object({
  filename: z
    .string()
    .min(1, "filename is required")
    .max(255, "filename is too long")
    .regex(
      /\.(jpe?g|png|webp|heic|heif|mp4|mov|webm|m4v)$/i,
      "Invalid file extension. Only image (.jpg, .png, .webp, .heic) and video (.mp4, .mov, .webm) files are allowed.",
    ),
  contentType: z.enum(ALLOWED_CONTENT_TYPES, {
    errorMap: () => ({
      message:
        "Invalid contentType. Allowed types: JPEG, PNG, WebP, HEIC images and MP4, QuickTime, WebM videos.",
    }),
  }),
});

export type PresignUploadInput = z.infer<typeof presignUploadSchema>;
