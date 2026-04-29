import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getBookBySlug } from "@/lib/actions/book.actions";
import VapiControls from "@/components/VapiControls";

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
    redirect("/");
  }

  const book = result.data;

  return (
    <main className="book-page-container">
      <Link href="/" className="back-btn-floating" aria-label="Go back">
        <ArrowLeft className="size-5 text-[var(--text-primary)]" />
      </Link>
      <VapiControls book={book} />
    </main>
  );
};

export default Page;
