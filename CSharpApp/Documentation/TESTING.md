# LighTouch — Test Coverage Documentation

> **Last updated:** February 2026
> **Test frameworks:** xUnit 2.9 (C#) · Jest 29 (JavaScript)
> **Coverage tools:** Coverlet (C#) · Jest built-in (JS)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Test Architecture](#2-test-architecture)
3. [C# Backend Tests](#3-c-backend-tests)
   - 3.1 [TcpClientHandler](#31-tcpclienthandler-tests)
   - 3.2 [TcpServerHandler](#32-tcpserverhandler-tests)
   - 3.3 [UdpDiscoveryService](#33-udpdiscoveryservice-tests)
   - 3.4 [WiFiManager](#34-wifimanager-tests)
   - 3.5 [MouseKeyboardController](#35-mousekeyboardcontroller-tests)
   - 3.6 [ResourceExtractor](#36-resourceextractor-tests)
   - 3.7 [BluetoothHandler](#37-bluetoothhandler-tests)
   - 3.8 [ServerDiscoveredEventArgs](#38-serverdiscoveredeventargs-tests)
4. [JavaScript Frontend Tests](#4-javascript-frontend-tests)
   - 4.1 [Actions](#41-actions-tests)
   - 4.2 [Settings](#42-settings-tests)
   - 4.3 [Renderer / Message Handling](#43-renderer--message-handling-tests)
   - 4.4 [WebView Adapter](#44-webview-adapter-tests)
   - 4.5 [Key Bindings](#45-key-binding-tests)
   - 4.6 [Multi-Language](#46-multi-language-tests)
5. [Test Policies](#5-test-policies)
6. [Running the Tests](#6-running-the-tests)
7. [Coverage Reports](#7-coverage-reports)
8. [Known Limitations](#8-known-limitations)
9. [Contributing New Tests](#9-contributing-new-tests)

---

## 1. Overview

The LighTouch test suite provides **253 automated tests** across the full stack:

| Layer | Framework | Test Count | Location |
|-------|-----------|-----------|----------|
| C# Backend Services | xUnit + FluentAssertions | **113** | `CSharpApp.Tests/Services/` |
| JavaScript Frontend | Jest + jsdom | **140** | `CSharpApp/Frontend/__tests__/` |

The test suite covers:
- **Network communication** (TCP client/server, UDP discovery)
- **Hardware abstraction** (mouse, keyboard, Bluetooth)
- **WiFi management & QR code generation**
- **Resource extraction** (embedded wwwroot)
- **Frontend actions** (swipe, move, click, click_down, click_up)
- **Settings management** (theme, notifications, modes)
- **Message protocol** (JSON parsing, category routing, buffer handling)
- **Internationalisation** (EN/FR translation completeness)
- **WebView2 bridge API surface**
- **Key binding system**

---

## 2. Test Architecture

```
Software/
├── CSharpApp.Tests/                    # C# test project (xUnit)
│   ├── CSharpApp.Tests.csproj
│   └── Services/
│       ├── TcpClientHandlerTests.cs    # 20 tests
│       ├── TcpServerHandlerTests.cs    # 14 tests
│       ├── UdpDiscoveryServiceTests.cs # 15 tests
│       ├── WiFiManagerTests.cs         # 12 tests
│       ├── MouseKeyboardControllerTests.cs # 22 tests
│       ├── ResourceExtractorTests.cs   # 3 tests
│       ├── BluetoothHandlerTests.cs    # 7 tests
│       └── ServerDiscoveredEventArgsTests.cs # 3 tests
│
└── CSharpApp/
    └── Frontend/
        ├── package.json                # Jest dependencies
        ├── jest.config.js              # Jest configuration
        └── __tests__/
            ├── Actions.test.js         # 28 tests
            ├── Settings.test.js        # 10 tests
            ├── renderer.test.js        # 24 tests
            ├── webview-adapter.test.js # 16 tests
            ├── key_binding.test.js     # 12 tests
            └── multi-lang.test.js      # ~50 tests
```

### Dependency Graph

```
CSharpApp.Tests.csproj
  ├── references → LighTouch.csproj (project-under-test)
  ├── xunit 2.9.2
  ├── FluentAssertions 6.12.1
  ├── Moq 4.20.72
  └── coverlet.collector 6.0.2

Frontend/__tests__/
  ├── jest 29.7
  └── jest-environment-jsdom 29.7
```

---

## 3. C# Backend Tests

### 3.1 TcpClientHandler Tests

**File:** `CSharpApp.Tests/Services/TcpClientHandlerTests.cs`

| Category | Tests | Description |
|----------|-------|-------------|
| Construction & Defaults | 4 | Default `ServerHost`, `ServerPort`, `ReconnectDelayMs` values; property setters |
| Lifecycle | 4 | `StartAsync` idempotency, `Stop` before/after start, double `Dispose` |
| Connection State | 2 | `IsClientConnected` returns `false` initially and when no server exists |
| Sending Messages | 4 | `SendMessage` with string, object, empty, and null when disconnected |
| Events | 3 | `MessageReceived`, `ServerConnected`, `ServerDisconnected` subscription |
| Integration | 2 | Full connect→send→receive→disconnect cycle; automatic reconnection after server restart |

**Integration tests** spin up a real `TcpListener` on localhost, accept the handler's connection, exchange messages, and verify events fire correctly.

### 3.2 TcpServerHandler Tests

**File:** `CSharpApp.Tests/Services/TcpServerHandlerTests.cs`

| Category | Tests | Description |
|----------|-------|-------------|
| Construction & Defaults | 3 | Default `Port`, `AllowMultipleClients`; property setters |
| Lifecycle | 2 | `Stop`/`Dispose` safety when not started |
| Connection State | 1 | `IsClientConnected` returns `false` initially |
| Sending Messages | 1 | `SendMessage` when no client connected |
| Events | 3 | Event subscription for `MessageReceived`, `ClientConnected`, `ClientDisconnected` |
| Integration | 3 | Accept client & receive message; send message to client; detect client disconnection |

### 3.3 UdpDiscoveryService Tests

**File:** `CSharpApp.Tests/Services/UdpDiscoveryServiceTests.cs`

| Category | Tests | Description |
|----------|-------|-------------|
| Construction | 2 | Default and custom port constructors |
| Lifecycle | 5 | `StartAsync` idempotency, `Stop` before/after start, double `Dispose` |
| Events | 1 | `ServerDiscovered` subscription |
| Valid Discovery | 3 | Valid broadcast triggers event; empty IP falls back to sender IP; multiple broadcasts handled |
| Invalid Messages | 2 | Invalid JSON ignored; wrong message type (`client_heartbeat`) ignored |

### 3.4 WiFiManager Tests

**File:** `CSharpApp.Tests/Services/WiFiManagerTests.cs`

| Category | Tests | Description |
|----------|-------|-------------|
| Construction | 1 | Constructor does not throw |
| QR Code Generation | 7 | Valid params, empty password, empty SSID, special characters, long SSID, different security types, Unicode SSID |
| WiFi Info (Integration) | 4 | `GetCurrentWiFiInfo` and `GetSavedWiFiProfiles` return valid JSON with `success` field |

> **Note:** WiFi info tests depend on the Windows `netsh` command and will return actual system data. They verify JSON structure, not specific network details.

### 3.5 MouseKeyboardController Tests

**File:** `CSharpApp.Tests/Services/MouseKeyboardControllerTests.cs`

| Category | Tests | Description |
|----------|-------|-------------|
| Construction | 1 | Constructor does not throw |
| MoveMouse | 4 | Valid, zero, negative, and very large coordinates |
| PressMouse | 4 | Default params, with coordinates, LEFT/RIGHT/MIDDLE buttons, unknown button |
| ReleaseMouse | 4 | Same as PressMouse |
| PressKey — Arrow | 4 | ArrowLeft, ArrowRight, ArrowUp, ArrowDown |
| PressKey — Special | 11 | space, enter, escape, tab, backspace, delete, home, end, pageup, pagedown, insert |
| PressKey — Function | 3 | f1, f5, f12 |
| PressKey — Single char | 4 | a, z, 1, 9 |
| PressKey — Edge cases | 3 | Unrecognised key, "esc" abbreviation, "del" abbreviation |
| Full Cycle | 1 | Press + Release in one sequence |

> **Note:** These tests verify that Win32 API calls do **not crash**. Actual cursor/keyboard effects cannot be asserted in a test environment.

### 3.6 ResourceExtractor Tests

**File:** `CSharpApp.Tests/Services/ResourceExtractorTests.cs`

| Category | Tests | Description |
|----------|-------|-------------|
| Path Extraction | 3 | Returns valid path or expected exception (Debug mode); path under temp directory; idempotent caching |

### 3.7 BluetoothHandler Tests

**File:** `CSharpApp.Tests/Services/BluetoothHandlerTests.cs`

| Category | Tests | Description |
|----------|-------|-------------|
| Construction | 1 | Constructor does not throw |
| Lifecycle | 2 | First `Dispose` works; double `Dispose` documents known CTS limitation |
| Sending | 2 | `SendMessage` when not connected; empty message |
| Events | 1 | `MessageReceived` subscription |

> **Note:** BluetoothHandler is a **legacy** service kept for regression. Double `Dispose` raises `ObjectDisposedException` on the internal `CancellationTokenSource` — this is documented in the test.

### 3.8 ServerDiscoveredEventArgs Tests

**File:** `CSharpApp.Tests/Services/ServerDiscoveredEventArgsTests.cs`

| Category | Tests | Description |
|----------|-------|-------------|
| Properties | 1 | Set and retrieve `ServerIp`, `ServerPort`, `ServerName` |
| Defaults | 1 | Default values are null/0 |
| Inheritance | 1 | Inherits from `EventArgs` |

---

## 4. JavaScript Frontend Tests

### 4.1 Actions Tests

**File:** `CSharpApp/Frontend/__tests__/Actions.test.js`

| Category | Tests | Description |
|----------|-------|-------------|
| Construction | 2 | Instance creation; non-onboarding page detection |
| getSettings | 3 | Loads modes from localStorage; loads key bindings; uses defaults when missing |
| Swipe | 6 | Right/left directions with cross-mapped keys; null/undefined/missing/invalid params return -1; custom key bindings |
| Move | 7 | Valid coords; string coords; null/undefined/missing x/missing y params; zero coords |
| Click | 3 | With coordinates; without coordinates; no params |
| Click Down | 2 | With and without coordinates |
| Click Up | 2 | With and without coordinates |
| Action List | 2 | `addAction` and `getActions` |

> **Important:** The Actions class uses **cross-mapped key bindings** (`left_key = Swipe_Right_Key`, `right_key = Swipe_Left_Key`). Tests document this intentional design decision.

### 4.2 Settings Tests

**File:** `CSharpApp/Frontend/__tests__/Settings.test.js`

| Category | Tests | Description |
|----------|-------|-------------|
| Construction | 1 | Default settings (name, theme, notifications, logs) |
| setTheme | 3 | Dark, light, arbitrary string |
| setNotifications | 2 | Enable and disable |
| setLogs | 2 | Enable and disable |
| Calibration | 2 | `startCalibration` and `stopCalibration` do not throw |

### 4.3 Renderer / Message Handling Tests

**File:** `CSharpApp/Frontend/__tests__/renderer.test.js`

| Category | Tests | Description |
|----------|-------|-------------|
| checkMessage — Valid | 5 | actions/swipe, actions/move, actions/click, settings/swipe, settings/move |
| checkMessage — Invalid | 10 | Empty, whitespace, invalid JSON, malformed JSON, unknown category/method, missing fields, null values, numeric values |
| updateConnectionStatus | 3 | Function exists; sets connected text; sets disconnected text |
| processTcpMessage | 3 | Function definable; handles malformed JSON; handles valid JSON |
| JSON Buffer Extraction | 4 | Single object; multiple objects; empty buffer; garbage between objects |

### 4.4 WebView Adapter Tests

**File:** `CSharpApp/Frontend/__tests__/webview-adapter.test.js`

| Category | Tests | Description |
|----------|-------|-------------|
| API Surface | 12 | All methods exist: `ping`, `checkAppInitialized`, `sendToPython`, `moveMouse`, `pressMouse`, `releaseMouse`, `pressKey`, `generateWiFiQR`, `refreshWiFi`, `openExternal`, `isClientConnected`, `onPythonData` |
| pressMouse Defaults | 4 | Default -1/-1/LEFT; valid coord pass-through; empty button defaults; null coords |

### 4.5 Key Binding Tests

**File:** `CSharpApp/Frontend/__tests__/key_binding.test.js`

| Category | Tests | Description |
|----------|-------|-------------|
| getDisplayKey | 2 | Space character conversion; non-space pass-through |
| getTranslatedKey | 5 | Default English; stored English; French ArrowRight/ArrowLeft; no-translation fallback |
| isKeyUsedElsewhere | 4 | No conflict; conflict detected; empty array; multiple keys |

### 4.6 Multi-Language Tests

**File:** `CSharpApp/Frontend/__tests__/multi-lang.test.js`

| Category | Tests | Description |
|----------|-------|-------------|
| Language Completeness | 3 | Both languages exist; same keys; no empty values |
| Core Keys | 14×2 | Core UI keys exist in EN and FR |
| Onboarding Keys | 7 | All onboarding step keys in both languages |
| WiFi Keys | 7 | WiFi-related keys in both languages |
| DOM Application | 4 | Apply English; apply French; placeholder translation; unknown language graceful |

---

## 5. Test Policies

### 5.1 Naming Convention

**C# tests** follow the pattern: `MethodName_Scenario_ExpectedBehaviour`

```csharp
[Fact]
public void SendMessage_WhenNotConnected_ShouldNotThrow()
```

**JavaScript tests** use descriptive strings inside `test()`:

```javascript
test("swipe right should call pressKey with the right_key", () => { ... })
```

### 5.2 Test Categories

Every test file covers these categories (when applicable):

| Category | Purpose |
|----------|---------|
| **Construction** | Verify object initialisation and default values |
| **Lifecycle** | Start, stop, dispose — including double-dispose safety |
| **Happy Path** | Normal operations with valid inputs |
| **Edge Cases** | Null, empty, negative, very large inputs |
| **Error Handling** | Invalid data, disconnected state, malformed messages |
| **Events** | Event subscription, firing, and correct payloads |
| **Integration** | End-to-end flows (real sockets, full message cycles) |

### 5.3 Assertion Library

- **C#:** FluentAssertions for readable assertions (`result.Should().BeTrue()`)
- **JavaScript:** Jest built-in matchers (`expect(result).toBe(0)`)

### 5.4 Test Isolation

- Each test class in C# implements `IDisposable` to clean up resources.
- Network tests use **ephemeral ports** (`GetFreePort()`) to avoid conflicts.
- JavaScript tests use `beforeEach(() => jest.clearAllMocks())` to reset state.
- localStorage is restored after mutation in JS tests.

### 5.5 Integration vs Unit Tests

| Type | Scope | Examples |
|------|-------|---------|
| **Unit** | Single method, no I/O | QR code generation, key conversion, message validation |
| **Integration** | Real sockets, OS commands | TCP connect/send/receive, WiFi info retrieval |

Integration tests that depend on network or OS are kept fast by using `localhost` and ephemeral ports. WiFi tests rely on the `netsh` command and will reflect the host machine's state.

### 5.6 Known Design Decisions Documented in Tests

1. **Cross-mapped key bindings in Actions.js** — `left_key` reads from `Swipe_Right_Key` and vice versa. Tests explicitly document and verify this.
2. **BluetoothHandler double-dispose** — `CancellationTokenSource` throws `ObjectDisposedException` on second dispose. Test documents this as a known limitation.
3. **Auto-connect message** — `TcpClientHandler` sends a status message upon connecting. Integration tests skip this first message.

---

## 6. Running the Tests

### C# Backend Tests

```bash
# From the Software/ directory

# Run all tests
dotnet test CSharpApp.Tests/CSharpApp.Tests.csproj

# Run with verbose output
dotnet test CSharpApp.Tests/CSharpApp.Tests.csproj --verbosity normal

# Run a specific test class
dotnet test --filter "FullyQualifiedName~TcpClientHandlerTests"

# Run with coverage (Coverlet)
dotnet test CSharpApp.Tests/CSharpApp.Tests.csproj /p:CollectCoverage=true /p:CoverletOutputFormat=lcov /p:CoverletOutput=./coverage/
```

### JavaScript Frontend Tests

```bash
# From the CSharpApp/Frontend/ directory

# Install dependencies (first time only)
npm install

# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode (TDD)
npm run test:watch
```

---

## 7. Coverage Reports

### C# Coverage

Generate with Coverlet:

**Bash/Linux/macOS:**
```bash
# From the Software/ directory
dotnet test CSharpApp.Tests/CSharpApp.Tests.csproj \
  /p:CollectCoverage=true \
  /p:CoverletOutputFormat=lcov \
  /p:CoverletOutput=./coverage/ \
  /p:Include="[LighTouch]*"
```

**PowerShell/Windows:**
```powershell
# From the Software/ directory
dotnet test CSharpApp.Tests/CSharpApp.Tests.csproj `
  /p:CollectCoverage=true `
  /p:CoverletOutputFormat=lcov `
  /p:CoverletOutput=./coverage/ `
  /p:Include="[LighTouch]*"

# Or on one line:
dotnet test CSharpApp.Tests/CSharpApp.Tests.csproj /p:CollectCoverage=true /p:CoverletOutputFormat=lcov /p:CoverletOutput=./coverage/ /p:Include="[LighTouch]*"
```

Output: `CSharpApp.Tests/coverage/coverage.info` (importable into VS Code, SonarQube, etc.)

### JavaScript Coverage

```bash
cd CSharpApp/Frontend
npm run test:coverage
```

Output: `CSharpApp/Frontend/coverage/` (HTML report viewable in browser)

### Coverage Targets

| Module | Target | Notes |
|--------|--------|-------|
| Services (C#) | ≥ 80% line coverage | Excludes Win32 API side-effects |
| Frontend interactions | ≥ 90% branch coverage | All action methods tested |
| Frontend settings | ≥ 85% line coverage | DOM-dependent code excluded |
| Translations | 100% key coverage | All i18n keys verified for both languages |

---

## 8. Known Limitations

| Limitation | Reason | Mitigation |
|------------|--------|------------|
| `MouseKeyboardController` — cannot assert cursor position | Win32 `SendInput` requires a real desktop session | Tests verify no-crash only |
| `WiFiManager` — results vary by machine | Tests call real `netsh wlan` commands | Tests verify JSON structure, not specific data |
| `ResourceExtractor` — may throw in Debug | Embedded resources only exist in Release builds | Test catches expected exception |
| `BluetoothHandler` — double-dispose CTS bug | Production code doesn't guard against it | Test documents the behaviour |
| Legacy `renderer.test.js` — excluded | Requires Electron `ipcRenderer` not available in jsdom | New `__tests__/renderer.test.js` covers the same logic |

---

## 9. Contributing New Tests

### Adding a C# Test

1. Create a file in `CSharpApp.Tests/Services/` following the naming pattern `{ClassName}Tests.cs`.
2. Use `IDisposable` if the handler allocates resources.
3. Use `GetFreePort()` for any TCP/UDP test to avoid port conflicts.
4. Follow the category structure: Construction → Lifecycle → Happy Path → Edge Cases → Events → Integration.
5. Run `dotnet test` to validate.

### Adding a JavaScript Test

1. Create a file in `CSharpApp/Frontend/__tests__/` with suffix `.test.js`.
2. Use `@jest-environment jsdom` if DOM access is needed.
3. Load source files via `new Function(code + "\\nreturn ClassName;")` pattern (no `require` — sources are not CommonJS modules).
4. Mock `window.electronAPI` in `beforeAll`.
5. Clear mocks in `beforeEach`.
6. Run `npm test` to validate.

### Checklist for PRs

- [ ] All existing tests still pass (`dotnet test` + `npm test`)
- [ ] New code has corresponding test(s)
- [ ] Edge cases (null, empty, invalid) are covered
- [ ] Integration tests use ephemeral ports
- [ ] No hardcoded delays > 5 seconds in tests
- [ ] Test names describe the scenario and expected outcome
