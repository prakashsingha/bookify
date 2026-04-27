"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileImage, FileText, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/Input";
import { UploadFormValues, UploadSchema, PERSONA_IDS } from "@/lib/zod";
import { cn, generateSlug, parsePDFFile } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { checkBookExists, createBook, saveBookSegments } from "@/lib/actions/book.actions";
import { useRouter } from "next/navigation";
import { BookUploadFormValues } from "@/types";

type UploadVoiceId = (typeof PERSONA_IDS)[number];

const voiceOptions = {
  male: [
    { value: "dave", name: "Dave", description: "Warm and confident storyteller tone." },
    { value: "daniel", name: "Daniel", description: "Calm, articulate, and reflective delivery." },
    { value: "chris", name: "Chris", description: "Clear, balanced narration for long sessions." },
  ],
  female: [
    { value: "rachel", name: "Rachel", description: "Friendly and expressive conversational style." },
    { value: "sarah", name: "Sarah", description: "Soft and steady voice for immersive reading." },
  ],
} as const satisfies {
  male: ReadonlyArray<{ value: UploadVoiceId; name: string; description: string }>;
  female: ReadonlyArray<{ value: UploadVoiceId; name: string; description: string }>;
};
const LoadingOverlay = () => {
  return (
    <div className="loading-wrapper">
      <div className="loading-shadow-wrapper bg-[var(--bg-card)] shadow-soft-lg">
        <div className="loading-shadow">
          <Upload className="loading-animation h-10 w-10 text-[var(--color-brand)]" />
          <div className="text-center space-y-2">
            <h3 className="loading-title">Synthesizing your book</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              We are preparing your literary interview assistant...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const UploadForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => {
      setIsMounted(true);
    }, 100);
  }, []);

  
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(UploadSchema),
    defaultValues: {
      title: "",
      author: "",
      persona: "dave",
      pdfFile: undefined,
      coverImage: undefined,
    },
  });

  const uploadViaServer = async (pathname: string, file: Blob, contentType: string) => {
    const payload = new FormData();
    payload.append("pathname", pathname);
    payload.append("file", file);
    payload.append("contentType", contentType);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: payload,
    });

    if (!response.ok) {
      const bodyText = await response.text();
      let message = "Failed to upload file";
      try {
        const data = JSON.parse(bodyText) as { error?: string };
        message = data.error ?? message;
      } catch {
        if (bodyText) message = bodyText;
      }
      throw new Error(message);
    }

    const data = (await response.json()) as { url: string; pathname: string };
    return data;
  };

  const onSubmit = async (formData: BookUploadFormValues) => {
    if(!userId) {
      return toast.error("You must be logged in to upload a book");
    }

    setIsSubmitting(true);

    // PostHog to track book uploads
    // TODO: Implement PostHog tracking

    // Check if book already exists
    try {
      const checkResult = await checkBookExists(formData.title);
      if (checkResult?.exists && checkResult.data) {
        toast.info("Book with the same title already exists");
        form.reset();
        router.push(`/books/${checkResult.data.slug}`);
        return;
      }

      const fileTitle = generateSlug(formData.title) || `book-${new Date().getTime()}`;
      const pdfFile = formData.pdfFile;
      const parsedPdf = await parsePDFFile(pdfFile);
      if(parsedPdf.content.length === 0){
        toast.error("Failed to parse PDF file. Please try again with a different file.");
        form.reset();
        return;
      }

      const uploadedPdf = await uploadViaServer(
        `${fileTitle}.pdf`,
        pdfFile,
        "application/pdf",
      );
      
        if(!uploadedPdf){
          toast.error("Failed to upload PDF file. Please try again with a different file.");
          form.reset();
          return;
        }

      let uploadedCover: { url: string; pathname: string } | null = null;

      if (formData.coverImage && formData.coverImage.size > 0) {
        const coverFile = formData.coverImage;
        uploadedCover = await uploadViaServer(
          `${fileTitle}_cover.png`,
          coverFile,
          coverFile.type || "image/png",
        );

        if(!uploadedCover){
          toast.error("Failed to upload cover image. Please try again with a different file.");
          form.reset();
          return;
        }
      }else{
        const response = await fetch(parsedPdf.cover);
        const blob = await response.blob();
        uploadedCover = await uploadViaServer(
          `${fileTitle}_cover.png`,
          blob,
          blob.type || "image/png",
        );
      }

      const coverUrl = uploadedCover.url;
      const coverBlobPathname = uploadedCover.pathname;

      const book = await createBook({
        clerkId: userId,
        title: formData.title,
        author: formData.author,
        persona: formData.persona,
        fileURL: uploadedPdf.url,
        fileBlobKey: uploadedPdf.pathname,
        coverURL: coverUrl,
        coverBlobKey: coverBlobPathname,
        fileSize: pdfFile.size,
      });

      if(!book.success){
        toast.error(book.error || "Failed to create book. Please try again.");
        form.reset();
        return;
      }

      if(book.alreadyExists){
        toast.info("Book with the same title already exists");
        router.push(`/books/${book.data.slug}`);
        return;
      }
      
      const segments = await saveBookSegments(book.data._id, userId, parsedPdf.content);
      if(!segments.success){
        toast.error(segments.error || "Failed to save book segments. Please try again.");
        form.reset();
        return;
      }

      toast.success("Book created successfully");
      router.push(`/books/${book.data.slug}`);
    } catch (error) {
      console.error("Error uploading book", error);
      toast.error("Error uploading book: " + (error instanceof Error ? error.message : String(error)));
    }finally{
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {isSubmitting ? <LoadingOverlay /> : null}
      <div className="new-book-wrapper">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="pdfFile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="form-label">PDF File Upload</FormLabel>
                  <FormControl>
                    <div
                      role="button"
                      tabIndex={0}
                      className={cn(
                        "upload-dropzone border-2 border-dashed border-[var(--border-medium)] file-upload-shadow",
                        field.value && "upload-dropzone-uploaded",
                      )}
                      onClick={() => pdfInputRef.current?.click()}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          pdfInputRef.current?.click();
                        }
                      }}
                    >
                      <input
                        ref={pdfInputRef}
                        type="file"
                        accept="application/pdf,.pdf"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          field.onChange(file);
                        }}
                      />

                      {field.value ? (
                        <div className="flex items-center gap-3">
                          <p className="upload-dropzone-text break-all">{field.value.name}</p>
                          <button
                            type="button"
                            className="upload-dropzone-remove"
                            aria-label="Remove PDF"
                            onClick={(event) => {
                              event.stopPropagation();
                              field.onChange(undefined);
                              if (pdfInputRef.current) {
                                pdfInputRef.current.value = "";
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="upload-dropzone-icon" />
                          <p className="upload-dropzone-text">Click to upload PDF</p>
                          <p className="upload-dropzone-hint">PDF file (max 50MB)</p>
                        </>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coverImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="form-label">Cover Image Upload</FormLabel>
                  <FormControl>
                    <div
                      role="button"
                      tabIndex={0}
                      className={cn(
                        "upload-dropzone border-2 border-dashed border-[var(--border-medium)] file-upload-shadow",
                        field.value && "upload-dropzone-uploaded",
                      )}
                      onClick={() => coverInputRef.current?.click()}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          coverInputRef.current?.click();
                        }
                      }}
                    >
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          field.onChange(file);
                        }}
                      />

                      {field.value ? (
                        <div className="flex items-center gap-3">
                          <p className="upload-dropzone-text break-all">{field.value.name}</p>
                          <button
                            type="button"
                            className="upload-dropzone-remove"
                            aria-label="Remove cover image"
                            onClick={(event) => {
                              event.stopPropagation();
                              field.onChange(undefined);
                              if (coverInputRef.current) {
                                coverInputRef.current.value = "";
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <FileImage className="upload-dropzone-icon" />
                          <p className="upload-dropzone-text">Click to upload cover image</p>
                          <p className="upload-dropzone-hint">
                            Leave empty to auto-generate from PDF
                          </p>
                        </>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="form-label">Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="form-input"
                      placeholder="ex: Rich Dad Poor Dad"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="form-label">Author Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="form-input"
                      placeholder="ex: Robert Kiyosaki"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="persona"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="form-label">Choose Assistant Voice</FormLabel>
                  <FormDescription>
                    Pick the narration personality for your interview companion.
                  </FormDescription>

                  <div className="space-y-5">
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-[var(--text-secondary)]">Male Voices</p>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {voiceOptions.male.map((voice) => {
                          const isSelected = field.value === voice.value;
                          return (
                            <label
                              key={voice.value}
                              className={cn(
                                "voice-selector-option voice-selector-option-default items-start text-left",
                                isSelected && "voice-selector-option-selected",
                              )}
                            >
                              <input
                                type="radio"
                                name={field.name}
                                value={voice.value}
                                checked={isSelected}
                                onChange={() => field.onChange(voice.value)}
                                className="sr-only"
                              />
                              <div>
                                <p className="font-semibold text-[var(--text-primary)]">{voice.name}</p>
                                <p className="text-sm text-[var(--text-secondary)]">
                                  {voice.description}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-[var(--text-secondary)]">
                        Female Voices
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {voiceOptions.female.map((voice) => {
                          const isSelected = field.value === voice.value;
                          return (
                            <label
                              key={voice.value}
                              className={cn(
                                "voice-selector-option voice-selector-option-default items-start text-left",
                                isSelected && "voice-selector-option-selected",
                              )}
                            >
                              <input
                                type="radio"
                                name={field.name}
                                value={voice.value}
                                checked={isSelected}
                                onChange={() => field.onChange(voice.value)}
                                className="sr-only"
                              />
                              <div>
                                <p className="font-semibold text-[var(--text-primary)]">{voice.name}</p>
                                <p className="text-sm text-[var(--text-secondary)]">
                                  {voice.description}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="form-btn" disabled={form.formState.isSubmitting}>
              <FileText className="mr-2 h-5 w-5" />
              Begin Synthesis
            </Button>
          </form>
        </Form>
      </div>
    </>
  );
};

export default UploadForm;
