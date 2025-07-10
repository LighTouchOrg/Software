from threading import Thread
import time
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
    import bluetooth
    connected = False

    while not connected:
        try:
            bluetooth_client = bluetooth.BluetoothSocket(bluetooth.RFCOMM)
            bluetooth_client.bind(("", bluetooth.PORT_ANY))
            bluetooth_client.listen(1)
            port = bluetooth_client.getsockname()[1]
            print(f"[BT] Serveur prêt sur le canal RFCOMM {port}. En attente d'une connexion...")

            bluetooth_client.settimeout(10.0)  # max 10s wait for a connection
            try:
                client_sock, client_info = bluetooth_client.accept()
                print(f"[BT] Connexion Bluetooth acceptée depuis {client_info}")
                thread = Thread(target=receive_data_raspi, args=(client_sock, conn), daemon=True)
                thread.start()
                connected = True
            except bluetooth.BluetoothError:
                print("[BT] Pas de connexion détectée. Nouvelle tentative dans 10 secondes.")
                bluetooth_client.close()
                time.sleep(10)
        except Exception as e:
            print("[BT] Erreur serveur Bluetooth :", e)
            time.sleep(10)