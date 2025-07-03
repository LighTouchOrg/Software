const calibrateButton = document.getElementById('calibrate-button');
const onboardingButton = document.getElementById('onboarding-button');
const deviceStatus = document.getElementById('device-status');

const statusMessages = {
  fr: {
    calibration_done: 'Calibration terminée.',
    calibration_failed: 'Calibration échouée. Veuillez réessayer.',
    calibration_interrupted: 'Calibration interrompue.',
    device_connected: 'Votre appareil LighTouch est connecté.',
    device_not_connected: 'Aucun appareil Bluetooth connecté.'
  },
  en: {
    calibration_done: 'Calibration finished.',
    calibration_failed: 'Calibration failed. Please try again.',
    calibration_interrupted: 'Calibration interrupted.',
    device_connected: 'Your LighTouch device is connected.',
    device_not_connected: 'No Bluetooth device connected.'
  }
};

let calibrationWindow = null;
let onboardingWindow = null;
let jsonBuffer = "";
let deviceStatusString = "device_not_connected";
let deviceStatusColor = { light: '#9a3412', dark: '#c81927' };

// Lancer la calibration
if (calibrateButton) {
  calibrateButton.addEventListener('click', () => {
    if (!calibrationWindow || calibrationWindow.closed) {
      calibrateButton.disabled = true;

      calibrationWindow = window.open('calibration.html', '_blank', 'width=800,height=600,fullscreen=yes');

      const checker = setInterval(() => {
        if (!calibrationWindow || calibrationWindow.closed) {
          calibrationWindow = null;
          clearInterval(checker);
        }
      }, 500);

      window.electronAPI.sendToPython("START_CALIBRATION");

      calibrationWindow.addEventListener('keydown', (event) => {
         if (event.key === 'Escape') {
           window.electronAPI.sendToPython("STOP_CALIBRATION");
           calibrationWindow.close();
           calibrationWindow = null;
           calibrateButton.disabled = false;
           if (deviceStatus) {
             const lang = localStorage.getItem('preferredLang') || 'fr';
             const isDark = document.body.classList.contains('dark-mode');
             const m = statusMessages[lang] || statusMessages['fr'];
             deviceStatus.textContent = m.calibration_interrupted;
             deviceStatus.style.color = isDark ? 'navajowhite' : 'midnightblue';
             deviceStatusString = "calibration_interrupted";
             deviceStatusColor = { light: 'midnightblue', dark: 'navajowhite' };
           }
         }
      });
    }
  });
}

// Lancer l'onboarding
if (onboardingButton) {
  onboardingButton.addEventListener('click', () => {
    if (!onboardingWindow || onboardingWindow.closed) {
      onboardingButton.disabled = true;

      onboardingWindow = window.open('onboarding/onboarding.html', '_blank', 'width=800,height=600,fullscreen=yes');

      const checker = setInterval(() => {
        if (!onboardingWindow || onboardingWindow.closed) {
          onboardingWindow = null;
          onboardingButton.disabled = false;
          clearInterval(checker);
        }
      }, 500);

      onboardingWindow.addEventListener('keydown', (event) => {
         if (event.key === 'Escape') {
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

window.addEventListener('load', () => {
  const lang = localStorage.getItem('preferredLang') || 'fr';
  const isDark = document.body.classList.contains('dark-mode');
  const m = statusMessages[lang] || statusMessages['fr'];
  deviceStatus.textContent = deviceStatusString ? m[deviceStatusString] : m.device_not_connected;
  deviceStatus.style.color = isDark ? deviceStatusColor.dark : deviceStatusColor.light;
});

window.electronAPI?.onPythonData((event, data) => {
  // console.log("Donnée reçue de Python :", data);

  if (!data.startsWith("BT:")) {
    return;
  }

  const raw = data.slice(3).trim();
  jsonBuffer += raw;

  const regex = /{[^{}]*(?:{[^{}]*}[^{}]*)*}/g;
  let match;
  let lastIndex = 0;

  // If we received a valid BT message, it means the device is connected
  const lang = localStorage.getItem('preferredLang') || 'fr';
  const isDark = document.body.classList.contains('dark-mode');
  const m = statusMessages[lang] || statusMessages['fr'];
  deviceStatus.textContent = m.device_connected;
  deviceStatus.style.color = isDark ? 'darkseagreen' : 'darkgreen';
  deviceStatusString = "device_connected";
  deviceStatusColor = { light: 'darkgreen', dark: 'darkseagreen' };

  while ((match = regex.exec(jsonBuffer)) !== null) {
    const possibleJson = match[0];
    try {
      const parsed = JSON.parse(possibleJson);
      readMessage(possibleJson);

      if (onboardingWindow && !onboardingWindow.closed) {
        onboardingWindow.postMessage(possibleJson, "*");
      }

      if (parsed?.category === "screen" && parsed?.method === "calibrate") {
        const value = parsed.params?.value;
        if (deviceStatus) {
          const lang = localStorage.getItem('preferredLang') || 'fr';
          const isDark = document.body.classList.contains('dark-mode');
          const m = statusMessages[lang] || statusMessages['fr'];
          if (value === false) {
            deviceStatus.textContent = m.calibration_done;
            deviceStatusString = "calibration_done";
          } else {
            deviceStatus.textContent = m.calibration_failed;
            deviceStatusString = "calibration_failed";
          }
          deviceStatus.style.color = isDark ? 'navajowhite' : 'midnightblue';
          deviceStatusColor = { light: 'midnightblue', dark: 'navajowhite' };
        }
        calibrateButton.disabled = false;
        calibrationWindow?.close();
        calibrationWindow = null;
      }

      lastIndex = regex.lastIndex;
    } catch (e) {
      console.error("Erreur de parsing JSON :", e, possibleJson);
      break;
    }
  }

  jsonBuffer = jsonBuffer.slice(lastIndex);

  if (data === "CLOSE_CALIBRATION_WINDOW") {
    calibrationWindow?.close();
    calibrationWindow = null;
    calibrateButton.disabled = false;
    // Get language
    const lang = localStorage.getItem('preferredLang') || 'fr';
    const isDark = document.body.classList.contains('dark-mode');
    const m = statusMessages[lang] || statusMessages['fr'];
    deviceStatus.textContent = m.calibration_done;
    deviceStatus.style.color = isDark ? 'navajowhite' : 'midnightblue';
    deviceStatusString = "calibration_done";
    deviceStatusColor = { light: 'midnightblue', dark: 'navajowhite' };
    jsonBuffer = "";
  }
});
