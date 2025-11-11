using System;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using Microsoft.Web.WebView2.Wpf;

namespace LighTouch.Services
{
    [ClassInterface(ClassInterfaceType.AutoDual)]
    [ComVisible(true)]
    public class JavaScriptBridge
    {
        // MIGRATION: Bluetooth remplacé par TCP/IP
        // private readonly BluetoothHandler _bluetoothHandler;
        // MIGRATION V2: Client TCP au lieu de serveur
        private readonly TcpClientHandler _tcpClientHandler;
        private readonly MouseKeyboardController _mouseKeyboardController;
        private readonly WiFiManager _wifiManager;
        private readonly WebView2 _webView;

        public JavaScriptBridge(
            TcpClientHandler tcpClientHandler,  // Client TCP au lieu de serveur
            MouseKeyboardController mouseKeyboardController,
            WiFiManager wifiManager,
            WebView2 webView)
        {
            // MIGRATION: Utilise TcpClientHandler au lieu de BluetoothHandler
            // _bluetoothHandler = bluetoothHandler;
            _tcpClientHandler = tcpClientHandler;
            _mouseKeyboardController = mouseKeyboardController;
            _wifiManager = wifiManager;
            _webView = webView;

            // Subscribe to TCP messages (même interface que Bluetooth)
            // _bluetoothHandler.MessageReceived += OnBluetoothMessageReceived;
            _tcpClientHandler.MessageReceived += OnTcpMessageReceived;

            // Subscribe to connection events
            _tcpClientHandler.ServerConnected += OnServerConnected;
            _tcpClientHandler.ServerDisconnected += OnServerDisconnected;
        }

        // MIGRATION: Renommé de OnBluetoothMessageReceived en OnTcpMessageReceived
        private async void OnTcpMessageReceived(object sender, string message)
        {
            // Forward TCP messages to JavaScript via window.processTcpMessage
            await _webView.Dispatcher.InvokeAsync(async () =>
            {
                try
                {
                    // Échappe les guillemets et backslashes pour le JSON
                    string escapedMessage = message
                        .Replace("\\", "\\\\")
                        .Replace("'", "\\'")
                        .Replace("\r", "")
                        .Replace("\n", "");

                    // Appelle la fonction JavaScript window.processTcpMessage avec le JSON
                    string script = $"window.processTcpMessage('{escapedMessage}');";
                    await _webView.CoreWebView2.ExecuteScriptAsync(script);

                    Console.WriteLine($"[JavaScriptBridge] Message forwarded to JS: {message}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[JavaScriptBridge] Error forwarding message to JS: {ex.Message}");
                }
            });
        }

        // Gestion de la connexion au serveur Python
        private async void OnServerConnected(object sender, EventArgs e)
        {
            await _webView.Dispatcher.InvokeAsync(async () =>
            {
                try
                {
                    string script = "if (window.updateConnectionStatus) { window.updateConnectionStatus(true); }";
                    await _webView.CoreWebView2.ExecuteScriptAsync(script);
                    Console.WriteLine("[JavaScriptBridge] Server connected event sent to JS");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[JavaScriptBridge] Error sending server connected event: {ex.Message}");
                }
            });
        }

        // Gestion de la déconnexion du serveur Python
        private async void OnServerDisconnected(object sender, EventArgs e)
        {
            await _webView.Dispatcher.InvokeAsync(async () =>
            {
                try
                {
                    string script = "if (window.updateConnectionStatus) { window.updateConnectionStatus(false); }";
                    await _webView.CoreWebView2.ExecuteScriptAsync(script);
                    Console.WriteLine("[JavaScriptBridge] Server disconnected event sent to JS");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[JavaScriptBridge] Error sending server disconnected event: {ex.Message}");
                }
            });
        }

        // Ping method for health check
        public string Ping()
        {
            return "pong";
        }

        // Check if app is initialized
        public bool CheckAppInitialized()
        {
            // You can implement first-run detection logic here
            return true;
        }

        // MIGRATION TCP: Vérifie si connecté au serveur Python
        public bool IsClientConnected()
        {
            bool connected = _tcpClientHandler.IsClientConnected();
            Console.WriteLine($"[JavaScriptBridge] IsClientConnected appelé depuis JS, résultat: {connected}");
            return connected;
        }

        // Send message to Python (now via TCP instead of Bluetooth)
        // MIGRATION: Utilise TCP au lieu de Bluetooth
        public void SendToPython(string message)
        {
            // _bluetoothHandler.SendMessage(message);
            _tcpClientHandler.SendMessage(message);
        }

        // Mouse control methods
        // FIX: Appeler sur le thread UI principal WPF au lieu du contexte WebView2
        public void MoveMouse(int x, int y)
        {
            Console.WriteLine($"[JavaScriptBridge] MoveMouse appelé depuis JS: x={x}, y={y}");

            // Exécuter sur le thread UI principal de l'application WPF
            System.Windows.Application.Current.Dispatcher.Invoke(() =>
            {
                Console.WriteLine($"[JavaScriptBridge] MoveMouse exécuté sur thread UI principal");
                _mouseKeyboardController.MoveMouse(x, y);
            });
        }

        public void PressMouse(int x = -1, int y = -1, string button = "LEFT")
        {
            System.Windows.Application.Current.Dispatcher.Invoke(() =>
            {
                _mouseKeyboardController.PressMouse(x, y, button);
            });
        }

        public void ReleaseMouse(int x = -1, int y = -1, string button = "LEFT")
        {
            System.Windows.Application.Current.Dispatcher.Invoke(() =>
            {
                _mouseKeyboardController.ReleaseMouse(x, y, button);
            });
        }

        // Keyboard control
        public void PressKey(string key)
        {
            _mouseKeyboardController.PressKey(key);
        }

        // WiFi QR code generation
        public string GenerateWiFiQR(string ssid, string password, string security)
        {
            return _wifiManager.GenerateQRCode(ssid, password, security);
        }

        // Refresh WiFi information
        public string RefreshWiFi()
        {
            // WiFiManager uses cache, so this should be fast
            return _wifiManager.GetCurrentWiFiInfo();
        }

        // Open external URL
        public void OpenExternal(string url)
        {
            try
            {
                System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                {
                    FileName = url,
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error opening URL: {ex.Message}");
            }
        }
    }
}
