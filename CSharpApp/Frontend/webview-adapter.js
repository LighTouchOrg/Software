// WebView2 adapter to make the C# API compatible with the existing Electron code
// This file creates a window.electronAPI object that mimics the Electron IPC API

(async function () {
  // Wait for the host object to be available
  if (!chrome || !chrome.webview || !chrome.webview.hostObjects) {
    console.error("WebView2 host objects not available");
    return;
  }

  const hostAPI = chrome.webview.hostObjects.electronAPI;

  // Create a compatible API
  window.electronAPI = {
    // Ping method for health check
    ping: async () => {
      return await hostAPI.Ping();
    },

    // Check if app is initialized
    checkAppInitialized: async () => {
      return await hostAPI.CheckAppInitialized();
    },

    // Send message to Bluetooth (replaces Python)
    sendToPython: (message) => {
      hostAPI.SendToPython(message);
    },

    // Mouse control methods
    moveMouse: (x, y) => {
      hostAPI.MoveMouse(x, y);
    },

    pressMouse: (x, y, button) => {
      const finalX = (x === undefined || x === null) ? -1 : x;
      const finalY = (y === undefined || y === null) ? -1 : y;
      const finalButton = (button === undefined || button === null || button === "") ? "LEFT" : button;
      hostAPI.PressMouse(finalX, finalY, finalButton);
    },

    releaseMouse: (x, y, button) => {
      const finalX = (x === undefined || x === null) ? -1 : x;
      const finalY = (y === undefined || y === null) ? -1 : y;
      const finalButton = (button === undefined || button === null || button === "") ? "LEFT" : button;
      hostAPI.ReleaseMouse(finalX, finalY, finalButton);
    },

    // Keyboard control
    pressKey: (key) => {
      hostAPI.PressKey(key);
    },

    // WiFi QR code generation
    generateWiFiQR: async (ssid, password, security) => {
      const result = await hostAPI.GenerateWiFiQR(ssid, password, security);
      // Result is a base64 data URL string or null
      return result;
    },

    // Refresh WiFi information
    refreshWiFi: async () => {
      const result = await hostAPI.RefreshWiFi();
      return JSON.parse(result);
    },

    // Get all available WiFi networks (works even with Ethernet connection)
    getAvailableWiFiNetworks: async () => {
      const result = await hostAPI.GetAvailableWiFiNetworks();
      return JSON.parse(result);
    },

    // Get WiFi password by SSID (works even with Ethernet connection)
    getWiFiPasswordBySSID: async (ssid) => {
      const result = await hostAPI.GetWiFiPasswordBySSID(ssid);
      return JSON.parse(result);
    },

    // Open external URL
    openExternal: (url) => {
      hostAPI.OpenExternal(url);
    },

    // MIGRATION TCP: Check if TCP client is connected
    isClientConnected: async function() {
      try {
        // Appel de la méthode C# (retourne toujours une Promise avec WebView2)
        const result = await hostAPI.IsClientConnected();
        // Convertir explicitement en boolean
        return result === true || result === 1 || result === "True" || result === "true";
      } catch (e) {
        console.error("[webview-adapter] ✗ isClientConnected error:", e);
        return false;
      }
    },

    // Event listener for Bluetooth data (replaces onPythonData)
    onPythonData: (callback) => {
      window.handleBluetoothMessage = (data) => {
        callback(null, "BT:" + data);
      };
    },

    // ==================== HINT SYSTEM ====================

    // Ouvre la fenêtre d'onboarding en plein écran
    openOnboarding: () => {
      hostAPI.OpenOnboarding();
    },

    // Définit si le tutoriel a été complété
    setTutorialCompleted: (completed) => {
      hostAPI.SetTutorialCompleted(completed);
    },

    // Définit si on est dans le tutoriel (désactive hint idle)
    setInTutorial: (inTutorial) => {
      hostAPI.SetInTutorial(inTutorial);
    },

    // Active ou désactive les hints
    setHintsEnabled: (enabled) => {
      hostAPI.SetHintsEnabled(enabled);
    },

    // Définit la langue des hints
    setHintLanguage: (language) => {
      hostAPI.SetHintLanguage(language);
    },

    // Affiche le hint "main ouverte"
    showHint: (hintName) => {
      hostAPI.ShowHint(hintName);
    },

    // Affiche le hint "swipe" avec direction ('left' ou 'right')
    showSwipeHint: (direction) => {
      hostAPI.ShowSwipeHint(direction || 'right');
    },

    // Affiche le hint "move cursor"
    showMoveHint: () => {
      hostAPI.ShowMoveHint();
    },

    // Affiche le hint "click"
    showClickHint: () => {
      hostAPI.ShowClickHint();
    },

    // Cache le hint actuellement affiché
    hideHint: () => {
      hostAPI.HideHint();
    },

    // Signale une activité utilisateur (reset le timer idle)
    reportUserActivity: () => {
      hostAPI.ReportUserActivity();
    },
  };

  console.log("WebView2 adapter initialized");
})();
