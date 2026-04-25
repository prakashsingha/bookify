import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import Search from "@/components/Search";

// Mock next/navigation
const mockPush = vi.fn();
const mockUsePathname = vi.fn(() => "/");
const mockGetSearchParam = vi.fn((_key: string) => null);

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({
    get: (key: string) => mockGetSearchParam(key),
  }),
}));

// Mock lucide-react Search icon
vi.mock("lucide-react", () => ({
  Search: ({ className }: { className?: string }) => (
    <svg data-testid="search-icon" className={className} />
  ),
}));

// Provide a minimal window.location.search
Object.defineProperty(window, "location", {
  writable: true,
  value: { search: "" },
});

describe("Search component (structural)", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockUsePathname.mockReturnValue("/");
    mockGetSearchParam.mockReturnValue(null);
    window.location.search = "";
  });

  it("renders without crashing", () => {
    render(<Search />);
    expect(document.body).toBeInTheDocument();
  });

  it("renders the search input", () => {
    render(<Search />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders with placeholder text", () => {
    render(<Search />);
    expect(
      screen.getByPlaceholderText("Search books by title or author")
    ).toBeInTheDocument();
  });

  it("renders the search icon", () => {
    render(<Search />);
    expect(screen.getByTestId("search-icon")).toBeInTheDocument();
  });

  it("initializes with empty query when no query param present", () => {
    mockGetSearchParam.mockReturnValue(null);
    render(<Search />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("");
  });

  it("initializes with existing query from searchParams", () => {
    mockGetSearchParam.mockReturnValue("clean code");
    render(<Search />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("clean code");
  });

  it("input has type='text'", () => {
    render(<Search />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("type", "text");
  });

  it("wraps content in a div with 'library-search-wrapper' class", () => {
    const { container } = render(<Search />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("library-search-wrapper");
  });

  it("updates input value as user types via fireEvent", () => {
    render(<Search />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "atlas" } });
    expect(input).toHaveValue("atlas");
  });
});

describe("Search component (debounced routing)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockPush.mockClear();
    mockUsePathname.mockReturnValue("/");
    mockGetSearchParam.mockReturnValue(null);
    window.location.search = "";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not call router.push immediately on input change", () => {
    render(<Search />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "clean" } });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("calls router.push after 300ms debounce with query param", () => {
    render(<Search />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "clean" } });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockPush).toHaveBeenCalled();
    const callArg = mockPush.mock.calls[0][0];
    expect(callArg).toContain("query=clean");
  });

  it("calls router.push with scroll=false option", () => {
    render(<Search />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test" } });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockPush).toHaveBeenCalledWith(expect.any(String), { scroll: false });
  });

  it("removes query param from URL when input is cleared", () => {
    mockGetSearchParam.mockReturnValue("clean code");
    render(<Search />);
    const input = screen.getByRole("textbox");

    // Clear the input
    fireEvent.change(input, { target: { value: "" } });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockPush).toHaveBeenCalled();
    const callArg = mockPush.mock.calls[0][0];
    expect(callArg).not.toContain("query=");
  });

  it("uses current pathname in the push URL", () => {
    mockUsePathname.mockReturnValue("/library");
    render(<Search />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "book" } });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockPush).toHaveBeenCalled();
    const callArg = mockPush.mock.calls[0][0];
    expect(callArg).toContain("/library");
  });

  it("does not call router.push before debounce time elapses", () => {
    render(<Search />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "react" } });

    act(() => {
      vi.advanceTimersByTime(200); // less than 300ms
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("cleans up the debounce timer on unmount (no memory leak)", () => {
    const { unmount } = render(<Search />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test" } });

    unmount();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("only calls push once with the final value after rapid typing", () => {
    render(<Search />);
    const input = screen.getByRole("textbox");

    // Simulate rapid changes - each one resets the timer
    fireEvent.change(input, { target: { value: "a" } });
    act(() => { vi.advanceTimersByTime(100); });
    fireEvent.change(input, { target: { value: "at" } });
    act(() => { vi.advanceTimersByTime(100); });
    fireEvent.change(input, { target: { value: "ato" } });
    act(() => { vi.advanceTimersByTime(100); });
    fireEvent.change(input, { target: { value: "atom" } });

    // Now let the final debounce fire
    act(() => { vi.advanceTimersByTime(300); });

    expect(mockPush).toHaveBeenCalledTimes(1);
    const callArg = mockPush.mock.calls[0][0];
    expect(callArg).toContain("query=atom");
  });
});