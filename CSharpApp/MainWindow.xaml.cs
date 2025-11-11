using System;
using System.IO;
using System.Windows;
using Microsoft.Web.WebView2.Core;
using LighTouch.Services;

namespace LighTouch
{
    public partial class MainWindow : Window
    {
        private JavaScriptBridge jsBridge;
        // MIGRATION: Bluetooth remplacé par TCP/IP
        // private BluetoothHandler bluetoothHandler;
        // MIGRATION V2: Client TCP au lieu de serveur (se connecte au serveur Python)
        private TcpClientHandler tcpClientHandler;
        private MouseKeyboardController mouseKeyboardController;
        private WiFiManager wifiManager;

        public MainWindow()
        {
            InitializeComponent();
            InitializeAsync();
        }

        private async void InitializeAsync()
        {
            try
            {
                // Initialize WebView2
                await webView.EnsureCoreWebView2Async(null);

                // Initialize handlers
                // MIGRATION: Utilisation de TCP au lieu de Bluetooth
                // bluetoothHandler = new BluetoothHandler();
                // MIGRATION V2: Client TCP qui se connecte au serveur Python
                tcpClientHandler = new TcpClientHandler();
                tcpClientHandler.ServerHost = "127.0.0.1"; // Adresse du serveur Python
                tcpClientHandler.ServerPort = 8888; // Port du serveur Python
                tcpClientHandler.ReconnectDelayMs = 5000; // Reconnexion toutes les 5 secondes

                mouseKeyboardController = new MouseKeyboardController();
                wifiManager = new WiFiManager();

                // Create and expose JavaScript bridge
                jsBridge = new JavaScriptBridge(
                    tcpClientHandler,  // Passe TcpClientHandler au lieu de TcpServerHandler
                    mouseKeyboardController,
                    wifiManager,
                    webView
                );

                webView.CoreWebView2.AddHostObjectToScript("electronAPI", jsBridge);

                // Configure WebView2
                webView.CoreWebView2.Settings.AreDevToolsEnabled = true;
                webView.CoreWebView2.Settings.IsScriptEnabled = true;
                webView.CoreWebView2.Settings.IsWebMessageEnabled = true;

                // Get the path to the HTML files
                string appPath = AppDomain.CurrentDomain.BaseDirectory;
                string wwwrootPath = Path.Combine(appPath, "wwwroot");
                string indexPath = Path.Combine(wwwrootPath, "index.html");

                // If wwwroot doesn't exist, try the Frontend folder directly
                if (!File.Exists(indexPath))
                {
                    wwwrootPath = Path.Combine(Directory.GetParent(appPath).Parent.Parent.Parent.FullName, "Frontend");
                    indexPath = Path.Combine(wwwrootPath, "index.html");
                }

                // Load the main HTML file
                if (File.Exists(indexPath))
                {
                    webView.CoreWebView2.Navigate(new Uri(indexPath).AbsoluteUri);
                }
                else
                {
                    System.Windows.MessageBox.Show($"Cannot find index.html at {indexPath}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                }

                // Start TCP client
                // MIGRATION: Démarre le client TCP au lieu de Bluetooth
                // MIGRATION V2: Se connecte au serveur Python (avec reconnexion auto)
                // await bluetoothHandler.StartAsync();
                await tcpClientHandler.StartAsync();
            }
            catch (Exception ex)
            {
                System.Windows.MessageBox.Show($"Initialization error: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        protected override void OnClosed(EventArgs e)
        {
            // MIGRATION: Dispose du client TCP au lieu de Bluetooth
            // MIGRATION V2: Dispose du client TCP au lieu du serveur
            // bluetoothHandler?.Dispose();
            tcpClientHandler?.Dispose();
            base.OnClosed(e);
        }
    }
}
