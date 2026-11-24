/** Two projects: fast unit/component tests (default) and an opt-in contract suite that
 *  hits a running engine (ENGINE_URL=http://127.0.0.1:8000 npm run test:contract). */
// babel-preset-expo ships inside the expo package.
const expoBabelPreset = require.resolve("babel-preset-expo", { paths: [require.resolve("expo/package.json")] });

const base = {
  preset: "jest-expo",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  setupFiles: ["<rootDir>/jest.setup.js"],
  // Reanimated 4 / worklets run their web implementation under Jest.
  resolver: "react-native-reanimated/jest/resolver",
};
module.exports = {
  projects: [
    { ...base, displayName: "unit", testPathIgnorePatterns: ["/node_modules/", "\\.contract\\.test\\.ts$"] },
    {
      // Plain Node (real fetch): no React Native preset, which would replace fetch with a mock.
      displayName: "contract",
      testMatch: ["**/*.contract.test.ts"],
      testEnvironment: "node",
      transform: { "\\.[jt]sx?$": ["babel-jest", { presets: [expoBabelPreset] }] },
      transformIgnorePatterns: ["/node_modules/(?!(@react-native-async-storage|expo/virtual)/)"],
      moduleNameMapper: base.moduleNameMapper,
      setupFiles: base.setupFiles,
    },
  ],
};
