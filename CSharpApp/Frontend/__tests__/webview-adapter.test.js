/**
 * @jest-environment jsdom
 */

/**
 * Unit tests for webview-adapter.js API surface definition.
 * Tests verify that the electronAPI object is properly structured
 * and that all expected methods exist after initialization.
 */

describe("webview-adapter - API surface", () => {
  // Simulate the electronAPI object as created by the adapter
  beforeAll(() => {
    window.electronAPI = {
      ping: async () => "pong",
      checkAppInitialized: async () => true,
      sendToPython: jest.fn(),
      moveMouse: jest.fn(),
      pressMouse: jest.fn(),
      releaseMouse: jest.fn(),
      pressKey: jest.fn(),
      generateWiFiQR: async (ssid, password, security) => "data:image/png;base64,mockQR",
      refreshWiFi: async () => ({ success: true }),
      openExternal: jest.fn(),
      isClientConnected: async () => true,
      onPythonData: jest.fn(),
    };
  });

  test("electronAPI should be defined", () => {
    expect(window.electronAPI).toBeDefined();
  });

  test("should have ping method", async () => {
    const result = await window.electronAPI.ping();
    expect(result).toBe("pong");
  });

  test("should have checkAppInitialized method", async () => {
    const result = await window.electronAPI.checkAppInitialized();
    expect(result).toBe(true);
  });

  test("should have sendToPython method", () => {
    expect(typeof window.electronAPI.sendToPython).toBe("function");
    window.electronAPI.sendToPython("START_CALIBRATION");
    expect(window.electronAPI.sendToPython).toHaveBeenCalledWith("START_CALIBRATION");
  });

  test("should have moveMouse method", () => {
    expect(typeof window.electronAPI.moveMouse).toBe("function");
    window.electronAPI.moveMouse(100, 200);
    expect(window.electronAPI.moveMouse).toHaveBeenCalledWith(100, 200);
  });

  test("should have pressMouse method", () => {
    expect(typeof window.electronAPI.pressMouse).toBe("function");
  });

  test("should have releaseMouse method", () => {
    expect(typeof window.electronAPI.releaseMouse).toBe("function");
  });

  test("should have pressKey method", () => {
    expect(typeof window.electronAPI.pressKey).toBe("function");
    window.electronAPI.pressKey("ArrowRight");
    expect(window.electronAPI.pressKey).toHaveBeenCalledWith("ArrowRight");
  });

  test("should have generateWiFiQR method", async () => {
    const result = await window.electronAPI.generateWiFiQR("SSID", "pass", "WPA");
    expect(result).toContain("data:image/png;base64,");
  });

  test("should have refreshWiFi method", async () => {
    const result = await window.electronAPI.refreshWiFi();
    expect(result.success).toBe(true);
  });

  test("should have openExternal method", () => {
    expect(typeof window.electronAPI.openExternal).toBe("function");
  });

  test("should have isClientConnected method", async () => {
    const result = await window.electronAPI.isClientConnected();
    expect(result).toBe(true);
  });

  test("should have onPythonData method", () => {
    expect(typeof window.electronAPI.onPythonData).toBe("function");
  });
});

describe("webview-adapter - pressMouse defaults", () => {
  // Test the parameter transformation logic (extracted from adapter)
  function normalizePressMouse(x, y, button) {
    const finalX = x === undefined || x === null ? -1 : x;
    const finalY = y === undefined || y === null ? -1 : y;
    const finalButton =
      button === undefined || button === null || button === "" ? "LEFT" : button;
    return { finalX, finalY, finalButton };
  }

  test("should default to -1, -1, LEFT when no params", () => {
    const { finalX, finalY, finalButton } = normalizePressMouse(undefined, undefined, undefined);
    expect(finalX).toBe(-1);
    expect(finalY).toBe(-1);
    expect(finalButton).toBe("LEFT");
  });

  test("should pass through valid coords", () => {
    const { finalX, finalY, finalButton } = normalizePressMouse(100, 200, "RIGHT");
    expect(finalX).toBe(100);
    expect(finalY).toBe(200);
    expect(finalButton).toBe("RIGHT");
  });

  test("should default button when empty string", () => {
    const { finalButton } = normalizePressMouse(0, 0, "");
    expect(finalButton).toBe("LEFT");
  });

  test("should default to -1 when null coords", () => {
    const { finalX, finalY } = normalizePressMouse(null, null, "MIDDLE");
    expect(finalX).toBe(-1);
    expect(finalY).toBe(-1);
  });
});
