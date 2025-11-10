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
        private readonly BluetoothHandler _bluetoothHandler;
        private readonly MouseKeyboardController _mouseKeyboardController;
        private readonly WiFiManager _wifiManager;
        private readonly WebView2 _webView;

        public JavaScriptBridge(
            BluetoothHandler bluetoothHandler,
            MouseKeyboardController mouseKeyboardController,
            WiFiManager wifiManager,
            WebView2 webView)
        {
            _bluetoothHandler = bluetoothHandler;
            _mouseKeyboardController = mouseKeyboardController;
            _wifiManager = wifiManager;
            _webView = webView;

            // Subscribe to Bluetooth messages
            _bluetoothHandler.MessageReceived += OnBluetoothMessageReceived;
        }

        private async void OnBluetoothMessageReceived(object sender, string message)
        {
            // Forward Bluetooth messages to JavaScript
            await _webView.Dispatcher.InvokeAsync(async () =>
            {
                try
                {
                    string script = $"window.handleBluetoothMessage({message})";
                    await _webView.CoreWebView2.ExecuteScriptAsync(script);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error forwarding message to JS: {ex.Message}");
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

        // Send message to Python (now to Bluetooth)
        public void SendToPython(string message)
        {
            _bluetoothHandler.SendMessage(message);
        }

        // Mouse control methods
        public void MoveMouse(int x, int y)
        {
            _mouseKeyboardController.MoveMouse(x, y);
        }

        public void PressMouse(int x = -1, int y = -1, string button = "LEFT")
        {
            _mouseKeyboardController.PressMouse(x, y, button);
        }

        public void ReleaseMouse(int x = -1, int y = -1, string button = "LEFT")
        {
            _mouseKeyboardController.ReleaseMouse(x, y, button);
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
