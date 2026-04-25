import { describe, it, expect, beforeEach } from "vitest";
import { UploadSchema } from "@/lib/zod";

// Helper to create a mock File object
function makeFile(
  name: string,
  type: string,
  sizeBytes: number = 1024
): File {
  const content = new Uint8Array(sizeBytes);
  return new File([content], name, { type });
}

const MAX_PDF_SIZE = 50 * 1024 * 1024; // 50MB

describe("UploadSchema validation", () => {
  describe("pdfFile field", () => {
    it("accepts a valid PDF file by MIME type", () => {
      const file = makeFile("book.pdf", "application/pdf");
      const result = UploadSchema.safeParse({
        pdfFile: file,
        title: "Valid Title",
        author: "Valid Author",
        voice: "dave",
      });
      expect(result.success).toBe(true);
    });

    it("accepts a valid PDF file by .pdf extension when MIME type is missing", () => {
      const file = makeFile("book.pdf", "");
      const result = UploadSchema.safeParse({
        pdfFile: file,
        title: "Valid Title",
        author: "Valid Author",
        voice: "dave",
      });
      expect(result.success).toBe(true);
    });

    it("rejects a non-PDF file (e.g., image/jpeg)", () => {
      const file = makeFile("photo.jpg", "image/jpeg");
      const result = UploadSchema.safeParse({
        pdfFile: file,
        title: "Valid Title",
        author: "Valid Author",
        voice: "dave",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const msgs = result.error.issues.map((i) => i.message);
        expect(msgs).toContain("Only PDF files are supported.");
      }
    });

    it("rejects a file that exceeds 50MB", () => {
      const file = makeFile("huge.pdf", "application/pdf", MAX_PDF_SIZE + 1);
      const result = UploadSchema.safeParse({
        pdfFile: file,
        title: "Valid Title",
        author: "Valid Author",
        voice: "dave",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const msgs = result.error.issues.map((i) => i.message);
        expect(msgs).toContain("PDF file must be 50MB or smaller.");
      }
    });

    it("accepts a PDF file at exactly 50MB (boundary)", () => {
      const file = makeFile("exact.pdf", "application/pdf", MAX_PDF_SIZE);
      const result = UploadSchema.safeParse({
        pdfFile: file,
        title: "Valid Title",
        author: "Valid Author",
        voice: "dave",
      });
      expect(result.success).toBe(true);
    });

    it("rejects when pdfFile is missing (not a File instance)", () => {
      const result = UploadSchema.safeParse({
        pdfFile: "not-a-file",
        title: "Valid Title",
        author: "Valid Author",
        voice: "dave",
      });
      expect(result.success).toBe(false);
    });

    it("rejects when pdfFile is undefined", () => {
      const result = UploadSchema.safeParse({
        title: "Valid Title",
        author: "Valid Author",
        voice: "dave",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const msgs = result.error.issues.map((i) => i.message);
        expect(msgs).toContain("Please upload a PDF file.");
      }
    });
  });

  describe("coverImage field (optional)", () => {
    it("accepts a valid image file (image/png)", () => {
      const pdf = makeFile("book.pdf", "application/pdf");
      const cover = makeFile("cover.png", "image/png");
      const result = UploadSchema.safeParse({
        pdfFile: pdf,
        coverImage: cover,
        title: "Valid Title",
        author: "Valid Author",
        voice: "dave",
      });
      expect(result.success).toBe(true);
    });

    it("accepts a valid image file (image/jpeg)", () => {
      const pdf = makeFile("book.pdf", "application/pdf");
      const cover = makeFile("cover.jpg", "image/jpeg");
      const result = UploadSchema.safeParse({
        pdfFile: pdf,
        coverImage: cover,
        title: "Valid Title",
        author: "Valid Author",
        voice: "dave",
      });
      expect(result.success).toBe(true);
    });

    it("accepts when coverImage is omitted (optional field)", () => {
      const pdf = makeFile("book.pdf", "application/pdf");
      const result = UploadSchema.safeParse({
        pdfFile: pdf,
        title: "Valid Title",
        author: "Valid Author",
        voice: "dave",
      });
      expect(result.success).toBe(true);
    });

    it("rejects coverImage that is not an image type", () => {
      const pdf = makeFile("book.pdf", "application/pdf");
      const badFile = makeFile("data.csv", "text/csv");
      const result = UploadSchema.safeParse({
        pdfFile: pdf,
        coverImage: badFile,
        title: "Valid Title",
        author: "Valid Author",
        voice: "dave",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const msgs = result.error.issues.map((i) => i.message);
        expect(msgs).toContain("Please choose a valid image file.");
      }
    });
  });

  describe("title field", () => {
    it("accepts a title with 2 characters (minimum boundary)", () => {
      const pdf = makeFile("book.pdf", "application/pdf");
      const result = UploadSchema.safeParse({
        pdfFile: pdf,
        title: "AB",
        author: "Valid Author",
        voice: "dave",
      });
      expect(result.success).toBe(true);
    });

    it("rejects a title with 1 character (below minimum)", () => {
      const pdf = makeFile("book.pdf", "application/pdf");
      const result = UploadSchema.safeParse({
        pdfFile: pdf,
        title: "A",
        author: "Valid Author",
        voice: "dave",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const msgs = result.error.issues.map((i) => i.message);
        expect(msgs).toContain("Title must be at least 2 characters long.");
      }
    });

    it("rejects an empty title", () => {
      const pdf = makeFile("book.pdf", "application/pdf");
      const result = UploadSchema.safeParse({
        pdfFile: pdf,
        title: "",
        author: "Valid Author",
        voice: "dave",
      });
      expect(result.success).toBe(false);
    });

    it("accepts a long title", () => {
      const pdf = makeFile("book.pdf", "application/pdf");
      const result = UploadSchema.safeParse({
        pdfFile: pdf,
        title: "This is a very long book title that should be accepted",
        author: "Valid Author",
        voice: "dave",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("author field", () => {
    it("accepts an author name with 2 characters (minimum boundary)", () => {
      const pdf = makeFile("book.pdf", "application/pdf");
      const result = UploadSchema.safeParse({
        pdfFile: pdf,
        title: "Valid Title",
        author: "AB",
        voice: "dave",
      });
      expect(result.success).toBe(true);
    });

    it("rejects an author name with 1 character (below minimum)", () => {
      const pdf = makeFile("book.pdf", "application/pdf");
      const result = UploadSchema.safeParse({
        pdfFile: pdf,
        title: "Valid Title",
        author: "A",
        voice: "dave",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const msgs = result.error.issues.map((i) => i.message);
        expect(msgs).toContain(
          "Author name must be at least 2 characters long."
        );
      }
    });

    it("rejects an empty author", () => {
      const pdf = makeFile("book.pdf", "application/pdf");
      const result = UploadSchema.safeParse({
        pdfFile: pdf,
        title: "Valid Title",
        author: "",
        voice: "dave",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("voice field", () => {
    const validVoices = ["dave", "daniel", "chris", "rachel", "sarah"] as const;

    validVoices.forEach((voice) => {
      it(`accepts the valid voice option "${voice}"`, () => {
        const pdf = makeFile("book.pdf", "application/pdf");
        const result = UploadSchema.safeParse({
          pdfFile: pdf,
          title: "Valid Title",
          author: "Valid Author",
          voice,
        });
        expect(result.success).toBe(true);
      });
    });

    it("rejects an invalid voice option", () => {
      const pdf = makeFile("book.pdf", "application/pdf");
      const result = UploadSchema.safeParse({
        pdfFile: pdf,
        title: "Valid Title",
        author: "Valid Author",
        voice: "invalid-voice",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const msgs = result.error.issues.map((i) => i.message);
        expect(msgs).toContain("Please choose an assistant voice.");
      }
    });

    it("rejects an empty voice string", () => {
      const pdf = makeFile("book.pdf", "application/pdf");
      const result = UploadSchema.safeParse({
        pdfFile: pdf,
        title: "Valid Title",
        author: "Valid Author",
        voice: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a voice in different casing (case-sensitive)", () => {
      const pdf = makeFile("book.pdf", "application/pdf");
      const result = UploadSchema.safeParse({
        pdfFile: pdf,
        title: "Valid Title",
        author: "Valid Author",
        voice: "Dave", // Capital D
      });
      expect(result.success).toBe(false);
    });
  });

  describe("complete valid submission", () => {
    it("parses and returns correct typed values for a full valid payload", () => {
      const pdf = makeFile("clean-code.pdf", "application/pdf", 1024);
      const cover = makeFile("cover.png", "image/png", 512);

      const result = UploadSchema.safeParse({
        pdfFile: pdf,
        coverImage: cover,
        title: "Clean Code",
        author: "Robert Cecil Martin",
        voice: "rachel",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Clean Code");
        expect(result.data.author).toBe("Robert Cecil Martin");
        expect(result.data.voice).toBe("rachel");
        expect(result.data.pdfFile).toBe(pdf);
        expect(result.data.coverImage).toBe(cover);
      }
    });

    it("parses correctly when coverImage is omitted", () => {
      const pdf = makeFile("book.pdf", "application/pdf");
      const result = UploadSchema.safeParse({
        pdfFile: pdf,
        title: "Rich Dad Poor Dad",
        author: "Robert Kiyosaki",
        voice: "sarah",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.coverImage).toBeUndefined();
      }
    });
  });
});