import globals from "globals";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { ignores: ["node_modules", ".env"] },
  { languageOptions: { globals: globals.browser } },
];
