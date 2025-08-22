
/// <reference types="vitest" />

import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  test: {
    environment: "clarinet",
    pool: "forks",
    poolOptions: {
      threads: { singleThread: true },
      forks: { singleFork: true },
    },
    setupFiles: [
      path.join(process.cwd(), "node_modules/@hirosystems/clarinet-sdk/vitest-helpers/src/vitest.setup.ts"),
    ],
    environmentOptions: {
      clarinet: {
        manifestPath: "./Clarinet.toml",
        initBeforeEach: true,
        coverage: false,
        costs: false,
      },
    },
  },
});

