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
    device_not_connected: "Aucun appareil Bluetooth connecté.",
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
  : { light: "#9a3412", dark: "#c81927" };

// Save device status variables to localStorage
function updateDeviceStatus(statusString, color) {
  deviceStatusString = statusString;
  deviceStatusColor = color;
  localStorage.setItem("deviceStatusString", deviceStatusString);
  localStorage.setItem("deviceStatusColor", JSON.stringify(deviceStatusColor));
}

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

// Lancer l'onboarding
if (onboardingButton) {
  onboardingButton.addEventListener("click", () => {
    if (!onboardingWindow || onboardingWindow.closed) {
      onboardingButton.disabled = true;

      onboardingWindow = window.open(
        "onboarding/onboarding.html",
        "_blank",
        "width=800,height=600,fullscreen=yes"
      );

      const checker = setInterval(() => {
        if (!onboardingWindow || onboardingWindow.closed) {
          onboardingWindow = null;
          onboardingButton.disabled = false;
          clearInterval(checker);
        }
      }, 500);

      onboardingWindow.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          onboardingWindow.close();
          onboardingWindow = null;
          onboardingButton.disabled = false;
        }
      });
    }
  });
}

// Action swipe simple
async function swipe(params) {
  if (params.direction === "left") {
    window.electronAPI?.pressKey("ArrowLeft");
  } else if (params.direction === "right") {
    window.electronAPI.pressKey("ArrowRight");
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

    switch (category) {
      case "actions":
        if (!enabled) return;
        const action = new Actions();
        action[method](params);
        break;
      case "settings":
        const settings = new Settings();
        settings[method](params);
        break;
      default:
        console.error("Catégorie non reconnue:", category);
        break;
    }
  } catch (e) {
    console.error("Erreur de parsing du message:", e);
  }
}

// Update device status on page load
window.addEventListener("load", () => {
  deviceStatusString =
    localStorage.getItem("deviceStatusString") || "device_not_connected";
  deviceStatusColor = localStorage.getItem("deviceStatusColor")
    ? JSON.parse(localStorage.getItem("deviceStatusColor"))
    : { light: "#9a3412", dark: "#c81927" };
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
  if (!deviceStatus) return;
  deviceStatus.textContent = deviceStatusString
    ? m[deviceStatusString]
    : m.device_not_connected;
  deviceStatus.style.color = isDark
    ? deviceStatusColor.dark
    : deviceStatusColor.light;
});

// Update device status dynamically
window.electronAPI?.onPythonData((event, data) => {
  if (!data.startsWith("BT:")) {
    return;
  }

  const raw = data.slice(3).trim();
  jsonBuffer += raw;

  if (
    deviceStatus.textContent === statusMessages["fr"].device_not_connected ||
    deviceStatus.textContent === statusMessages["en"].device_not_connected
  ) {
    const lang = localStorage.getItem("preferredLang") || "fr";
    const isDark = document.body.classList.contains("dark-mode");
    const m = statusMessages[lang] || statusMessages["fr"];
    deviceStatus.textContent = m.device_connected;
    deviceStatus.style.color = isDark ? "darkseagreen" : "darkgreen";
    updateDeviceStatus("device_connected", {
      light: "darkgreen",
      dark: "darkseagreen",
    });
  }

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
