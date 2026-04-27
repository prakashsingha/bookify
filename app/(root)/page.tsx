import { auth } from "@clerk/nextjs/server";
import BookCard from "@/components/BookCard";
import HeroSection from "@/components/HeroSection";
import { getAllBooks } from "@/lib/actions/book.actions";
import { IBook } from "@/types";
// import { sampleBooks } from "@/lib/constants";

const Page = async () => {
  const { userId } = await auth();
  const bookResults = userId
    ? await getAllBooks(userId)
    : { success: true, data: [] };
  const books = bookResults.success && bookResults.data ? bookResults.data : [];

  return (
    <div className="wrapper container">
      <HeroSection />
      <div className="library-books-grid">
        {books.map((book: IBook) => (
          <BookCard key={book._id} {...book} />
        ))}
      </div>
    </div>
  );
};

export default Page;
