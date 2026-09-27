import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The E2E suite (tests/e2e.cjs) drives the dev server through http://127.0.0.1:3210.
  // Next.js 16 blocks cross-origin requests to dev assets by default, so 127.0.0.1 has to
  // be allowed here — otherwise the pages render but never hydrate (no client JS).
  allowedDevOrigins: ["127.0.0.1"],

  // React Compiler (stable in Next 16). It auto-memoizes components and hooks, so the
  // manual useMemo/useCallback/memo calls are no longer needed.
  // Next.js only compiles the client graph (server components are skipped) and requires
  // `babel-plugin-react-compiler` to be installed — see package.json.
  // Defaults: compilationMode: "infer" (components + hooks only) and panicThreshold: "none"
  // (a component the compiler cannot analyze is skipped instead of failing the build).
  reactCompiler: true,
};

export default nextConfig;
