const scanButton = document.getElementById('scan-button');
const deviceList = document.getElementById('device-list');
const selectedDevice = document.getElementById('selected-device');
const deviceName = document.getElementById('device-name');
const errorMessage = document.getElementById('error-message');
const loading = document.getElementById('loading');
const loadingDots = document.getElementById('loading-dots');
let dotCount = 0;

let devices = [];
let selectedDeviceName = null;

window.electronAPI.onPythonData((event, data) => {
  if (data.startsWith('DEVICES:')) {
    loading.classList.add('hidden');
    devices = JSON.parse(data.slice(8));
    devices = devices.filter(device => device !== '');
    if (devices.length === 0) {
     devices.push(null);
    }
    updateDeviceList();
  }
});

function updateDeviceList() {
  deviceList.innerHTML = '';
  errorMessage.classList.add('hidden');

  if (devices.length === 0) {
    loading.classList.remove('hidden');
  } else if (devices[0] === null) {
    errorMessage.classList.remove('hidden');
  } else {
    devices.forEach(name => {
      const li = document.createElement('li');
      li.textContent = name;
      if (name === selectedDeviceName) {
        li.classList.add('selected');
        deviceName.textContent = name;
        selectedDevice.classList.remove('hidden');
      }
      li.addEventListener('click', () => {
        deviceName.textContent = name;
        selectedDeviceName = name;
        const selectedLi = deviceList.querySelector('.selected');
        if (selectedLi) selectedLi.classList.remove('selected');
        li.classList.add('selected');
        selectedDevice.classList.remove('hidden');
      });
      deviceList.appendChild(li);
    });
  }

  const selectedLi = deviceList.querySelector('.selected');
  if (!selectedLi) {
    selectedDevice.classList.add('hidden');
    deviceName.textContent = '-';
  }
  deviceList.classList.remove('hidden');
}

scanButton.addEventListener('click', () => {
  loading.classList.remove('hidden');
  window.electronAPI.sendToPython('GET_DEVICES');
});

// Animation des points de chargement
setInterval(() => {
  dotCount = (dotCount + 1) % 4;
  loadingDots.textContent = '.'.repeat(dotCount);
}, 500);
