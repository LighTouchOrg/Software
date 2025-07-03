from threading import Thread
import select

def receive_data_raspi(client_sock, conn):
    try:
        sock_file = client_sock.makefile('r')
        while True:
            line = sock_file.readline()
            if not line:
                break
            line = line.strip()
            if line:
                print("Received (Bluetooth):", line)
                conn.sendall(f"BT:{line}".encode())
    except Exception as e:
        print("Bluetooth error:", e)

def handle_bluetooth_raspi(conn):
    try:
        import bluetooth
        bluetooth_client = bluetooth.BluetoothSocket(bluetooth.RFCOMM)
        bluetooth_client.bind(("", bluetooth.PORT_ANY))
        bluetooth_client.listen(1)
        port = bluetooth_client.getsockname()[1]
        print(f"Bluetooth server ready. Waiting for connection on RFCOMM channel {port}")
        client_sock, client_info = bluetooth_client.accept()
        print(f"Accepted Bluetooth connection from {client_info}")
        thread = Thread(target=receive_data_raspi, args=(client_sock, conn), daemon=True)
        thread.start()
    except Exception as e:
        print("Failed to start Bluetooth:", e)