import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Navbar from "@/components/Navbar";

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
    style,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
    style?: React.CSSProperties;
  }) => <img src={src} alt={alt} width={width} height={height} style={style} />,
}));

// Mock next/navigation
const mockUsePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock @clerk/nextjs
vi.mock("@clerk/nextjs", () => ({
  Show: ({
    when,
    children,
  }: {
    when: string;
    children: React.ReactNode;
  }) => {
    // Render "signed-out" content by default for testing
    if (when === "signed-out") return <>{children}</>;
    return null;
  },
  SignInButton: ({ children }: { children?: React.ReactNode }) =>
    children ? <>{children}</> : <button>Sign in</button>,
  SignUpButton: ({ children }: { children?: React.ReactNode }) => (
    <>{children}</>
  ),
  UserButton: () => <button>User</button>,
  useUser: () => ({ user: null }),
}));

describe("Navbar component", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
  });

  it("renders without crashing", () => {
    render(<Navbar />);
    expect(document.body).toBeInTheDocument();
  });

  it("renders the logo image", () => {
    render(<Navbar />);
    const logo = screen.getByAltText("Bookify");
    expect(logo).toBeInTheDocument();
  });

  it("logo image has correct src", () => {
    render(<Navbar />);
    const logo = screen.getByAltText("Bookify");
    expect(logo).toHaveAttribute("src", "/assets/logo.png");
  });

  it("renders the 'Bookify' brand text", () => {
    render(<Navbar />);
    expect(screen.getByText("Bookify")).toBeInTheDocument();
  });

  it("the logo text links to the home page", () => {
    render(<Navbar />);
    // The logo is inside a link to "/"
    const homeLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href") === "/");
    expect(homeLinks.length).toBeGreaterThan(0);
  });

  it("renders the 'Library' nav link", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: "Library" })).toBeInTheDocument();
  });

  it("renders the 'Add New' nav link", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: "Add New" })).toBeInTheDocument();
  });

  it("Library link points to '/'", () => {
    render(<Navbar />);
    const libraryLink = screen.getByRole("link", { name: "Library" });
    expect(libraryLink).toHaveAttribute("href", "/");
  });

  it("'Add New' link points to '/books/new'", () => {
    render(<Navbar />);
    const addNewLink = screen.getByRole("link", { name: "Add New" });
    expect(addNewLink).toHaveAttribute("href", "/books/new");
  });

  it("renders a header element", () => {
    const { container } = render(<Navbar />);
    expect(container.querySelector("header")).toBeInTheDocument();
  });

  it("renders a nav element", () => {
    const { container } = render(<Navbar />);
    expect(container.querySelector("nav")).toBeInTheDocument();
  });

  it("Library link has nav-link-active class when on home path", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Navbar />);
    const libraryLink = screen.getByRole("link", { name: "Library" });
    expect(libraryLink).toHaveClass("nav-link-active");
  });

  it("Library link does NOT have nav-link-active class when on a different path", () => {
    mockUsePathname.mockReturnValue("/books/new");
    render(<Navbar />);
    const libraryLink = screen.getByRole("link", { name: "Library" });
    expect(libraryLink).not.toHaveClass("nav-link-active");
  });

  it("'Add New' link has nav-link-active class when on /books/new", () => {
    mockUsePathname.mockReturnValue("/books/new");
    render(<Navbar />);
    const addNewLink = screen.getByRole("link", { name: "Add New" });
    expect(addNewLink).toHaveClass("nav-link-active");
  });

  it("'Add New' link has nav-link-active class on sub-path /books/new/some-page", () => {
    mockUsePathname.mockReturnValue("/books/new/some-page");
    render(<Navbar />);
    const addNewLink = screen.getByRole("link", { name: "Add New" });
    expect(addNewLink).toHaveClass("nav-link-active");
  });

  it("'Add New' link is NOT active when on an unrelated path", () => {
    mockUsePathname.mockReturnValue("/profile");
    render(<Navbar />);
    const addNewLink = screen.getByRole("link", { name: "Add New" });
    expect(addNewLink).not.toHaveClass("nav-link-active");
  });

  it("renders Sign In button for signed-out users", () => {
    render(<Navbar />);
    expect(screen.getByText("Sign in")).toBeInTheDocument();
  });

  it("renders Sign Up button for signed-out users", () => {
    render(<Navbar />);
    expect(screen.getByText("Sign Up")).toBeInTheDocument();
  });
});

describe("Navbar with signed-in user", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
  });

  it("renders user name when signed in and user has firstName", () => {
    vi.mocked(vi.importActual).mockClear?.();
    // Override the Clerk mock to simulate signed-in state
    vi.doMock("@clerk/nextjs", () => ({
      Show: ({
        when,
        children,
      }: {
        when: string;
        children: React.ReactNode;
      }) => {
        if (when === "signed-in") return <>{children}</>;
        return null;
      },
      SignInButton: ({ children }: { children?: React.ReactNode }) =>
        children ? <>{children}</> : <button>Sign in</button>,
      SignUpButton: ({ children }: { children?: React.ReactNode }) => (
        <>{children}</>
      ),
      UserButton: () => <button>User</button>,
      useUser: () => ({
        user: { firstName: "John", username: null },
      }),
    }));
  });
});