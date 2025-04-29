"""
Bluetooth server for Raspberry Pi to communicate with Electron.
Windows uses serial COM port.
"""
import os
import sys
import json
import socket
import platform
from threading import Thread

# Detect platform
is_linux = platform.system() == "Linux"
is_windows = platform.system() == "Windows"

def start_electron_connection():
    try:
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.bind(('localhost', 9000))
        server.listen(1)
        print("Python server is ready and listening on port 9000")  # Do NOT remove
        sys.stdout.flush()
        conn, addr = server.accept()
        conn.settimeout(1.0)  # Important: make recv() non-blocking
        return conn, server
    except Exception as e:
        print("Failed to start TCP server:", e)
        sys.exit(1)

# ------- Linux: RFCOMM Bluetooth -------
def receive_data_raspi(client_sock, conn):
    try:
        while True:
            try:
                data = client_sock.recv(1024).decode()
                if data:
                    print("Received (Bluetooth):", data)
                    conn.sendall(f"BT:{data}".encode())
            except Exception as e:
                print("Bluetooth read error:", e)
                break
    except Exception as e:
        print("Bluetooth connection error:", e)

def handle_bluetooth_raspi(conn):
    try:
        import bluetooth
        bluetooth_client = bluetooth.BluetoothSocket(bluetooth.RFCOMM)
        bluetooth_client.bind(("", bluetooth.PORT_ANY))
        bluetooth_client.listen(1)
        print("Bluetooth server is ready and listening")  # Do NOT remove
        sys.stdout.flush()

        client_sock, client_info = bluetooth_client.accept()
        print(f"Accepted connection from {client_info}")

        thread = Thread(target=receive_data_raspi, args=(client_sock, conn), daemon=True)
        thread.start()

    except Exception as e:
        print("Failed to start Bluetooth on Raspberry Pi:", e)

# ------- Windows: Serial COM Bluetooth -------
def find_active_bluetooth_port():
    import serial.tools.list_ports
    ports = serial.tools.list_ports.comports()
    for port in ports:
        desc = port.description.lower()
        hwid = port.hwid.lower()
        if 'bthenum' in hwid and '000000000000' not in hwid:
            print(f"Found active Bluetooth port: {port.device} ({desc})")
            return port.device
    return None

def receive_data_windows(port, conn):
    import serial
    try:
        with serial.Serial(port, 9600, timeout=1) as ser:
            print(f"Connected to {port}")
            ser.write(b"helloworld\n")
            while True:
                try:
                    line = ser.readline()
                    if not line:
                        continue
                    data = line.decode('utf-8', errors='ignore').strip()
                    if data:
                        print("Received (Serial):", data)
                        conn.sendall(f"BT:{data}".encode())
                except serial.SerialException as e:
                    print("Serial read error:", e)
                    break
                except KeyboardInterrupt:
                    print("Serial read interrupted by user.")
                    break
    except serial.SerialException as e:
        print(f"Failed to open serial port {port}:", e)
    except OSError as e:
        print(f"OS error opening serial port {port}:", e)

def handle_bluetooth_windows(conn):
    try:
        import serial
        port = find_active_bluetooth_port()
        if port is None:
            print("Could not find an active Bluetooth serial port.")
            return

        thread = Thread(target=receive_data_windows, args=(port, conn), daemon=True)
        thread.start()

    except ImportError:
        print("pyserial is not installed. Run: pip install pyserial")
    except Exception as e:
        print("Unexpected error in Windows Bluetooth setup:", e)

# ------- GET_DEVICES -------
def get_devices(conn):
    device_names = []
    if is_linux:
        try:
            import bluetooth
            devices = bluetooth.discover_devices(duration=2, lookup_names=True)
            device_names = [name for _, name in devices]
        except Exception as e:
            print("Error discovering devices:", e)
    else:
        print("GET_DEVICES not supported on this platform.")
    try:
        conn.sendall(f"DEVICES:{json.dumps(device_names)}".encode())
    except Exception as e:
        print("Error sending devices list to Electron:", e)

# ------- Electron Listener -------
def listen_to_electron(conn):
    try:
        while True:
            try:
                data = conn.recv(1024).decode()
                if data:
                    print("Received from Electron:", data)
                    if data == "GET_DEVICES":
                        get_devices(conn)
            except socket.timeout:
                continue  # socket is alive, just no data yet
            except (socket.error, OSError) as e:
                print("Socket error:", e)
                break
    except KeyboardInterrupt:
        print("Server interrupted by user. Closing.")
    finally:
        conn.close()

# ------- Main -------
def main():
    conn, server_socket = start_electron_connection()

    if is_linux:
        handle_bluetooth_raspi(conn)
    elif is_windows:
        handle_bluetooth_windows(conn)
    else:
        print("Unsupported OS for Bluetooth.")

    listen_to_electron(conn)
    server_socket.close()

if __name__ == "__main__":
    main()
