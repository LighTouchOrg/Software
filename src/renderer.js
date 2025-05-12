const calibrateButton = document.getElementById('calibrate-button');
const stopButton = document.getElementById('stop-button');
const loading = document.getElementById('loading');
const loadingDots = document.getElementById('loading-dots');
const deviceStatus = document.getElementById('device-status');

let dotCount = 0;
let calibrationWindow = null;

// Animation des points de chargement
setInterval(() => {
  dotCount = (dotCount + 1) % 4;
  loadingDots.textContent = '.'.repeat(dotCount);
}, 500);

calibrateButton.addEventListener('click', () => {
  loading.classList.remove('hidden');
  calibrateButton.disabled = true;

  // open temporary full-screen window
  calibrationWindow = window.open('calibration.html', '_blank', 'width=800,height=600,fullscreen=yes');

  // Add event listener to close the window with Escape key
  calibrationWindow.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      calibrationWindow.close();
    }
  });

  window.electronAPI.sendToPython("START_CALIBRATION");
});

async function swipe(params) {
  if (params.direction === "left") {
    window.electronAPI?.pressKey("ArrowLeft");
  } else if (params.direction === "right") {
    window.electronAPI.pressKey("ArrowRight");
  }
}

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

function readMessage(msg) {
  try {
    const parsed = JSON.parse(msg);
    let { category, method, params } = parsed;
    console.log("Catégorie:", category);
    console.log("Méthode:", method);
    console.log("Paramètres:", params);
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
// }

window.electronAPI?.onPythonData((event, data) => {
  if (!data.startsWith("BT:")) return;

  const raw = data.slice(3).trim();
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error("Erreur de parsing JSON :", e);
    return;
  }

  readMessage(raw);

  // Calibration terminée
  if (
    parsed.category === "hand_tracking" &&
    parsed.method === "calibrate" &&
    parsed.params?.value === false
  ) {
    loading.classList.add("hidden");
    stopButton.classList.add("hidden");
    calibrateButton.disabled = false;
    deviceStatus.textContent = "Caméra calibrée";

    if (calibrationWindow && !calibrationWindow.closed) {
      calibrationWindow.close();
    }
  } else {
    deviceStatus.textContent = `Appareil connecté : ${raw}`;
  }
});
