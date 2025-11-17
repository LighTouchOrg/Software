/**
 * @jest-environment jsdom
 */

/**
 * Unit tests for the Settings class (Frontend/interactions/Settings.js).
 * Tests cover: construction, default values, setters, and getters.
 */

const fs = require("fs");
const path = require("path");
const settingsCode = fs.readFileSync(
  path.join(__dirname, "..", "interactions", "Settings.js"),
  "utf-8"
);
const loadSettings = new Function(settingsCode + "\nreturn Settings;");
const Settings = loadSettings();

describe("Settings - Construction", () => {
  test("should create an instance with default settings", () => {
    const s = new Settings();
    expect(s).toBeDefined();
    const defaults = s.getSettings();
    expect(defaults.name).toBe("Settings");
    expect(defaults.theme).toBe("light");
    expect(defaults.notifications).toBe(true);
    expect(defaults.logs).toBe(true);
  });
});

describe("Settings - setTheme", () => {
  test("should set theme to dark", () => {
    const s = new Settings();
    s.setTheme("dark");
    expect(s.getSettings().theme).toBe("dark");
  });

  test("should set theme to light", () => {
    const s = new Settings();
    s.setTheme("dark");
    s.setTheme("light");
    expect(s.getSettings().theme).toBe("light");
  });

  test("should accept arbitrary string", () => {
    const s = new Settings();
    s.setTheme("high-contrast");
    expect(s.getSettings().theme).toBe("high-contrast");
  });
});

describe("Settings - setNotifications", () => {
  test("should disable notifications", () => {
    const s = new Settings();
    s.setNotifications(false);
    expect(s.getSettings().notifications).toBe(false);
  });

  test("should enable notifications", () => {
    const s = new Settings();
    s.setNotifications(false);
    s.setNotifications(true);
    expect(s.getSettings().notifications).toBe(true);
  });
});

describe("Settings - setLogs", () => {
  test("should disable logs", () => {
    const s = new Settings();
    s.setLogs(false);
    expect(s.getSettings().logs).toBe(false);
  });

  test("should enable logs", () => {
    const s = new Settings();
    s.setLogs(false);
    s.setLogs(true);
    expect(s.getSettings().logs).toBe(true);
  });
});

describe("Settings - Calibration methods", () => {
  test("startCalibration should not throw", () => {
    const s = new Settings();
    expect(() => s.startCalibration()).not.toThrow();
  });

  test("stopCalibration should not throw", () => {
    const s = new Settings();
    expect(() => s.stopCalibration()).not.toThrow();
  });
});
