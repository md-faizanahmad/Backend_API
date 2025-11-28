// api/vitest.config.js
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 90000,
    hookTimeout: 90000,
    teardownTimeout: 90000,
    include: ["**/test/**/*.test.js"],
    setupFiles: ["./test/setup.js"], // ← correct relative path
  },
});
