"""
Bluetooth server for Raspberry Pi to communicate with Electron.
Windows uses serial COM port.
"""
import os
import sys
import time
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

# Build message with good protocol
# example: message = build_message("category", "method", {"param1": "value1", "param2": "value2"})
def build_message(category, method, params):
    try:
        message = {
            "category": category,
            "method": method,
            "params": params
        }
        return json.dumps(message)
    except Exception as e:
        print(f"Error building message: {e}")
        return None

def start_electron_connection():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        server.bind(('localhost', 9000))
        server.listen(1)
        print("Python server is ready and listening on port 9000")  # Do NOT remove
        sys.stdout.flush()
    except Exception as e:
        print("Failed to bind TCP server:", e)
        sys.exit(1)

    while True:
        try:
            conn, _ = server.accept()
            conn.settimeout(1.0)
            return conn, server
        except Exception as e:
            print("Waiting for Electron to connect...")
            time.sleep(1)

# ------- Linux: RFCOMM Bluetooth -------
def receive_data_raspi(client_sock, conn):
    try:
        sock_file = client_sock.makefile('r')
        while True:
            try:
                line = sock_file.readline()
                if line:
                    line = line.strip()
                    print("Received (Bluetooth):", line)
                    conn.sendall(f"BT:{line}".encode())
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
    global serial_connection
    try:
        ser = serial.Serial(port, 9600, timeout=1)
        serial_connection = ser
        print(f"Connected to {port}")
        ser.write(b"Connected to the raspberry\n")
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

def send_bluetooth_message(message, conn):
    global bt_client_sock, serial_connection
    try:
        if is_linux and bt_client_sock:
            bt_client_sock.send(message.encode())
            print(f"Message envoyé via Bluetooth (Linux): {message}")
        elif is_windows and serial_connection:
            serial_connection.write((message + "\n").encode())
            conn.sendall(f"BT:{message}".encode())
        else:
            print("Aucune connexion Bluetooth active pour envoyer le message.")
    except Exception as e:
        print("Erreur lors de l'envoi Bluetooth :", e)
        conn.sendall(f"BT:Erreur lors de l'envoi Bluetooth : {e}".encode())

def start_calibration(conn):
    msg = build_message("screen", "calibrate", "")
    send_bluetooth_message(msg, conn)
    try:
        conn.sendall("CALIBRATION_STARTED".encode())
    except Exception as e:
        print("Failed to notify Electron:", e)

# ------- Electron Listener -------
def listen_to_electron(conn):
    try:
        calibration_active = False  # état de la calibration
        while True:
            try:
                data = conn.recv(1024).decode()
                if data:
                    print("Received from Electron:", data)
                    if data == "START_CALIBRATION":
                        if not calibration_active:
                            start_calibration(conn)
                            calibration_active = True
                    elif data == '{"category": "screen", "method": "calibrate", "params": {"value": true}}':
                        if calibration_active:
                            print("Calibration déjà active, fermeture de la fenêtre.")
                            conn.sendall("CLOSE_CALIBRATION_WINDOW".encode())
                            calibration_active = False
            except socket.timeout:
                continue  # socket is alive, just no data yet
            except (socket.error, OSError) as e:
                print("Socket error (probable déconnexion Electron):", e)
                return
    except KeyboardInterrupt:
        print("Server interrupted by user. Closing.")
    finally:
        conn.close()

# ------- Main -------
def main():
    while True:
        conn, server_socket = start_electron_connection()

        if is_linux:
            handle_bluetooth_raspi(conn)
        elif is_windows:
            handle_bluetooth_windows(conn)
        else:
            print("Unsupported OS for Bluetooth.")

        listen_to_electron(conn)
        server_socket.close()
        print("Connexion Electron terminée. En attente d'une nouvelle connexion...")

if __name__ == "__main__":
    main()
