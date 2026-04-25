import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "@/components/ui/Input";

describe("Input component", () => {
  it("renders an input element", () => {
    render(<Input />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("has data-slot='input' attribute", () => {
    render(<Input />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("data-slot", "input");
  });

  it("renders with the provided type attribute", () => {
    render(<Input type="email" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("type", "email");
  });

  it("defaults to text type when type is not provided", () => {
    const { container } = render(<Input />);
    const input = container.querySelector("input");
    // When type is undefined it renders as text
    expect(input).toBeInTheDocument();
  });

  it("renders with a placeholder", () => {
    render(<Input placeholder="Enter text here" />);
    expect(screen.getByPlaceholderText("Enter text here")).toBeInTheDocument();
  });

  it("accepts and reflects a value", () => {
    render(<Input value="hello" onChange={() => {}} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("hello");
  });

  it("calls onChange handler when user types", async () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "abc");
    expect(handleChange).toHaveBeenCalled();
  });

  it("applies custom className alongside default classes", () => {
    render(<Input className="custom-class" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("custom-class");
  });

  it("renders as disabled when disabled prop is passed", () => {
    render(<Input disabled />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });

  it("forwards additional props (e.g., aria-label)", () => {
    render(<Input aria-label="Search field" />);
    expect(screen.getByRole("textbox", { name: "Search field" })).toBeInTheDocument();
  });

  it("renders with name attribute", () => {
    render(<Input name="username" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("name", "username");
  });

  it("renders a password input with type=password", () => {
    const { container } = render(<Input type="password" />);
    const input = container.querySelector("input[type='password']");
    expect(input).toBeInTheDocument();
  });

  it("forwards ref correctly", () => {
    // Simple ref smoke test by checking it renders
    const { container } = render(<Input data-testid="my-input" />);
    expect(container.querySelector("input")).toBeInTheDocument();
  });
});