"""
Bluetooth server for Raspberry Pi to communicate with Electron.
"""
import os
import sys
import socket
import bluetooth

# Connect to Electron
server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind(('localhost', 9000))
server.listen(1)
print("Python server is ready and listening on port 9000") # Do NOT remove: needed to ensure the server is ready
sys.stdout.flush()
conn, addr = server.accept()

def get_devices():
    devices = bluetooth.discover_devices(duration = 2, lookup_names = True)
    if len(devices) == 0:
        conn.sendall("DEVICES:Bluetooth device not found".encode())
    else:
        conn.sendall(f"DEVICES:{list(map(lambda x: x[1], devices))}".encode())

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
