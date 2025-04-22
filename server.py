"""
Bluetooth server for Raspberry Pi to communicate with Electron.
"""
import socket
import os
import sys

# Connect to Electron
server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind(('localhost', 9000))
server.listen(1)
print("Python server is ready and listening on port 9000") # Do NOT remove: needed to ensure the server is ready
sys.stdout.flush()
conn, addr = server.accept()

# listen for incoming data from Electron
while True:
    try:
        data = conn.recv(1024).decode()
        if data:
            # Send back the received data
            conn.sendall(data.encode())
            # Send data to Bluetooth (via serial)
            if os.name == 'nt':
                # Windows-specific code for Bluetooth
                pass  # Placeholder for Windows Bluetooth code
            else:
                # Linux-specific code for Bluetooth
                pass  # Placeholder for Linux Bluetooth code
    except (socket.error, OSError) as e:
        print("Socket error:", e)
        break
