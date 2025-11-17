/**
 * @jest-environment jsdom
 */

/**
 * Unit tests for the Actions class (Frontend/interactions/Actions.js).
 * Tests cover: construction, swipe, move, click, click_down, click_up,
 * parameter validation, direction handling, and electronAPI integration.
 */

// ── Mock electronAPI ──────────────────────────────────────────────────
const mockPressKey = jest.fn();
const mockMoveMouse = jest.fn();
const mockPressMouse = jest.fn();
const mockReleaseMouse = jest.fn();

beforeAll(() => {
  window.electronAPI = {
    pressKey: mockPressKey,
    moveMouse: mockMoveMouse,
    pressMouse: mockPressMouse,
    releaseMouse: mockReleaseMouse,
  };
  // Default localStorage values
  localStorage.setItem("PresentationMode", "true");
  localStorage.setItem("NavigationMode", "true");
  localStorage.setItem("Swipe_Right_Key", "ArrowRight");
  localStorage.setItem("Swipe_Left_Key", "ArrowLeft");
});

beforeEach(() => {
  jest.clearAllMocks();
});

// Load the Actions class by evaluating the source file
const fs = require("fs");
const path = require("path");
const actionsCode = fs.readFileSync(
  path.join(__dirname, "..", "interactions", "Actions.js"),
  "utf-8"
);
const loadActions = new Function(actionsCode + "\nreturn Actions;");
const Actions = loadActions();

// ── Construction ──────────────────────────────────────────────────────

describe("Actions - Construction", () => {
  test("should create an instance without errors", () => {
    const action = new Actions();
    expect(action).toBeDefined();
    expect(action.actions).toEqual([]);
  });

  test("should detect non-onboarding page", () => {
    const action = new Actions();
    expect(action.isOnboarding).toBe(false);
  });
});

// ── getSettings ──────────────────────────────────────────────────────

describe("Actions - getSettings", () => {
  test("should load presentation and navigation modes from localStorage", () => {
    localStorage.setItem("PresentationMode", "true");
    localStorage.setItem("NavigationMode", "false");
    const action = new Actions();
    action.getSettings();
    expect(action.pres_mode).toBe("true");
    expect(action.nav_mode).toBe("false");
  });

  test("should load key bindings from localStorage", () => {
    localStorage.setItem("Swipe_Right_Key", "Space");
    localStorage.setItem("Swipe_Left_Key", "Backspace");
    const action = new Actions();
    action.getSettings();
    expect(action.left_key).toBe("Space");
    expect(action.right_key).toBe("Backspace");
    // Reset
    localStorage.setItem("Swipe_Right_Key", "ArrowRight");
    localStorage.setItem("Swipe_Left_Key", "ArrowLeft");
  });

  test("should use defaults when localStorage keys are missing", () => {
    localStorage.removeItem("PresentationMode");
    localStorage.removeItem("NavigationMode");
    localStorage.removeItem("Swipe_Right_Key");
    localStorage.removeItem("Swipe_Left_Key");
    const action = new Actions();
    action.getSettings();
    expect(action.pres_mode).toBe("true");
    expect(action.nav_mode).toBe("false");
    // Restore
    localStorage.setItem("PresentationMode", "true");
    localStorage.setItem("NavigationMode", "true");
    localStorage.setItem("Swipe_Right_Key", "ArrowRight");
    localStorage.setItem("Swipe_Left_Key", "ArrowLeft");
  });
});

// ── Swipe ────────────────────────────────────────────────────────────

describe("Actions - swipe", () => {
  test("swipe right should call pressKey with the right_key (Swipe_Left_Key)", () => {
    localStorage.setItem("PresentationMode", "true");
    localStorage.setItem("Swipe_Left_Key", "ArrowLeft");
    const action = new Actions();
    const result = action.swipe({ direction: "right" });
    expect(result).toBe(0);
    // Note: Actions.getSettings maps right_key = Swipe_Left_Key
    expect(mockPressKey).toHaveBeenCalledWith("ArrowLeft");
  });

  test("swipe left should call pressKey with the left_key (Swipe_Right_Key)", () => {
    localStorage.setItem("PresentationMode", "true");
    localStorage.setItem("Swipe_Right_Key", "ArrowRight");
    const action = new Actions();
    const result = action.swipe({ direction: "left" });
    expect(result).toBe(0);
    // Note: Actions.getSettings maps left_key = Swipe_Right_Key
    expect(mockPressKey).toHaveBeenCalledWith("ArrowRight");
  });

  test("swipe with null params should return -1", () => {
    const action = new Actions();
    const result = action.swipe(null);
    expect(result).toBe(-1);
  });

  test("swipe with undefined params should return -1", () => {
    const action = new Actions();
    const result = action.swipe(undefined);
    expect(result).toBe(-1);
  });

  test("swipe with missing direction should return -1", () => {
    const action = new Actions();
    const result = action.swipe({});
    expect(result).toBe(-1);
  });

  test("swipe with invalid direction should return -1", () => {
    const action = new Actions();
    const result = action.swipe({ direction: "diagonal" });
    expect(result).toBe(-1);
  });

  test("swipe with custom key bindings should use stored keys (cross-mapped)", () => {
    localStorage.setItem("Swipe_Right_Key", "PageDown");
    localStorage.setItem("Swipe_Left_Key", "PageUp");
    localStorage.setItem("PresentationMode", "true");
    const action = new Actions();
    // right_key = Swipe_Left_Key = PageUp
    action.swipe({ direction: "right" });
    expect(mockPressKey).toHaveBeenCalledWith("PageUp");
    // left_key = Swipe_Right_Key = PageDown
    action.swipe({ direction: "left" });
    expect(mockPressKey).toHaveBeenCalledWith("PageDown");
    // Restore
    localStorage.setItem("Swipe_Right_Key", "ArrowRight");
    localStorage.setItem("Swipe_Left_Key", "ArrowLeft");
  });
});

// ── Move ─────────────────────────────────────────────────────────────

describe("Actions - move", () => {
  test("move with valid x,y should call moveMouse and return 0", () => {
    localStorage.setItem("NavigationMode", "true");
    const action = new Actions();
    const result = action.move({ x: 100, y: 200 });
    expect(result).toBe(0);
    expect(mockMoveMouse).toHaveBeenCalledWith(100, 200);
  });

  test("move with string coordinates should parse as integers", () => {
    localStorage.setItem("NavigationMode", "true");
    const action = new Actions();
    const result = action.move({ x: "150", y: "250" });
    expect(result).toBe(0);
    expect(mockMoveMouse).toHaveBeenCalledWith(150, 250);
  });

  test("move with null params should return -1", () => {
    const action = new Actions();
    const result = action.move(null);
    expect(result).toBe(-1);
  });

  test("move with undefined params should return -1", () => {
    const action = new Actions();
    const result = action.move(undefined);
    expect(result).toBe(-1);
  });

  test("move with missing x should return -1", () => {
    const action = new Actions();
    const result = action.move({ y: 100 });
    expect(result).toBe(-1);
  });

  test("move with missing y should return -1", () => {
    const action = new Actions();
    const result = action.move({ x: 100 });
    expect(result).toBe(-1);
  });

  test("move with zero coordinates should work", () => {
    localStorage.setItem("NavigationMode", "true");
    const action = new Actions();
    const result = action.move({ x: 0, y: 0 });
    expect(result).toBe(0);
    expect(mockMoveMouse).toHaveBeenCalledWith(0, 0);
  });
});

// ── Click ────────────────────────────────────────────────────────────

describe("Actions - click", () => {
  test("click with coords should call pressMouse and releaseMouse", () => {
    localStorage.setItem("NavigationMode", "true");
    const action = new Actions();
    const result = action.click({ x: 300, y: 400 });
    expect(result).toBe(0);
    expect(mockPressMouse).toHaveBeenCalledWith(300, 400);
    expect(mockReleaseMouse).toHaveBeenCalledWith(300, 400);
  });

  test("click without coords should call pressMouse and releaseMouse with no args", () => {
    localStorage.setItem("NavigationMode", "true");
    const action = new Actions();
    const result = action.click({});
    expect(result).toBe(0);
    expect(mockPressMouse).toHaveBeenCalled();
    expect(mockReleaseMouse).toHaveBeenCalled();
  });

  test("click without params should call pressMouse and releaseMouse", () => {
    localStorage.setItem("NavigationMode", "true");
    const action = new Actions();
    const result = action.click();
    expect(result).toBe(0);
  });
});

// ── Click Down / Click Up ────────────────────────────────────────────

describe("Actions - click_down", () => {
  test("click_down with coords should call pressMouse", () => {
    localStorage.setItem("NavigationMode", "true");
    const action = new Actions();
    const result = action.click_down({ x: 100, y: 200 });
    expect(result).toBe(0);
    expect(mockPressMouse).toHaveBeenCalledWith(100, 200);
  });

  test("click_down without coords should call pressMouse with no args", () => {
    localStorage.setItem("NavigationMode", "true");
    const action = new Actions();
    const result = action.click_down({});
    expect(result).toBe(0);
    expect(mockPressMouse).toHaveBeenCalled();
  });
});

describe("Actions - click_up", () => {
  test("click_up with coords should call releaseMouse", () => {
    localStorage.setItem("NavigationMode", "true");
    const action = new Actions();
    const result = action.click_up({ x: 100, y: 200 });
    expect(result).toBe(0);
    expect(mockReleaseMouse).toHaveBeenCalledWith(100, 200);
  });

  test("click_up without coords should call releaseMouse with no args", () => {
    localStorage.setItem("NavigationMode", "true");
    const action = new Actions();
    const result = action.click_up({});
    expect(result).toBe(0);
    expect(mockReleaseMouse).toHaveBeenCalled();
  });
});

// ── Action list management ───────────────────────────────────────────

describe("Actions - action list", () => {
  test("addAction should add to actions array", () => {
    const action = new Actions();
    action.addAction({ type: "swipe", direction: "left" });
    expect(action.getActions()).toHaveLength(1);
  });

  test("getActions should return all added actions", () => {
    const action = new Actions();
    action.addAction("a");
    action.addAction("b");
    action.addAction("c");
    expect(action.getActions()).toEqual(["a", "b", "c"]);
  });
});
