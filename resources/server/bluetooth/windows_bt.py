from threading import Thread
import time
import bluetooth.common

def find_active_bluetooth_port():
    import serial.tools.list_ports
    ports = serial.tools.list_ports.comports()
    for port in ports:
        hwid = port.hwid.lower()
        if 'bthenum' in hwid and '000000000000' not in hwid:
            return port.device
    return ports[0].device if ports else None

def ensure_serial_connection(port):
    import serial
    if bluetooth.common.serial_connection is None or not bluetooth.common.serial_connection.is_open:
        try:
            bluetooth.common.serial_connection = serial.Serial(port, 9600, timeout=1)
            bluetooth.common.serial_connection.write(b"Connected to the raspberry\n")
        except Exception as e:
            print(f"[BT] Échec ouverture du port série {port} :", e)
            bluetooth.common.serial_connection = None

def receive_data_windows(port, conn):
    import serial
    try:
        ensure_serial_connection(port)
        ser = bluetooth.common.serial_connection
        while True:
            if ser is None or not ser.is_open:
                ensure_serial_connection(port)
                ser = bluetooth.common.serial_connection
            data = ser.readline().decode('utf-8', errors='ignore').strip()
            if data:
                print(data)
                conn.sendall(f"BT:{data}".encode())
    except Exception as e:
        print("Serial error:", e)

def handle_bluetooth_windows(conn):
    import serial
    connected = False

    while not connected:
        port = find_active_bluetooth_port()
        if port:
            try:
                ensure_serial_connection(port)
                if bluetooth.common.serial_connection and bluetooth.common.serial_connection.is_open:
                    thread = Thread(target=receive_data_windows, args=(port, conn), daemon=True)
                    thread.start()
                    connected = True
            except Exception as e:
                print(f"[BT] Port {port} trouvé mais erreur :", e)
        else:
            print("[BT] Aucun port COM Bluetooth trouvé.")

        if not connected:
            time.sleep(10)