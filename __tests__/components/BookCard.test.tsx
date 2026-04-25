import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import BookCard from "@/components/BookCard";

// Mock next/link to render a simple anchor tag
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

// Mock next/image to render a simple img tag
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    width,
    height,
    className,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
  }) => (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  ),
}));

const defaultProps = {
  title: "Clean Code",
  author: "Robert Cecil Martin",
  coverURL: "https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg",
  slug: "clean-code",
};

describe("BookCard component", () => {
  it("renders the book title", () => {
    render(<BookCard {...defaultProps} />);
    expect(screen.getByText("Clean Code")).toBeInTheDocument();
  });

  it("renders the book author", () => {
    render(<BookCard {...defaultProps} />);
    expect(screen.getByText("Robert Cecil Martin")).toBeInTheDocument();
  });

  it("renders an image with the correct src", () => {
    render(<BookCard {...defaultProps} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", defaultProps.coverURL);
  });

  it("renders an image with alt text equal to the book title", () => {
    render(<BookCard {...defaultProps} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("alt", "Clean Code");
  });

  it("renders a link pointing to /books/{slug}", () => {
    render(<BookCard {...defaultProps} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/books/clean-code");
  });

  it("wraps the content in an article element", () => {
    const { container } = render(<BookCard {...defaultProps} />);
    expect(container.querySelector("article")).toBeInTheDocument();
  });

  it("renders the book title inside an h3 element", () => {
    const { container } = render(<BookCard {...defaultProps} />);
    const h3 = container.querySelector("h3");
    expect(h3).toBeInTheDocument();
    expect(h3?.textContent).toBe("Clean Code");
  });

  it("renders the author inside a p element", () => {
    const { container } = render(<BookCard {...defaultProps} />);
    const p = container.querySelector("figcaption p");
    expect(p).toBeInTheDocument();
    expect(p?.textContent).toBe("Robert Cecil Martin");
  });

  it("renders with different slugs correctly", () => {
    const props = {
      ...defaultProps,
      slug: "atomic-habits",
    };
    render(<BookCard {...props} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/books/atomic-habits");
  });

  it("renders correctly with a slug containing numbers", () => {
    const props = {
      ...defaultProps,
      slug: "1984",
      title: "1984",
      author: "George Orwell",
    };
    render(<BookCard {...props} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/books/1984");
    expect(screen.getByText("1984")).toBeInTheDocument();
    expect(screen.getByText("George Orwell")).toBeInTheDocument();
  });

  it("applies 'book-card' class to the article wrapper", () => {
    const { container } = render(<BookCard {...defaultProps} />);
    const article = container.querySelector("article");
    expect(article).toHaveClass("book-card");
  });

  it("applies 'book-card-cover' class to the image", () => {
    render(<BookCard {...defaultProps} />);
    const img = screen.getByRole("img");
    expect(img).toHaveClass("book-card-cover");
  });

  it("renders a figure element with proper structure", () => {
    const { container } = render(<BookCard {...defaultProps} />);
    expect(container.querySelector("figure")).toBeInTheDocument();
    expect(container.querySelector("figcaption")).toBeInTheDocument();
  });

  it("renders with a very long title without crashing", () => {
    const longTitle = "A".repeat(200);
    render(<BookCard {...defaultProps} title={longTitle} />);
    expect(screen.getByText(longTitle)).toBeInTheDocument();
  });

  it("renders image with correct dimensions (133x200)", () => {
    render(<BookCard {...defaultProps} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("width", "133");
    expect(img).toHaveAttribute("height", "200");
  });
});