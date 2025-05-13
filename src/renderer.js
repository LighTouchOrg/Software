const calibrateButton = document.getElementById('calibrate-button');
const deviceStatus = document.getElementById('device-status');

let calibrationWindow = null;
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
           calibrationWindow.close();
           calibrationWindow = null;
           calibrateButton.disabled = false;
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

// Pour tester sans Raspberry
// document.onkeydown = async (event) => {
//   if (event.key === 's') {
//     readMessage('{"category":"actions","method":"swipe","params":{"direction":"right"}}');
//   }
//   if (event.key === 'm') {
//     readMessage('{"category":"actions","method":"move","params":{"x":400,"y":400}}');
//   }
//   if (event.key === 'c') {
//     readMessage('{"category":"actions","method":"click","params":{"x":450,"y":400}}');
//   }
// }

window.electronAPI?.onPythonData((event, data) => {
  console.log("Donnée reçue de Python :", data);

  if (!data.startsWith("BT:")) {
    return;
  }

  const raw = data.slice(3).trim();
  jsonBuffer += raw;

  const first = jsonBuffer.indexOf("{");
  const last = jsonBuffer.lastIndexOf("}");

  if (first !== -1 && last !== -1 && last > first) {
    const possibleJson = jsonBuffer.slice(first, last + 1);

    try {
      const parsed = JSON.parse(possibleJson);
      readMessage(possibleJson);

      if (
        parsed?.category === "screen" &&
        parsed?.method === "calibrate"
      ) {
        const value = parsed.params?.value;

        if (value === false) {
          if (deviceStatus) deviceStatus.textContent = "Calibration terminée.";
        } else if (value === true) {
          if (deviceStatus) deviceStatus.textContent = "Calibration échouée. Veuillez réessayer.";
        }

        if (calibrateButton) calibrateButton.disabled = false;
        if (calibrationWindow && !calibrationWindow.closed) {
          calibrationWindow.close();
          calibrationWindow = null;
        }
      }

      jsonBuffer = ""; // reset buffer

    } catch (e) {
      console.error("Erreur de parsing JSON :", e, possibleJson);
    }
  }

  // Cas spécial : fermeture manuelle
  if (data === "CLOSE_CALIBRATION_WINDOW") {
    if (calibrationWindow && !calibrationWindow.closed) {
      calibrationWindow.close();
      calibrationWindow = null;
      jsonBuffer = ""; // reset buffer
    }
    if (calibrateButton) calibrateButton.disabled = false;
    if (deviceStatus) deviceStatus.textContent = "Calibration terminée. Vous pouvez recalibrer.";
  }
});
