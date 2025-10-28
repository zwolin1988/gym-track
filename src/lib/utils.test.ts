/**
 * Unit Tests - Utility Functions
 *
 * Example unit test following Vitest best practices:
 * - Structure with describe/it blocks
 * - Arrange-Act-Assert pattern
 * - Clear test names
 * - Type safety
 */

import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn() utility function", () => {
  it("should merge class names correctly", () => {
    // Arrange
    const class1 = "text-red-500";
    const class2 = "font-bold";

    // Act
    const result = cn(class1, class2);

    // Assert
    expect(result).toBe("text-red-500 font-bold");
  });

  it("should handle conditional classes", () => {
    // Arrange
    const isActive = true;
    const isDisabled = false;

    // Act
    const result = cn("base-class", isActive && "active", isDisabled && "disabled");

    // Assert
    expect(result).toBe("base-class active");
  });

  it("should merge conflicting Tailwind classes correctly", () => {
    // Arrange - tailwind-merge should keep the last class when conflicting
    const baseClasses = "px-4 py-2";
    const overrideClasses = "px-6";

    // Act
    const result = cn(baseClasses, overrideClasses);

    // Assert
    expect(result).toContain("px-6");
    expect(result).toContain("py-2");
  });

  it("should handle empty inputs", () => {
    // Act
    const result = cn();

    // Assert
    expect(result).toBe("");
  });

  it("should filter out falsy values", () => {
    // Arrange
    const classes = cn("text-lg", null, undefined, false, "", "font-semibold");

    // Assert
    expect(classes).toBe("text-lg font-semibold");
  });
});
