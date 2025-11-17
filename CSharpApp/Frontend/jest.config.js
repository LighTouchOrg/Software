module.exports = {
  testEnvironment: "jsdom",
  testMatch: [
    "**/__tests__/**/*.test.js"
  ],
  testPathIgnorePatterns: [
    "/node_modules/"
  ],
  collectCoverageFrom: [
    "interactions/**/*.js",
    "settings/multi-lang.js",
    "settings/settings.js",
    "settings/User_Settings.js",
    "key_binding/**/*.js",
    "renderer.js",
    "webview-adapter.js",
    "!**/__tests__/**",
    "!**/node_modules/**"
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  verbose: true
};
