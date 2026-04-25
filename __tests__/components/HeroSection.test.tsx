import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import HeroSection from "@/components/HeroSection";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// Mock next/image
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

describe("HeroSection component", () => {
  it("renders without crashing", () => {
    render(<HeroSection />);
    // Just verify it renders
    expect(document.body).toBeInTheDocument();
  });

  it("renders the 'Your Library' heading", () => {
    render(<HeroSection />);
    expect(
      screen.getByRole("heading", { name: /your library/i })
    ).toBeInTheDocument();
  });

  it("renders the description text about AI conversations", () => {
    render(<HeroSection />);
    expect(
      screen.getByText(/convert your books into interactive ai conversations/i)
    ).toBeInTheDocument();
  });

  it("renders the 'Add new book' CTA link", () => {
    render(<HeroSection />);
    expect(
      screen.getByRole("link", { name: /add new book/i })
    ).toBeInTheDocument();
  });

  it("the 'Add new book' link points to /books/new", () => {
    render(<HeroSection />);
    const ctaLink = screen.getByRole("link", { name: /add new book/i });
    expect(ctaLink).toHaveAttribute("href", "/books/new");
  });

  it("renders the hero illustration images", () => {
    render(<HeroSection />);
    // Both desktop and mobile images should be present
    const images = screen.getAllByAltText("Vintage books and a globe");
    expect(images.length).toBeGreaterThanOrEqual(1);
  });

  it("hero images have the correct src", () => {
    render(<HeroSection />);
    const images = screen.getAllByAltText("Vintage books and a globe");
    images.forEach((img) => {
      expect(img).toHaveAttribute("src", "/assets/hero-illustration.png");
    });
  });

  it("renders the step list with 3 steps", () => {
    render(<HeroSection />);
    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(3);
  });

  it("renders step 1: 'Upload PDF'", () => {
    render(<HeroSection />);
    expect(screen.getByText("Upload PDF")).toBeInTheDocument();
  });

  it("renders step 2: 'AI Processing'", () => {
    render(<HeroSection />);
    expect(screen.getByText("AI Processing")).toBeInTheDocument();
  });

  it("renders step 3: 'Voice Chat'", () => {
    render(<HeroSection />);
    expect(screen.getByText("Voice Chat")).toBeInTheDocument();
  });

  it("renders step descriptions", () => {
    render(<HeroSection />);
    expect(screen.getByText("Add your book file")).toBeInTheDocument();
    expect(screen.getByText("We analyze the content")).toBeInTheDocument();
    expect(screen.getByText("Discuss with AI")).toBeInTheDocument();
  });

  it("renders step numbers 1, 2, 3", () => {
    const { container } = render(<HeroSection />);
    const listItems = container.querySelectorAll("li");
    // The step number divs contain the numbers
    const stepNumbers = Array.from(listItems).map(
      (li) => li.querySelector("div")?.textContent
    );
    expect(stepNumbers[0]).toBe("1");
    expect(stepNumbers[1]).toBe("2");
    expect(stepNumbers[2]).toBe("3");
  });

  it("renders the section element as the root", () => {
    const { container } = render(<HeroSection />);
    const section = container.querySelector("section");
    expect(section).toBeInTheDocument();
  });

  it("renders an unordered list for the steps", () => {
    const { container } = render(<HeroSection />);
    const ul = container.querySelector("ul");
    expect(ul).toBeInTheDocument();
  });

  it("the CTA link contains the '+' icon and text", () => {
    render(<HeroSection />);
    const ctaLink = screen.getByRole("link", { name: /add new book/i });
    expect(ctaLink.textContent).toContain("+");
    expect(ctaLink.textContent).toContain("Add new book");
  });
});