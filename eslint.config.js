import js from "@eslint/js";
import ts from "typescript-eslint";
import globals from "globals";

/** @type {import("eslint").Linter.Config[]} */
export default [
  js.configs.recommended,
  ...ts.configs.strict,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      "@typescript-eslint/no-unsafe-declaration-merging": 0,
      "@typescript-eslint/no-empty-object-type": 0,
      "@typescript-eslint/no-explicit-any": 0,
    },
  },
  {
    ignores: ["build/"],
  },
];
