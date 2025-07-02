const calibrateButton = document.getElementById('calibrate-button');
const onboardingButton = document.getElementById('onboarding-button');
const deviceStatus = document.getElementById('device-status');

let calibrationWindow = null;
let onboardingWindow = null;
let jsonBuffer = "";

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

window.electronAPI?.onPythonData((event, data) => {
  console.log("Donnée reçue de Python :", data);

  if (!data.startsWith("BT:")) {
    return;
  }

  const raw = data.slice(3).trim();
  jsonBuffer += raw;

  const regex = /{[^{}]*(?:{[^{}]*}[^{}]*)*}/g;
  let match;
  let lastIndex = 0;

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
        deviceStatus.textContent = value === false
          ? "Calibration terminée."
          : "Calibration échouée. Veuillez réessayer.";
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
    deviceStatus.textContent = "Calibration terminée. Vous pouvez recalibrer.";
    jsonBuffer = "";
  }
});
