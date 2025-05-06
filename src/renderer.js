const calibrateButton = document.getElementById('calibrate-button');
const stopButton = document.getElementById('stop-button');
const loading = document.getElementById('loading');
const loadingDots = document.getElementById('loading-dots');
const deviceStatus = document.getElementById('device-status');

let dotCount = 0;
let calibrationWindow = null;

document.onkeydown = async (event) => {
  if (event.key === 'ArrowUp') {
    await window.electronAPI?.moveMouse(0, -10);
  }
}

// Animation des points de chargement
setInterval(() => {
  dotCount = (dotCount + 1) % 4;
  loadingDots.textContent = '.'.repeat(dotCount);
}, 500);

calibrateButton.addEventListener('click', () => {
  console.log("Calibrage demandé.");
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

stopButton.addEventListener('click', () => {
  console.log("Calibration terminée.");
  stopButton.classList.add('hidden');
  loading.classList.add('hidden');
  calibrateButton.disabled = false;

  // Tu peux envoyer un message à Python ici si besoin :
  // window.electronAPI.sendToPython("STOP_CALIBRATION");
});

async function swipe(params) {
  if (params.direction === "left") {
    await window.electronAPI?.pressKey("ArrowLeft");
  } else if (params.direction === "right") {
    await window.electronAPI?.pressKey("ArrowRight");
  }
}

function hand_tracking(method, params) {
  switch (method === "swipe") {
    case "swipe":
      swipe(params);
      break;
    default:
      console.error("Méthode non reconnue:", method);
      break;
  }
}

function readMessage(msg) {
  // Format: {"category": "category", "method": "method", "params": {"p1": 1, "p2": "p2"}}
  try {
    const parsed = JSON.parse(msg);
    switch (parsed.category) {
      case "hand_tracking":
        hand_tracking(parsed.method, parsed.params);
        break;
      default:
        console.error("Catégorie non reconnue:", parsed.category);
        break;
    }
  } catch (e) {
    console.error("Erreur de parsing du message:", e);
  }
}

window.electronAPI?.onPythonData((event, data) => {
  if (data.startsWith("BT:")) {
    const message = data.slice(3).trim();
    readMessage(message);
    deviceStatus.textContent = `Appareil connecté : ${message}`;
  }
});
