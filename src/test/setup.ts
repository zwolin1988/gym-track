/**
 * Vitest Global Setup
 *
 * This file is loaded before all tests and provides:
 * - Global test utilities
 * - Custom matchers from @testing-library/jest-dom
 * - Mock configurations
 * - Environment setup
 */

import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend Vitest's expect with @testing-library/jest-dom matchers
expect.extend(matchers);

// Cleanup after each test (unmount React components)
afterEach(() => {
  cleanup();
});

// Mock environment variables for tests
vi.stubGlobal("import.meta", {
  env: {
    SUPABASE_URL: "https://test-project.supabase.co",
    SUPABASE_KEY: "test-anon-key",
    OPENROUTER_API_KEY: "test-openrouter-key",
  },
});

// Mock fetch globally (can be overridden in individual tests)
global.fetch = vi.fn();

// Mock window.matchMedia (for responsive components)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver (for lazy loading, infinite scroll)
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver (for responsive charts)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Suppress console warnings in tests (can be removed for debugging)
// global.console = {
//   ...console,
//   warn: vi.fn(),
//   error: vi.fn(),
// };
