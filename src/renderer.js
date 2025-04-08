const scanButton = document.getElementById('scan-button');
const deviceList = document.getElementById('device-list');
const selectedDevice = document.getElementById('selected-device');
const deviceName = document.getElementById('device-name');

// Simulation d'une recherche Bluetooth
const fakeDevices = ['Lightouch Sensor 01', 'Projector Board', 'TouchCam-X'];

scanButton.addEventListener("click", async () => {
  deviceList.innerHTML = "";

  try {
    if (!("serial" in navigator)) {
      alert("Web Serial API not supported in this context.");
      return;
    }

    // Prompt user to select a serial port
    const port = await navigator.serial.requestPort();

    // You can get some info (might be limited based on platform)
    const info = port.getInfo(); // returns { usbVendorId, usbProductId }

    const li = document.createElement("li");
    li.textContent = `Serial Device (VID: ${info.usbVendorId || "N/A"}, PID: ${
      info.usbProductId || "N/A"
    })`;

    li.addEventListener("click", async () => {
      deviceName.textContent = li.textContent;
      selectedDevice.classList.remove("hidden");

      // Example: Open the port
      await port.open({ baudRate: 9600 });

      const textEncoder = new TextEncoderStream();
      const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
      const writer = textEncoder.writable.getWriter();

      // Send a test message
      await writer.write("Hello from Electron!\n");
      writer.releaseLock();
    });

    deviceList.appendChild(li);
    deviceList.classList.remove("hidden");
  } catch (err) {
    console.error("Serial port selection failed", err);
    alert("No serial device selected.");
  }
});

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
