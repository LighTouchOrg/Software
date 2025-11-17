/**
 * @jest-environment jsdom
 */

/**
 * Unit tests for key_binding.js functions.
 * Tests cover: getDisplayKey, getTranslatedKey, isKeyUsedElsewhere.
 */

// ── Extract functions ────────────────────────────────────────────────

const keyTranslations = {
  ArrowLeft: "Flèche gauche",
  ArrowRight: "Flèche droite",
  ArrowUp: "Flèche haut",
  ArrowDown: "Flèche bas",
  Space: "Espace",
};

function getDisplayKey(key) {
  if (key === " ") return "Space";
  return key;
}

function getTranslatedKey(storageKey, defaultKey, lang = "en") {
  const storedKey = localStorage.getItem(storageKey) || defaultKey;
  return lang === "fr" ? keyTranslations[storedKey] || storedKey : storedKey;
}

function isKeyUsedElsewhere(key, otherKeys) {
  return otherKeys.some((k) => localStorage.getItem(k) === key);
}

// ── getDisplayKey Tests ──────────────────────────────────────────────

describe("getDisplayKey", () => {
  test("should convert space character to 'Space'", () => {
    expect(getDisplayKey(" ")).toBe("Space");
  });

  test("should return key unchanged for non-space", () => {
    expect(getDisplayKey("ArrowLeft")).toBe("ArrowLeft");
    expect(getDisplayKey("a")).toBe("a");
    expect(getDisplayKey("F5")).toBe("F5");
  });
});

// ── getTranslatedKey Tests ───────────────────────────────────────────

describe("getTranslatedKey", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("should return default key in English when nothing is stored", () => {
    expect(getTranslatedKey("Swipe_Right_Key", "ArrowRight", "en")).toBe("ArrowRight");
  });

  test("should return stored key in English", () => {
    localStorage.setItem("Swipe_Right_Key", "PageDown");
    expect(getTranslatedKey("Swipe_Right_Key", "ArrowRight", "en")).toBe("PageDown");
  });

  test("should return French translation for ArrowRight", () => {
    expect(getTranslatedKey("Swipe_Right_Key", "ArrowRight", "fr")).toBe("Flèche droite");
  });

  test("should return French translation for ArrowLeft", () => {
    expect(getTranslatedKey("Swipe_Left_Key", "ArrowLeft", "fr")).toBe("Flèche gauche");
  });

  test("should return raw key in French when no translation exists", () => {
    localStorage.setItem("Swipe_Right_Key", "NumPad5");
    expect(getTranslatedKey("Swipe_Right_Key", "ArrowRight", "fr")).toBe("NumPad5");
  });
});

// ── isKeyUsedElsewhere Tests ─────────────────────────────────────────

describe("isKeyUsedElsewhere", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("should return false when no conflict", () => {
    localStorage.setItem("Swipe_Left_Key", "ArrowLeft");
    expect(isKeyUsedElsewhere("ArrowRight", ["Swipe_Left_Key"])).toBe(false);
  });

  test("should return true when key conflicts", () => {
    localStorage.setItem("Swipe_Left_Key", "ArrowRight");
    expect(isKeyUsedElsewhere("ArrowRight", ["Swipe_Left_Key"])).toBe(true);
  });

  test("should return false with empty other keys", () => {
    expect(isKeyUsedElsewhere("ArrowRight", [])).toBe(false);
  });

  test("should check multiple other keys", () => {
    localStorage.setItem("Key_A", "Space");
    localStorage.setItem("Key_B", "Enter");
    expect(isKeyUsedElsewhere("Space", ["Key_A", "Key_B"])).toBe(true);
    expect(isKeyUsedElsewhere("Tab", ["Key_A", "Key_B"])).toBe(false);
  });
});
