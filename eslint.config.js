// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  { ignores: ["dist/*", ".expo/*", "node_modules/*"] },
  { files: ["**/*.test.ts", "**/*.test.tsx", "jest.setup.js", "src/test/**"], languageOptions: { globals: { jest: "readonly" } } },
]);
