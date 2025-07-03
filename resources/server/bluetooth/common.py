import platform

bt_client_sock = None
serial_connection = None

is_linux = platform.system() == "Linux"
is_windows = platform.system() == "Windows"

def send_bluetooth_message(message, conn):
    global bt_client_sock, serial_connection
    try:
        if is_linux and bt_client_sock:
            bt_client_sock.send(message.encode())
        elif is_windows and serial_connection:
            serial_connection.write((message + "\n").encode())
            conn.sendall(f"BT:{message}".encode())
        else:
            print("Aucune connexion Bluetooth active.")
    except Exception as e:
        print("Erreur d'envoi Bluetooth :", e)
        conn.sendall(f"BT:Erreur : {e}".encode())