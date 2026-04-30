import { auth } from "@clerk/nextjs/server";
import BookCard from "@/components/BookCard";
import HeroSection from "@/components/HeroSection";
import { LibrarySearch } from "@/components/Search";
import { getLibraryBooks } from "@/lib/actions/book.actions";
import { IBook } from "@/types";

interface PageProps {
  searchParams: Promise<{ query?: string | string[] }>;
}

function normalizeQuery(
  value: string | string[] | undefined,
): string {
  if (value === undefined) {
    return "";
  }
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value;
}

const Page = async ({ searchParams }: PageProps) => {
  const { userId } = await auth();
  const params = await searchParams;
  const query = normalizeQuery(params.query);

  const bookResults = userId
    ? await getLibraryBooks(userId, query)
    : { success: true, data: [] as IBook[] };
  const books = bookResults.success && bookResults.data ? bookResults.data : [];

  return (
    <div className="wrapper container">
      <HeroSection />
      <section className="mt-2" aria-label="Your books">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-serif text-2xl font-semibold text-black tracking-[-0.02em]">
            Recent books
          </h2>
          <LibrarySearch initialQuery={query} />
        </div>
        <div className="library-books-grid">
          {books.map((book: IBook) => (
            <BookCard key={book._id} {...book} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Page;
