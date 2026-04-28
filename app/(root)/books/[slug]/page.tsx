import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";

import { getBookBySlug } from "@/lib/actions/book.actions";

type BookPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const Page = async ({ params }: BookPageProps) => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const { slug } = await params;
  const result = await getBookBySlug(slug, userId);
  if (!result.success || !result.data) {
    notFound();
  }

  const book = result.data;

  return (
    <main className="wrapper container">
      <div className="mx-auto max-w-180 space-y-8">
        <section className="flex flex-col gap-4">
          <h1 className="page-title-xl">{book.title}</h1>
          <p className="subtitle">By {book.author}</p>
        </section>

        <section className="grid gap-6 md:grid-cols-[220px,1fr]">
          <Image
            src={book.coverURL}
            alt={`${book.title} cover`}
            width={220}
            height={320}
            className="w-full rounded-xl border border-[var(--border-medium)] object-cover"
          />

          <div className="space-y-4 rounded-xl border border-[var(--border-medium)] bg-[var(--bg-card)] p-6">
            <p className="text-sm text-[var(--text-secondary)]">
              Uploaded PDF URL
            </p>
            <a
              href={book.fileURL}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-[var(--color-brand)] underline underline-offset-2 break-all"
            >
              {book.fileURL}
            </a>
            <p className="text-sm text-[var(--text-secondary)]">
              Segments: {book.totalSegments}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Page;
