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

window.electronAPI?.onPythonData((event, data) => {
  if (data.startsWith("BT:")) {
    const message = data.slice(3).trim();
    deviceStatus.textContent = `Appareil connecté : ${message}`;
  }
});
