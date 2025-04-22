"""
Bluetooth server for Raspberry Pi to communicate with Electron.
"""
import socket
import os

# Connect to Electron
server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind(('localhost', 9000))
server.listen(1)
conn, addr = server.accept()
print(f"Electron connected: {addr}")

# listen for incoming data from Electron
while True:
    try:
        data = conn.recv(1024).decode()
        if data:
            print(f"Electron says: {data}")
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
