
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/tests/**/*.test.ts"],
    environment: "node",
    clearMocks: true,
    restoreMocks: true,
    fileParallelism: false,
    testTimeout: 15_000,
    hookTimeout: 20_000,
  },
});
