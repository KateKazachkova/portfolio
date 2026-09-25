import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // this repo's own extra build folders (NEXT_DIST_DIR in next.config.ts)
    ".next-*/**",
    // source art and render scripts, not the site
    "design-src/**",
    "public/**",
  ]),
]);

export default eslintConfig;
