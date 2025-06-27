from threading import Thread
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
            print("Erreur lors de l'ouverture du port série:", e)
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
                print("Received (Serial):", data)
                conn.sendall(f"BT:{data}".encode())
    except Exception as e:
        print("Serial error:", e)

def handle_bluetooth_windows(conn):
    try:
        import serial
        port = find_active_bluetooth_port()
        if port:
            ensure_serial_connection(port)
            thread = Thread(target=receive_data_windows, args=(port, conn), daemon=True)
            thread.start()
        else:
            print("No COM port found.")
    except Exception as e:
        print("Windows Bluetooth setup failed:", e)