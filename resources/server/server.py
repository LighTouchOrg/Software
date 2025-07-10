import platform
from electron.connection import start_electron_connection, listen_to_electron
from bluetooth.linux_bt import handle_bluetooth_raspi
from bluetooth.windows_bt import handle_bluetooth_windows
from threading import Thread

def main():
    is_linux = platform.system() == "Linux"
    is_windows = platform.system() == "Windows"

    conn, server_socket = start_electron_connection()

    if is_linux:
        Thread(target=handle_bluetooth_raspi, args=(conn,), daemon=True).start()
    elif is_windows:
        Thread(target=handle_bluetooth_windows, args=(conn,), daemon=True).start()
    else:
        print("Unsupported OS for Bluetooth.")

    listen_to_electron(conn)

    server_socket.close()
    print("Connexion Electron terminée. En attente d'une nouvelle connexion...")

if __name__ == "__main__":
    main()