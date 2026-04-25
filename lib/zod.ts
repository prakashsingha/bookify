import { z } from "zod";

const MAX_PDF_FILE_SIZE = 50 * 1024 * 1024;

const voiceIds = ["dave", "daniel", "chris", "rachel", "sarah"] as const;

export const UploadSchema = z.object({
  pdfFile: z
    .instanceof(File, { message: "Please upload a PDF file." })
    .refine((file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"), {
      message: "Only PDF files are supported.",
    })
    .refine((file) => file.size <= MAX_PDF_FILE_SIZE, {
      message: "PDF file must be 50MB or smaller.",
    }),
  coverImage: z
    .instanceof(File)
    .refine((file) => file.type.startsWith("image/"), {
      message: "Please choose a valid image file.",
    })
    .optional(),
  title: z.string().min(2, { message: "Title must be at least 2 characters long." }),
  author: z.string().min(2, { message: "Author name must be at least 2 characters long." }),
  voice: z.enum(voiceIds, {
    message: "Please choose an assistant voice.",
  }),
});

export type UploadFormValues = z.infer<typeof UploadSchema>;
