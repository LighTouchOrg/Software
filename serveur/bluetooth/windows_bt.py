from threading import Thread

def find_active_bluetooth_port():
    import serial.tools.list_ports
    ports = serial.tools.list_ports.comports()
    for port in ports:
        hwid = port.hwid.lower()
        if 'bthenum' in hwid and '000000000000' not in hwid:
            return port.device
    return ports[0].device if ports else None

def receive_data_windows(port, conn):
    import serial
    from bluetooth.common import serial_connection
    try:
        ser = serial.Serial(port, 9600, timeout=1)
        serial_connection = ser
        ser.write(b"Connected to the raspberry\\n")
        while True:
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
            thread = Thread(target=receive_data_windows, args=(port, conn), daemon=True)
            thread.start()
        else:
            print("No COM port found.")
    except Exception as e:
        print("Windows Bluetooth setup failed:", e)