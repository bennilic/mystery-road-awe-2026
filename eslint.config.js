import js from "@eslint/js";
import globals from "globals";
import prettierConfig from "eslint-config-prettier";

// Flat config (ESLint 9+). Scoped to the app's own source — presentation/ is a
// separate, stable teaching-tool engine (see presentation/README via the
// create-presentation skill) that isn't part of the app being migrated here,
// and dist/ is generated build output, never linted.
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
  // Turns off ESLint stylistic rules that would otherwise conflict with
  // Prettier's own formatting decisions — must stay last so it overrides
  // the configs above rather than the other way round.
  prettierConfig,
];
