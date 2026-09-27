import tseslint from "typescript-eslint";
import globals from "globals";
import prettierConfig from "eslint-config-prettier";

// Flat config (ESLint 9+). Scoped to the app's own source — presentation/ is a
// separate, stable teaching-tool engine (see presentation/README via the
// create-presentation skill) that isn't part of the app being migrated here,
// and dist/ is generated build output, never linted.
//
// Demo 7: the whole app is TypeScript now (no .js left under js/), so the
// separate `**/*.js` block Demo 4/5 needed — plain ESLint's recommended
// config, parsed with the default espree parser — is gone. Everything goes
// through typescript-eslint's parser and rules instead.
export default [
  {
    ignores: ["dist/**", "node_modules/**", "presentation/**", ".claude/**"],
  },
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      eqeqeq: "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  // Turns off ESLint stylistic rules that would otherwise conflict with
  // Prettier's own formatting decisions — must stay last so it overrides
  // the configs above rather than the other way round.
  prettierConfig,
];
