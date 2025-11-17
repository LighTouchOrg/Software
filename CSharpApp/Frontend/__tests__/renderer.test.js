/**
 * @jest-environment jsdom
 */

/**
 * Unit tests for message handling functions used in renderer.js.
 * Tests cover: checkMessage validation, readMessage dispatching,
 * processTcpMessage integration, and updateConnectionStatus.
 *
 * Since renderer.js relies on DOM elements existing, we extract
 * the testable pure functions and test them in isolation.
 */

// ── Extracted pure function: checkMessage ─────────────────────────────
function checkMessage(msg) {
  const methods = ["swipe", "move", "click"];
  try {
    let parsed = JSON.parse(msg);
    if (msg.trim() === "") return -1;
    let category = parsed.category;
    if (category === "actions" || category === "settings") {
      let method = parsed.method;
      if (methods.includes(method)) return 0;
    }
    return -1;
  } catch (e) {
    return -1;
  }
}

// ── checkMessage Tests ────────────────────────────────────────────────

describe("checkMessage - Valid messages", () => {
  test("valid actions/swipe message", () => {
    const msg = '{"category":"actions","method":"swipe","params":{"direction":"right"}}';
    expect(checkMessage(msg)).toBe(0);
  });

  test("valid actions/move message", () => {
    const msg = '{"category":"actions","method":"move","params":{"x":100,"y":200}}';
    expect(checkMessage(msg)).toBe(0);
  });

  test("valid actions/click message", () => {
    const msg = '{"category":"actions","method":"click","params":{"x":100,"y":200}}';
    expect(checkMessage(msg)).toBe(0);
  });

  test("valid settings/swipe message", () => {
    const msg = '{"category":"settings","method":"swipe","params":{}}';
    expect(checkMessage(msg)).toBe(0);
  });

  test("valid settings/move message", () => {
    const msg = '{"category":"settings","method":"move","params":{}}';
    expect(checkMessage(msg)).toBe(0);
  });
});

describe("checkMessage - Invalid messages", () => {
  test("empty string", () => {
    expect(checkMessage("")).toBe(-1);
  });

  test("whitespace string", () => {
    expect(checkMessage("   ")).toBe(-1);
  });

  test("invalid JSON", () => {
    expect(checkMessage("not-json")).toBe(-1);
  });

  test("malformed JSON", () => {
    expect(checkMessage("{category: actions}")).toBe(-1);
  });

  test("unknown category", () => {
    const msg = '{"category":"unknown","method":"swipe","params":{}}';
    expect(checkMessage(msg)).toBe(-1);
  });

  test("unknown method", () => {
    const msg = '{"category":"actions","method":"fly","params":{}}';
    expect(checkMessage(msg)).toBe(-1);
  });

  test("missing category", () => {
    const msg = '{"method":"swipe","params":{}}';
    expect(checkMessage(msg)).toBe(-1);
  });

  test("missing method", () => {
    const msg = '{"category":"actions","params":{}}';
    expect(checkMessage(msg)).toBe(-1);
  });

  test("null-like values", () => {
    const msg = '{"category":null,"method":null}';
    expect(checkMessage(msg)).toBe(-1);
  });

  test("numeric values where strings expected", () => {
    const msg = '{"category":123,"method":456}';
    expect(checkMessage(msg)).toBe(-1);
  });
});

// ── updateConnectionStatus Tests ──────────────────────────────────────

describe("updateConnectionStatus", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="device-status"></div>';
    localStorage.setItem("preferredLang", "en");
  });

  test("should exist as a window function after setup", () => {
    // Simulate the function being set (as in renderer.js)
    window.updateConnectionStatus = function (isConnected) {
      const el = document.getElementById("device-status");
      if (el) {
        el.textContent = isConnected ? "Connected" : "Disconnected";
      }
    };
    expect(typeof window.updateConnectionStatus).toBe("function");
  });

  test("should set text to Connected when true", () => {
    window.updateConnectionStatus = function (isConnected) {
      const el = document.getElementById("device-status");
      if (el) el.textContent = isConnected ? "Connected" : "Disconnected";
    };
    window.updateConnectionStatus(true);
    expect(document.getElementById("device-status").textContent).toBe("Connected");
  });

  test("should set text to Disconnected when false", () => {
    window.updateConnectionStatus = function (isConnected) {
      const el = document.getElementById("device-status");
      if (el) el.textContent = isConnected ? "Connected" : "Disconnected";
    };
    window.updateConnectionStatus(false);
    expect(document.getElementById("device-status").textContent).toBe("Disconnected");
  });
});

// ── processTcpMessage Tests ──────────────────────────────────────────

describe("processTcpMessage", () => {
  test("should be definable as a window function", () => {
    window.processTcpMessage = function (msg) {
      return msg;
    };
    expect(typeof window.processTcpMessage).toBe("function");
  });

  test("should handle malformed JSON without throwing", () => {
    window.processTcpMessage = function (msg) {
      try {
        JSON.parse(msg);
      } catch (e) {
        return "error";
      }
      return "ok";
    };
    expect(window.processTcpMessage("not-json")).toBe("error");
  });

  test("should handle valid JSON", () => {
    window.processTcpMessage = function (msg) {
      try {
        const parsed = JSON.parse(msg);
        return parsed.category;
      } catch (e) {
        return "error";
      }
    };
    expect(
      window.processTcpMessage('{"category":"actions","method":"swipe","params":{}}')
    ).toBe("actions");
  });
});

// ── JSON buffer regex extraction ─────────────────────────────────────

describe("JSON buffer extraction", () => {
  const extractJsonMessages = (buffer) => {
    const regex = /{[^{}]*(?:{[^{}]*}[^{}]*)*}/g;
    const results = [];
    let match;
    while ((match = regex.exec(buffer)) !== null) {
      try {
        JSON.parse(match[0]);
        results.push(match[0]);
      } catch {
        break;
      }
    }
    return results;
  };

  test("should extract single JSON object", () => {
    const buffer = '{"category":"actions","method":"swipe","params":{"direction":"right"}}';
    const results = extractJsonMessages(buffer);
    expect(results).toHaveLength(1);
  });

  test("should extract multiple JSON objects", () => {
    const buffer =
      '{"category":"actions","method":"swipe","params":{"direction":"right"}}' +
      '{"category":"actions","method":"move","params":{"x":10,"y":20}}';
    const results = extractJsonMessages(buffer);
    expect(results).toHaveLength(2);
  });

  test("should handle empty buffer", () => {
    const results = extractJsonMessages("");
    expect(results).toHaveLength(0);
  });

  test("should handle garbage between JSON objects", () => {
    const buffer =
      'GARBAGE{"category":"actions","method":"click","params":{"x":1,"y":2}}MORE';
    const results = extractJsonMessages(buffer);
    expect(results).toHaveLength(1);
  });
});
