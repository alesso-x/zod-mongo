/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "js"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  testMatch: ["**/__tests__/**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setupFile.ts"],
  globalSetup: "<rootDir>/src/__tests__/global-setup.ts",
  globalTeardown: "<rootDir>/src/__tests__/global-teardown.ts",
};
