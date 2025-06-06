from threading import Thread
import select

def receive_data_raspi(client_sock, conn):
    try:
        sock_file = client_sock.makefile('r')
        while True:
            ready, _, _ = select.select([sock_file], [], [], 0.05)
            if ready:
                line = sock_file.readline().strip()
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
        print("Bluetooth server ready.")
        client_sock, _ = bluetooth_client.accept()
        thread = Thread(target=receive_data_raspi, args=(client_sock, conn), daemon=True)
        thread.start()
    except Exception as e:
        print("Failed to start Bluetooth:", e)