const scanButton = document.getElementById('scan-button');
const deviceList = document.getElementById('device-list');
const selectedDevice = document.getElementById('selected-device');
const deviceName = document.getElementById('device-name');
const errorMessage = document.getElementById('error-message');

const fakeDevices = ['Lightouch Sensor 01', 'Projector Board', 'TouchCam-X'];

window.electronAPI.sendToPython('Hello from the renderer process!');

window.electronAPI.onPythonData((event, data) => {
  console.log('Received from Python:', data);
});

scanButton.addEventListener('click', () => {
  deviceList.innerHTML = '';
  errorMessage.classList.add('hidden');

  if (fakeDevices.length === 0) {
    errorMessage.classList.remove('hidden');
  } else {
    fakeDevices.forEach(name => {
      const li = document.createElement('li');
      li.textContent = name;
      li.addEventListener('click', () => {
        deviceName.textContent = name;
        selectedDevice.classList.remove('hidden');
      });
      deviceList.appendChild(li);
    });
  }

  deviceList.classList.remove('hidden');
});
