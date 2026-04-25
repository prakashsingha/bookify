import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, buttonVariants } from "@/components/ui/button";

describe("Button component", () => {
  it("renders a button element", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("has data-slot='button' attribute", () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("data-slot", "button");
  });

  it("sets data-variant attribute to default by default", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("data-variant", "default");
  });

  it("sets data-size attribute to default by default", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("data-size", "default");
  });

  it("calls onClick handler when clicked", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is passed", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("does not fire onClick when disabled", async () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });

  it("renders with variant='outline' and sets data-variant attribute", () => {
    render(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("data-variant", "outline");
  });

  it("renders with variant='secondary'", () => {
    render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("data-variant", "secondary");
  });

  it("renders with variant='ghost'", () => {
    render(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("data-variant", "ghost");
  });

  it("renders with variant='destructive'", () => {
    render(<Button variant="destructive">Destructive</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("data-variant", "destructive");
  });

  it("renders with variant='link'", () => {
    render(<Button variant="link">Link</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("data-variant", "link");
  });

  it("renders with size='sm' and sets data-size attribute", () => {
    render(<Button size="sm">Small</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("data-size", "sm");
  });

  it("renders with size='lg'", () => {
    render(<Button size="lg">Large</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("data-size", "lg");
  });

  it("renders with size='icon'", () => {
    render(<Button size="icon">Icon</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("data-size", "icon");
  });

  it("renders children content correctly", () => {
    render(<Button>Submit Form</Button>);
    expect(screen.getByText("Submit Form")).toBeInTheDocument();
  });

  it("renders with type='submit'", () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("renders with type='button' (explicit)", () => {
    render(<Button type="button">Cancel</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("asChild=false renders as a button element (default)", () => {
    render(<Button asChild={false}>Normal</Button>);
    expect(screen.getByRole("button").tagName).toBe("BUTTON");
  });

  describe("buttonVariants utility", () => {
    it("returns a string for default variant and size", () => {
      const classes = buttonVariants({});
      expect(typeof classes).toBe("string");
      expect(classes.length).toBeGreaterThan(0);
    });

    it("returns different classes for outline vs default variant", () => {
      const defaultClasses = buttonVariants({ variant: "default" });
      const outlineClasses = buttonVariants({ variant: "outline" });
      expect(defaultClasses).not.toBe(outlineClasses);
    });

    it("returns different classes for sm vs lg size", () => {
      const smClasses = buttonVariants({ size: "sm" });
      const lgClasses = buttonVariants({ size: "lg" });
      expect(smClasses).not.toBe(lgClasses);
    });

    it("accepts an additional className via options", () => {
      const classes = buttonVariants({ className: "my-extra-class" });
      expect(classes).toContain("my-extra-class");
    });
  });
});