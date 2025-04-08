const scanButton = document.getElementById('scan-button');
const deviceList = document.getElementById('device-list');
const selectedDevice = document.getElementById('selected-device');
const deviceName = document.getElementById('device-name');

// Simulation d'une recherche Bluetooth
const fakeDevices = ['Lightouch Sensor 01', 'Projector Board', 'TouchCam-X'];

scanButton.addEventListener('click', () => {
  deviceList.innerHTML = '';
  fakeDevices.forEach(name => {
    const li = document.createElement('li');
    li.textContent = name;
    li.addEventListener('click', () => {
      deviceName.textContent = name;
      selectedDevice.classList.remove('hidden');
    });
    deviceList.appendChild(li);
  });

  deviceList.classList.remove('hidden');
});
