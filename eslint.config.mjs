import { defineConfig, globalIgnores } from "eslint/config";
import next from "@next/eslint-plugin-next";
import ts from "typescript-eslint";
import hooks from "eslint-plugin-react-hooks";
export default defineConfig([
  ...ts.configs.recommended,
  next.configs["core-web-vitals"],
  hooks.configs.flat.recommended,
  globalIgnores([
    ".tools/**",
    ".next/**",
    "next-env.d.ts",
    "supabase/.temp/**",
    "test-results/**",
    "playwright-report/**",
  ]),
]);
