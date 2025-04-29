"""
Bluetooth server for Raspberry Pi to communicate with Electron.
"""
import os
import sys
import json
import socket
import bluetooth
from threading import Thread

# Connect to Electron
server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind(('localhost', 9000))
server.listen(1)
print("Python server is ready and listening on port 9000") # Do NOT remove: needed to ensure the server is ready
sys.stdout.flush()
conn, addr = server.accept()

bluetooth_client = bluetooth.BluetoothSocket(bluetooth.RFCOMM)
bluetooth_client.bind(("", bluetooth.PORT_ANY))
bluetooth_client.listen(1)
print("Bluetooth server is ready and listening") # Do NOT remove: needed to ensure the server is ready
sys.stdout.flush()

def receive_data():
    while True:
        try:
            data = bluetooth_client.recv(1024).decode()
            if data:
                print("Received data from Bluetooth:", data)
                # Process the received data as needed
        except (bluetooth.btcommon.BluetoothError, OSError) as e:
            print("Bluetooth error:", e)
            break
# Start a thread to receive data from Bluetooth
bluetooth_thread = Thread(target=receive_data)
bluetooth_thread.daemon = True
bluetooth_thread.start()

def get_devices():
    devices = bluetooth.discover_devices(duration = 2, lookup_names = True)
    if len(devices) == 0:
        conn.sendall("DEVICES:[]".encode())
    else:
        device_names = list(map(lambda x: x[1], devices))
        conn.sendall(f"DEVICES:{json.dumps(device_names)}".encode())

# listen for incoming data from Electron
while True:
    try:
        data = conn.recv(1024).decode()
        if data:
            if data == "GET_DEVICES":
                get_devices()
    except (socket.error, OSError) as e:
        print("Socket error:", e)
        break
