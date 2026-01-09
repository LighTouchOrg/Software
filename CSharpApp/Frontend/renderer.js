const calibrateButton = document.getElementById("calibrate-button");
const onboardingButton = document.getElementById("onboarding-button");
const deviceStatus = document.getElementById("device-status");
const enabledStatus = document.getElementById("enabled-status");

const statusMessages = {
  fr: {
    calibration_done: "Calibration terminée.",
    calibration_failed: "Calibration échouée. Veuillez réessayer.",
    calibration_interrupted: "Calibration interrompue.",
    device_connected: "Votre appareil LighTouch est connecté.",
    device_not_connected: "Aucun appareil LighTouch connecté.",
    disabled:
      "Les actions sont désactivées. Appuyez sur la barre d’espace pour les réactiver.",
  },
  en: {
    calibration_done: "Calibration finished.",
    calibration_failed: "Calibration failed. Please try again.",
    calibration_interrupted: "Calibration interrupted.",
    device_connected: "Your LighTouch device is connected.",
    device_not_connected: "No Bluetooth device connected.",
    disabled: "Actions are disabled. Press the spacebar to re-enable them.",
  },
};

let calibrationWindow = null;
let onboardingWindow = null;
let jsonBuffer = "";
let lastMove = null;
let enabled = true;

// Initialize device status variables from localStorage or set defaults
let deviceStatusString =
  localStorage.getItem("deviceStatusString") || "device_not_connected";
let deviceStatusColor = localStorage.getItem("deviceStatusColor")
  ? JSON.parse(localStorage.getItem("deviceStatusColor"))
  : { light: "#c81927", dark: "#c81927" };

// Save device status variables to localStorage
function updateDeviceStatus(statusString, color) {
  deviceStatusString = statusString;
  deviceStatusColor = color;
  localStorage.setItem("deviceStatusString", deviceStatusString);
  localStorage.setItem("deviceStatusColor", JSON.stringify(deviceStatusColor));
}

// ==================== HINT SYSTEM INITIALIZATION ====================
function initializeHintSystem() {
  if (!window.electronAPI) {
    console.log("[Hints] electronAPI not available, retrying...");
    setTimeout(initializeHintSystem, 500);
    return;
  }

  try {
    // Synchroniser l'état du tutoriel
    const tutorialCompleted = localStorage.getItem("tutorialCompleted") === "true";
    window.electronAPI.setTutorialCompleted(tutorialCompleted);
    
    // Synchroniser la langue
    const lang = localStorage.getItem("preferredLang") || "fr";
    window.electronAPI.setHintLanguage(lang);
    
    // Vérifier si les hints sont activés dans les settings
    const hintsEnabled = localStorage.getItem("hintsEnabled") !== "false"; // Activé par défaut
    window.electronAPI.setHintsEnabled(hintsEnabled);
    
    console.log("[Hints] Système de hints initialisé:", {
      tutorialCompleted,
      lang,
      hintsEnabled
    });
  } catch (e) {
    console.warn("[Hints] Erreur initialisation:", e);
  }
}

// Initialiser le système de hints après un délai pour laisser WebView2 se charger
setTimeout(initializeHintSystem, 1000);

// ==================== HINT MESSAGE RELAY ====================
// Écouteur pour relayer les messages de hints depuis les popups (onboarding)
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'hint') {
    const { action, direction, value } = event.data;
    
    if (!window.electronAPI) {
      console.warn('[Hints] electronAPI not available for hint relay');
      return;
    }
    
    console.log('[Hints] Relaying hint message:', action, event.data);
    
    switch (action) {
      case 'setInTutorial':
        window.electronAPI.setInTutorial(value);
        break;
      case 'setTutorialCompleted':
        window.electronAPI.setTutorialCompleted(value);
        break;
      case 'showSwipeHint':
        window.electronAPI.showSwipeHint(direction);
        break;
      case 'showMoveHint':
        window.electronAPI.showMoveHint();
        break;
      case 'showClickHint':
        window.electronAPI.showClickHint();
        break;
      case 'hideHint':
        window.electronAPI.hideHint();
        break;
    }
  }
});
// ==================================================================

function updateEnabledStatus() {
  enabled = !enabled;
  console.log(`Actions are now ${enabled ? "enabled" : "disabled"}`);
  localStorage.setItem("enabled", enabled);
  const lang = localStorage.getItem("preferredLang") || "fr";
  const m = statusMessages[lang] || statusMessages["fr"];
  if (enabledStatus) {
    if (!enabled) {
      enabledStatus.textContent = m.disabled;
    } else {
      enabledStatus.textContent = "";
    }
  }
}

// Lancer la calibration
if (calibrateButton) {
  calibrateButton.addEventListener("click", () => {
    if (!calibrationWindow || calibrationWindow.closed) {
      calibrateButton.disabled = true;

      calibrationWindow = window.open(
        "calibration.html",
        "_blank",
        "width=800,height=600,fullscreen=yes"
      );

      const checker = setInterval(() => {
        if (!calibrationWindow || calibrationWindow.closed) {
          calibrationWindow = null;
          clearInterval(checker);
        }
      }, 500);

      window.electronAPI.sendToPython("START_CALIBRATION");

      calibrationWindow.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          window.electronAPI.sendToPython("STOP_CALIBRATION");
          calibrationWindow.close();
          calibrationWindow = null;
          calibrateButton.disabled = false;
          if (deviceStatus) {
            const lang = localStorage.getItem("preferredLang") || "fr";
            const isDark = document.body.classList.contains("dark-mode");
            const m = statusMessages[lang] || statusMessages["fr"];
            deviceStatus.textContent = m.calibration_interrupted;
            deviceStatus.style.color = isDark ? "navajowhite" : "midnightblue";
            deviceStatusString = "calibration_interrupted";
            deviceStatusColor = { light: "midnightblue", dark: "navajowhite" };
            updateDeviceStatus("calibration_interrupted", {
              light: "midnightblue",
              dark: "navajowhite",
            });
          }
        }
      });
    }
  });
}

// Lancer l'onboarding - Ouvre une fenêtre WPF plein écran
if (onboardingButton) {
  onboardingButton.addEventListener("click", () => {
    if (window.electronAPI && window.electronAPI.openOnboarding) {
      window.electronAPI.openOnboarding();
    } else {
      console.error("openOnboarding not available");
    }
  });
}

// Action swipe simple
async function swipe(params) {
  const leftKey = localStorage.getItem("Swipe_Left_Key") || "ArrowLeft";
  const rightKey = localStorage.getItem("Swipe_Right_Key") || "ArrowRight";
  if (params.direction === "left") {
    window.electronAPI?.pressKey(leftKey);
  } else if (params.direction === "right") {
    window.electronAPI.pressKey(rightKey);
  }
}

// Traitement de méthodes spécifiques
function hand_tracking(method, params) {
  method = method.trim().toLowerCase();
  switch (method) {
    case "swipe":
      swipe(params);
      break;
    default:
      console.error("Méthode non reconnue:", method);
      break;
  }
}

// Lecture du message JSON valide
function readMessage(msg) {
  try {
    const parsed = JSON.parse(msg);
    let { category, method, params } = parsed;
    method = method.trim().toLowerCase();

    console.log("[TCP] readMessage - category:", category, "method:", method, "params:", params);
    console.log("[TCP] Actions enabled:", enabled);

    switch (category) {
      case "actions":
        if (!enabled) {
          console.log("[TCP] Actions désactivées, message ignoré");
          return;
        }
        console.log("[TCP] Création instance Actions et appel méthode:", method);
        const action = new Actions();
        const result = action[method](params);
        console.log("[TCP] Résultat action:", result);
        break;
      case "settings":
        const settings = new Settings();
        settings[method](params);
        break;
      default:
        console.error("[TCP] Catégorie non reconnue:", category);
        break;
    }
  } catch (e) {
    console.error("[TCP] Erreur de parsing du message:", e);
  }
}

// MIGRATION TCP: Fonction appelée par C# pour mettre à jour le statut de connexion
window.updateConnectionStatus = function(isConnected) {
  const lang = localStorage.getItem("preferredLang") || "fr";
  const isDark = document.body.classList.contains("dark-mode");
  const m = statusMessages[lang] || statusMessages["fr"];

  if (deviceStatus) {
    if (isConnected) {
      deviceStatus.textContent = m.device_connected;
      deviceStatus.style.color = isDark ? "darkseagreen" : "darkgreen";
      console.log("[TCP] ✅ Statut mis à jour: CONNECTÉ (appelé depuis C#)");
    } else {
      deviceStatus.textContent = m.device_not_connected;
      deviceStatus.style.color = isDark ? "#c81927" : "#c81927";
      console.log("[TCP] ❌ Statut mis à jour: DÉCONNECTÉ (appelé depuis C#)");
    }
  }
};

// Fonction pour vérifier le statut de connexion en appelant l'API C#
async function checkConnectionStatus() {
  try {
    if (window.electronAPI && window.electronAPI.isClientConnected) {
      const isConnected = await window.electronAPI.isClientConnected();
      window.updateConnectionStatus(isConnected);
    }
  } catch (error) {
    console.error("[TCP] Erreur lors de la vérification du statut:", error);
  }
}

// Update device status on page load
window.addEventListener("load", () => {
  // MIGRATION TCP: Active le mode Navigation par défaut pour les tests
  if (!localStorage.getItem("NavigationMode")) {
    localStorage.setItem("NavigationMode", "true");
    console.log("[TCP] Mode Navigation activé par défaut");
  }

  // IMPORTANT: Ne JAMAIS utiliser localStorage pour le statut de connexion
  // Il doit être vérifié dynamiquement à chaque fois
  const lang = localStorage.getItem("preferredLang") || "fr";
  const isDark = document.body.classList.contains("dark-mode");
  const m = statusMessages[lang] || statusMessages["fr"];

  if (
    localStorage.getItem("enabled") &&
    localStorage.getItem("enabled") === "false"
  ) {
    enabled = false;
    enabledStatus.textContent = m.disabled;
  }

  // Afficher "non connecté" par défaut
  if (deviceStatus) {
    deviceStatus.textContent = m.device_not_connected;
    deviceStatus.style.color = isDark ? "#c81927" : "#c81927";
  }

  console.log("[TCP] Page chargée - vérification initiale du statut de connexion");

  // Vérifier le statut de connexion immédiatement après le chargement
  setTimeout(() => {
    checkConnectionStatus();
  }, 500);

  // Puis vérifier périodiquement toutes les 2 secondes
  setInterval(() => {
    checkConnectionStatus();
  }, 2000);
});

// MIGRATION TCP: Le statut de connexion est maintenant géré par les événements C#
// OnClientConnected / OnClientDisconnected appellent window.updateConnectionStatus()
// Plus besoin de polling - le statut est mis à jour en temps réel !

// Update device status dynamically
window.electronAPI?.onPythonData((event, data) => {
  if (!data.startsWith("BT:")) {
    return;
  }

  const raw = data.slice(3).trim();
  jsonBuffer += raw;

  // MIGRATION TCP: Le statut de connexion est géré par le polling périodique (setInterval)
  // Ne plus mettre à jour le statut ici pour éviter les conflits
  // Anciennement : mettait le statut en vert dès réception d'un message Bluetooth
  // Désormais : le setInterval se charge de vérifier IsClientConnected() régulièrement

  const regex = /{[^{}]*(?:{[^{}]*}[^{}]*)*}/g;
  let match;
  let lastIndex = 0;
  while ((match = regex.exec(jsonBuffer)) !== null) {
    const possibleJson = match[0];
    try {
      const parsed = JSON.parse(possibleJson);
      if (parsed.method === "move" && parsed.params) {
        const moveKey = `${parsed.params.x},${parsed.params.y}`;
        if (moveKey === lastMove) {
          lastIndex = regex.lastIndex;
          continue;
        }
        lastMove = moveKey;
      }
      readMessage(possibleJson);

      if (onboardingWindow && !onboardingWindow.closed) {
        onboardingWindow.postMessage(possibleJson, "*");
      }

      if (parsed?.category === "screen" && parsed?.method === "calibrate") {
        const value = parsed.params?.value;
        if (deviceStatus) {
          const lang = localStorage.getItem("preferredLang") || "fr";
          const isDark = document.body.classList.contains("dark-mode");
          const m = statusMessages[lang] || statusMessages["fr"];
          if (value === false) {
            deviceStatus.textContent = m.calibration_done;
            updateDeviceStatus("calibration_done", {
              light: "midnightblue",
              dark: "navajowhite",
            });
          } else {
            deviceStatus.textContent = m.calibration_failed;
            updateDeviceStatus("calibration_failed", {
              light: "midnightblue",
              dark: "navajowhite",
            });
          }
          deviceStatus.style.color = isDark ? "navajowhite" : "midnightblue";
        }
        calibrateButton.disabled = false;
        calibrationWindow?.close();
        calibrationWindow = null;
      }
      lastIndex = regex.lastIndex;
    } catch (e) {
      break;
    }
  }
  jsonBuffer = jsonBuffer.slice(lastIndex);

  if (data === "CLOSE_CALIBRATION_WINDOW") {
    calibrationWindow?.close();
    calibrationWindow = null;
    calibrateButton.disabled = false;
    const lang = localStorage.getItem("preferredLang") || "fr";
    const isDark = document.body.classList.contains("dark-mode");
    const m = statusMessages[lang] || statusMessages["fr"];
    deviceStatus.textContent = m.calibration_done;
    deviceStatus.style.color = isDark ? "navajowhite" : "midnightblue";
    updateDeviceStatus("calibration_done", {
      light: "midnightblue",
      dark: "navajowhite",
    });
    jsonBuffer = "";
  }
});

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    updateEnabledStatus();
  }
});

// MIGRATION TCP: Fonction pour traiter les messages TCP (remplace onPythonData pour Bluetooth)
window.processTcpMessage = function(jsonMessage) {
  try {
    console.log("[TCP] Message reçu brut:", jsonMessage);

    // Simule le format "BT:{json}" attendu par le code existant
    const data = "BT:" + jsonMessage;

    if (!data.startsWith("BT:")) {
      console.log("[TCP] Message ne commence pas par BT:");
      return;
    }

    const raw = data.slice(3).trim();
    console.log("[TCP] JSON extrait:", raw);
    jsonBuffer += raw;

    // MIGRATION TCP: Le statut de connexion est géré par le polling périodique (setInterval)
    // Ne plus mettre à jour le statut ici pour éviter les conflits
    // Le setInterval vérifie IsClientConnected() toutes les 2 secondes

    // Traitement du JSON
    const regex = /{[^{}]*(?:{[^{}]*}[^{}]*)*}/g;
    let match;
    let lastIndex = 0;
    while ((match = regex.exec(jsonBuffer)) !== null) {
      const possibleJson = match[0];
      try {
        const parsed = JSON.parse(possibleJson);

        // Anti-duplicate pour move
        if (parsed.method === "move" && parsed.params) {
          const moveKey = `${parsed.params.x},${parsed.params.y}`;
          if (moveKey === lastMove) {
            lastIndex = regex.lastIndex;
            continue;
          }
          lastMove = moveKey;
        }

        console.log("[TCP] Appel readMessage avec:", parsed);
        readMessage(possibleJson);

        if (onboardingWindow && !onboardingWindow.closed) {
          onboardingWindow.postMessage(possibleJson, "*");
        }

        // Gestion calibration
        if (parsed?.category === "screen" && parsed?.method === "calibrate") {
          const value = parsed.params?.value;
          if (deviceStatus) {
            const lang = localStorage.getItem("preferredLang") || "fr";
            const isDark = document.body.classList.contains("dark-mode");
            const m = statusMessages[lang] || statusMessages["fr"];
            if (value === false) {
              deviceStatus.textContent = m.calibration_done;
              updateDeviceStatus("calibration_done", {
                light: "midnightblue",
                dark: "navajowhite",
              });
            } else {
              deviceStatus.textContent = m.calibration_failed;
              updateDeviceStatus("calibration_failed", {
                light: "midnightblue",
                dark: "navajowhite",
              });
            }
            deviceStatus.style.color = isDark ? "navajowhite" : "midnightblue";
          }
          calibrateButton.disabled = false;
          calibrationWindow?.close();
          calibrationWindow = null;
        }
        lastIndex = regex.lastIndex;
      } catch (e) {
        break;
      }
    }
    jsonBuffer = jsonBuffer.slice(lastIndex);
  } catch (error) {
    console.error("Erreur traitement message TCP:", error);
  }
};
