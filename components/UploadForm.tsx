"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileImage, FileText, Upload, X } from "lucide-react";
import { useRef } from "react";
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
import { UploadFormValues, UploadSchema } from "@/lib/zod";
import { cn } from "@/lib/utils";

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
} as const;
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
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(UploadSchema),
    defaultValues: {
      title: "",
      author: "",
      voice: "dave",
    },
  });

  const onSubmit = async (values: UploadFormValues) => {
    // Placeholder submission hook for integration with upload API.
    await new Promise((resolve) => setTimeout(resolve, 1200));
    console.log("Book upload payload", values);
  };

  return (
    <>
      {form.formState.isSubmitting ? <LoadingOverlay /> : null}

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
              name="voice"
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
