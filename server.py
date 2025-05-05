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

# Global variables
bt_client_sock = None
serial_connection = None

# Log function to replace print and send to Electron
def ConsolePrint(message, conn):
    try:
        conn.sendall(f"LOG:{message}".encode())
    except Exception:
        pass

def start_electron_connection():
    try:
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.bind(('localhost', 9000))
        server.listen(1)
        conn, _ = server.accept()
        conn.settimeout(1.0)
        ConsolePrint("Python server is ready and listening on port 9000", conn)
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
                    ConsolePrint(f"Received (Bluetooth): {data}", conn)
                    conn.sendall(f"BT:{data}".encode())
            except Exception as e:
                ConsolePrint(f"Bluetooth read error: {e}", conn)
                break
    except Exception as e:
        ConsolePrint(f"Bluetooth connection error: {e}", conn)

def handle_bluetooth_raspi(conn):
    try:
        import bluetooth
        bluetooth_client = bluetooth.BluetoothSocket(bluetooth.RFCOMM)
        bluetooth_client.bind(("", bluetooth.PORT_ANY))
        bluetooth_client.listen(1)
        ConsolePrint("Bluetooth server is ready and listening", conn)

        client_sock, client_info = bluetooth_client.accept()
        ConsolePrint(f"Accepted connection from {client_info}", conn)

        global bt_client_sock
        bt_client_sock = client_sock

        thread = Thread(target=receive_data_raspi, args=(client_sock, conn), daemon=True)
        thread.start()

    except Exception as e:
        ConsolePrint(f"Failed to start Bluetooth on Raspberry Pi: {e}", conn)

# ------- Windows: Serial COM Bluetooth -------
def find_active_bluetooth_port(conn):
    import serial.tools.list_ports
    ports = serial.tools.list_ports.comports()
    for port in ports:
        desc = port.description.lower()
        hwid = port.hwid.lower()
        if 'bthenum' in hwid and '000000000000' not in hwid:
            ConsolePrint(f"Found active Bluetooth port: {port.device} ({desc})", conn)
            return port.device
    return None

def receive_data_windows(port, conn):
    import serial
    global serial_connection
    try:
        ser = serial.Serial(port, 9600, timeout=1)
        serial_connection = ser
        ConsolePrint(f"Connected to {port}", conn)
        ser.write(b"Connected to the raspberry\n")
        while True:
            try:
                line = ser.readline()
                if not line:
                    continue
                data = line.decode('utf-8', errors='ignore').strip()
                if data:
                    ConsolePrint(f"Received (Serial): {data}", conn)
                    conn.sendall(f"BT:{data}".encode())
            except serial.SerialException as e:
                ConsolePrint(f"Serial read error: {e}", conn)
                break
            except KeyboardInterrupt:
                ConsolePrint("Serial read interrupted by user.", conn)
                break
    except serial.SerialException as e:
        ConsolePrint(f"Failed to open serial port {port}: {e}", conn)
    except OSError as e:
        ConsolePrint(f"OS error opening serial port {port}: {e}", conn)

def handle_bluetooth_windows(conn):
    try:
        import serial
        port = find_active_bluetooth_port(conn)
        if port is None:
            ConsolePrint("Could not find an active Bluetooth serial port.", conn)
            return

        thread = Thread(target=receive_data_windows, args=(port, conn), daemon=True)
        thread.start()

    except ImportError:
        ConsolePrint("pyserial is not installed. Run: pip install pyserial", conn)
    except Exception as e:
        ConsolePrint(f"Unexpected error in Windows Bluetooth setup: {e}", conn)

def send_bluetooth_message(message, conn):
    global bt_client_sock, serial_connection
    try:
        if is_linux and bt_client_sock:
            bt_client_sock.send(message.encode())
            ConsolePrint(f"Message envoyé via Bluetooth (Linux): {message}", conn)
        elif is_windows and serial_connection:
            serial_connection.write((message + "\n").encode())
            ConsolePrint(f"Message envoyé via Bluetooth (Windows COM): {message}", conn)
            conn.sendall(f"BT:{message}".encode())
        else:
            ConsolePrint("Aucune connexion Bluetooth active pour envoyer le message.", conn)
    except Exception as e:
        ConsolePrint(f"Erreur lors de l'envoi Bluetooth : {e}", conn)
        conn.sendall(f"BT:Erreur lors de l'envoi Bluetooth : {e}".encode())

def start_calibration(conn):
    send_bluetooth_message("CALIBRATE", conn)
    try:
        conn.sendall("CALIBRATION_STARTED".encode())
    except Exception as e:
        ConsolePrint(f"Failed to notify Electron: {e}", conn)

# ------- Electron Listener -------
def listen_to_electron(conn):
    try:
        while True:
            try:
                data = conn.recv(1024).decode()
                if data:
                    ConsolePrint(f"Received from Electron: {data}", conn)
                    if data == "START_CALIBRATION":
                        start_calibration(conn)
            except socket.timeout:
                continue
            except (socket.error, OSError) as e:
                ConsolePrint(f"Socket error: {e}", conn)
                break
    except KeyboardInterrupt:
        ConsolePrint("Server interrupted by user. Closing.", conn)
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
        ConsolePrint("Unsupported OS for Bluetooth.", conn)

    listen_to_electron(conn)
    server_socket.close()

if __name__ == "__main__":
    main()
