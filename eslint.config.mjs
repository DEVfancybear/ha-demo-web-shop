import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // This project lints the app only; the Playwright script is plain Node CJS.
    "tests/**",
    // Thư mục tạm khi chạy thử/E2E (database, script nháp) — không thuộc mã nguồn.
    ".tmp/**",
    ".data/**",
  ]),
]);

export default eslintConfig;
