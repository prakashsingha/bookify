import BookCard from "@/components/BookCard";
import HeroSection from "@/components/HeroSection";
import { sampleBooks } from "@/lib/constants";

const Page = () => {
  return (
    <div className="wrapper container">
      <HeroSection />
      <div className="library-books-grid">
        {sampleBooks.map((book) => (
          <BookCard key={book._id} {...book} />
        ))}
      </div>
    </div>
  );
};

export default Page;
