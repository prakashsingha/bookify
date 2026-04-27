import { z } from "zod";

import { ACCEPTED_IMAGE_TYPES, ACCEPTED_PDF_TYPES, MAX_FILE_SIZE, MAX_IMAGE_SIZE } from "@/lib/constants";

const personaIds = ["dave", "daniel", "chris", "rachel", "sarah"] as const;

/** Voice ids accepted by `UploadSchema` — keep upload UI options in sync with this list. */
export const PERSONA_IDS = personaIds;

export const UploadSchema = z.object({
  pdfFile: z
    .instanceof(File, { message: "Please upload a PDF file." })
    .refine((file) => ACCEPTED_PDF_TYPES.includes(file.type), {
      message: "Only PDF files are supported.",
    })
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: "PDF file must be 50MB or smaller.",
    }),
  coverImage: z
    .instanceof(File)
    .refine((file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type as string), {
      message: "Only .jpg, .jpeg, .png, and .webp files are supported.",
    })
    .refine((file) => file.size <= MAX_IMAGE_SIZE, {
      message: "Image must be 10 MB or smaller.",
    })
    .optional(),
  title: z.string().min(2, { message: "Title must be at least 2 characters long." }).max(100, { message: "Title must be less than 100 characters long." }),
  author: z.string().min(2, { message: "Author name must be at least 2 characters long." }).max(100, { message: "Author name must be less than 100 characters long." }),
  persona: z.enum(personaIds, {
    message: "Please choose an assistant voice.",
  }),
});

export type UploadFormValues = z.infer<typeof UploadSchema>;
