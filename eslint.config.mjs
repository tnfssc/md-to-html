// @ts-check

import preferArrayAt from "@boi.gg/eslint-plugin-prefer-array-at";
import eslint from "@eslint/js";
import perfectionist from "eslint-plugin-perfectionist";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

const tsFiles = ["**/*.{ts,tsx}"];

/** @param {import("eslint").Linter.FlatConfig[]} configs */
const scopeToTs = (configs) => configs.map((config) => (config.files ? config : { ...config, files: tsFiles }));

/** @type {Record<string, "readonly" | "writable">} */
const nodeGlobals = {
  Buffer: "readonly",
  clearInterval: "readonly",
  clearTimeout: "readonly",
  console: "readonly",
  process: "readonly",
  setInterval: "readonly",
  setTimeout: "readonly",
};

export default defineConfig(
  {
    ignores: ["node_modules", "dist"],
  },
  eslint.configs.recommended,
  perfectionist.configs["recommended-alphabetical"],
  preferArrayAt.configs.recommended,
  {
    files: ["scripts/**/*.{js,cjs,mjs}"],
    languageOptions: {
      globals: nodeGlobals,
    },
  },
  {
    files: tsFiles,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  ...scopeToTs(tseslint.configs.strictTypeChecked),
  ...scopeToTs(tseslint.configs.stylisticTypeChecked),
  {
    files: tsFiles,
    rules: {
      "@typescript-eslint/array-type": ["warn", { default: "generic", readonly: "generic" }],
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-deprecated": "off",
      "@typescript-eslint/no-misused-promises": ["warn", { checksVoidReturn: false }],
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-unnecessary-condition": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: true,
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/only-throw-error": "off",
      "@typescript-eslint/prefer-nullish-coalescing": ["warn"],
      "@typescript-eslint/restrict-template-expressions": ["warn", { allowBoolean: true, allowNumber: true }],
      "perfectionist/sort-imports": "warn",
      "perfectionist/sort-interfaces": "warn",
      "perfectionist/sort-jsx-props": "warn",
      "perfectionist/sort-named-imports": "warn",
      "perfectionist/sort-object-types": "warn",
      "perfectionist/sort-objects": "warn",
    },
  },
);
