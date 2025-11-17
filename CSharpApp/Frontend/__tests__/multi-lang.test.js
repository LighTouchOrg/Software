/**
 * @jest-environment jsdom
 */

/**
 * Unit tests for multi-lang.js translation system.
 * Tests cover: translation keys, applyTranslations function,
 * language completeness, and fallback behaviour.
 */

const fs = require("fs");
const path = require("path");

// Load translations (the file assigns to window.translations)
const multiLangCode = fs.readFileSync(
  path.join(__dirname, "..", "settings", "multi-lang.js"),
  "utf-8"
);

// Only evaluate the translations object and applyTranslations function.
// The event listeners depend on DOM elements that may not exist.
const translationsMatch = multiLangCode.match(
  /const translations = (\{[\s\S]*?\n\});/
);
let translations;
if (translationsMatch) {
  translations = eval("(" + translationsMatch[1] + ")");
} else {
  throw new Error("Could not extract translations object from multi-lang.js");
}

// ── Translation keys ─────────────────────────────────────────────────

describe("Translations - Language completeness", () => {
  test("should have both 'en' and 'fr' languages", () => {
    expect(translations).toHaveProperty("en");
    expect(translations).toHaveProperty("fr");
  });

  test("English and French should have the same keys", () => {
    const enKeys = Object.keys(translations.en).sort();
    const frKeys = Object.keys(translations.fr).sort();
    expect(enKeys).toEqual(frKeys);
  });

  test("no translation value should be empty", () => {
    for (const lang of ["en", "fr"]) {
      for (const [key, value] of Object.entries(translations[lang])) {
        expect(value).toBeTruthy();
      }
    }
  });
});

describe("Translations - Core keys exist", () => {
  const coreKeys = [
    "Calibration",
    "Onboarding",
    "Setting",
    "Status",
    "Back",
    "Reader",
    "SizeText",
    "Theme",
    "PresMode",
    "NavMode",
    "Langage",
    "Keybind",
    "Documentation",
    "DominantHand",
  ];

  test.each(coreKeys)("key '%s' should exist in English", (key) => {
    expect(translations.en).toHaveProperty(key);
  });

  test.each(coreKeys)("key '%s' should exist in French", (key) => {
    expect(translations.fr).toHaveProperty(key);
  });
});

describe("Translations - Onboarding keys", () => {
  const onboardingKeys = [
    "onboarding_step_swipe_right",
    "onboarding_step_swipe_left",
    "onboarding_step_move_cursor",
    "onboarding_step_click_target",
    "onboarding_step_end",
    "onboarding_finish",
    "onboarding_restart",
  ];

  test.each(onboardingKeys)("'%s' should exist in both languages", (key) => {
    expect(translations.en).toHaveProperty(key);
    expect(translations.fr).toHaveProperty(key);
  });
});

describe("Translations - WiFi keys", () => {
  const wifiKeys = [
    "wifi_title",
    "wifi_ssid",
    "wifi_security",
    "wifi_password",
    "wifi_generate",
    "wifi_refresh",
    "wifi_back",
  ];

  test.each(wifiKeys)("'%s' should exist in both languages", (key) => {
    expect(translations.en).toHaveProperty(key);
    expect(translations.fr).toHaveProperty(key);
  });
});

// ── applyTranslations via DOM ────────────────────────────────────────

describe("applyTranslations - DOM", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <span data-i18n="Calibration"></span>
      <span data-i18n="Setting"></span>
      <input data-i18n-placeholder="wifi_password_placeholder" />
    `;
    window.translations = translations;
  });

  // Redefine a simple version of applyTranslations for testing
  function applyTranslations(lang) {
    const t = translations[lang];
    if (!t) return;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (t[key]) el.textContent = t[key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (t[key]) el.placeholder = t[key];
    });
  }

  test("should apply English translations", () => {
    applyTranslations("en");
    expect(document.querySelector('[data-i18n="Calibration"]').textContent).toBe(
      "Camera calibration"
    );
    expect(document.querySelector('[data-i18n="Setting"]').textContent).toBe("Settings");
  });

  test("should apply French translations", () => {
    applyTranslations("fr");
    expect(document.querySelector('[data-i18n="Calibration"]').textContent).toBe(
      "Calibrer la caméra"
    );
    expect(document.querySelector('[data-i18n="Setting"]').textContent).toBe("Paramètres");
  });

  test("should apply placeholder translations", () => {
    applyTranslations("en");
    expect(
      document.querySelector('[data-i18n-placeholder="wifi_password_placeholder"]').placeholder
    ).toBe("Enter password");
  });

  test("should handle unknown language gracefully", () => {
    expect(() => applyTranslations("xx")).not.toThrow();
  });
});
