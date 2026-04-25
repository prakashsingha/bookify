import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (classname utility)", () => {
  it("returns a single class unchanged", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("joins multiple classes with spaces", () => {
    expect(cn("foo", "bar", "baz")).toBe("foo bar baz");
  });

  it("ignores falsy values (undefined, null, false)", () => {
    expect(cn("foo", undefined, null, false, "bar")).toBe("foo bar");
  });

  it("handles conditional objects (clsx object syntax)", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  it("merges conflicting tailwind classes - last one wins", () => {
    // tailwind-merge should remove the first conflicting class
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
  });

  it("merges conflicting padding classes", () => {
    const result = cn("p-4", "p-8");
    expect(result).toBe("p-8");
  });

  it("merges conflicting background classes", () => {
    const result = cn("bg-red-500", "bg-green-500");
    expect(result).toBe("bg-green-500");
  });

  it("does not merge non-conflicting tailwind classes", () => {
    const result = cn("text-red-500", "font-bold");
    expect(result).toBe("text-red-500 font-bold");
  });

  it("handles array inputs", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("handles mixed inputs (strings, objects, arrays)", () => {
    const result = cn("base", { active: true, disabled: false }, ["extra"]);
    expect(result).toBe("base active extra");
  });

  it("returns empty string when no valid classes are provided", () => {
    expect(cn(undefined, null, false)).toBe("");
  });

  it("handles empty string input", () => {
    expect(cn("")).toBe("");
  });

  it("handles conditional classnames based on boolean variable", () => {
    const isActive = true;
    const isDisabled = false;
    const result = cn("base", isActive && "active", isDisabled && "disabled");
    expect(result).toBe("base active");
  });

  it("handles tailwind modifier classes without conflicts", () => {
    const result = cn("hover:bg-blue-500", "focus:bg-red-500");
    expect(result).toBe("hover:bg-blue-500 focus:bg-red-500");
  });

  it("deduplicates identical classes via tailwind-merge", () => {
    const result = cn("flex", "flex");
    // tailwind-merge removes duplicates
    expect(result).toBe("flex");
  });
});