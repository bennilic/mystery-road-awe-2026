import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import prettierConfig from "eslint-config-prettier";

// Flat config (ESLint 9+). Scoped to the app's own source — presentation/ is a
// separate, stable teaching-tool engine (see presentation/README via the
// create-presentation skill) that isn't part of the app being migrated here,
// and dist/ is generated build output, never linted.
//
// Two separate blocks for .js vs .ts: js.configs.recommended's rules run
// through ESLint's default (espree) parser, which can't parse TS-only
// syntax (interfaces, type annotations) at all — a .ts file needs
// typescript-eslint's parser instead. Kept as two rule sets rather than
// one shared block because noUnusedLocals/noUnusedParameters in
// tsconfig.json already cover TS files at the type-checker level (Demo
// 5), so the ESLint-side no-unused-vars only needs to keep doing that job
// for the .js files tsc doesn't check yet.
export default [
  {
    ignores: ["dist/**", "node_modules/**", "presentation/**", ".claude/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      eqeqeq: "error",
      "no-var": "error",
    },
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ["**/*.ts"],
  })),
  {
    files: ["**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      eqeqeq: "error",
    },
  },
  // Turns off ESLint stylistic rules that would otherwise conflict with
  // Prettier's own formatting decisions — must stay last so it overrides
  // the configs above rather than the other way round.
  prettierConfig,
];
