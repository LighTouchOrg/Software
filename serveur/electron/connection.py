import socket
import sys
import time
from bluetooth.common import send_bluetooth_message
from utils.message_builder import build_message

def start_electron_connection():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        server.bind(('localhost', 9000))
        server.listen(1)
        print("Python server is ready and listening on port 9000")
        sys.stdout.flush()
    except Exception as e:
        print("Failed to bind TCP server:", e)
        sys.exit(1)

    while True:
        try:
            conn, _ = server.accept()
            conn.settimeout(1.0)
            return conn, server
        except Exception:
            print("Waiting for Electron to connect...")
            time.sleep(1)

def start_calibration(conn):
    msg = build_message("screen", "calibrate", "")
    send_bluetooth_message(msg, conn)
    try:
        conn.sendall("CALIBRATION_STARTED".encode())
    except Exception as e:
        print("Failed to notify Electron:", e)

def listen_to_electron(conn):
    calibration_active = False
    try:
        while True:
            try:
                data = conn.recv(1024).decode()
                if data:
                    print("Received from Electron:", data)
                    if data == "START_CALIBRATION" and not calibration_active:
                        start_calibration(conn)
                        calibration_active = True
                    elif data == '{"category": "screen", "method": "calibrate", "params": {"value": true}}':
                        if calibration_active:
                            conn.sendall("CLOSE_CALIBRATION_WINDOW".encode())
                            calibration_active = False
            except socket.timeout:
                continue
            except (socket.error, OSError) as e:
                print("Socket error:", e)
                return
    finally:
        conn.close()