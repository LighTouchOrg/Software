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
        private TcpServerHandler tcpServerHandler;
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
                tcpServerHandler = new TcpServerHandler();
                tcpServerHandler.Port = 8888; // Port TCP configurable

                mouseKeyboardController = new MouseKeyboardController();
                wifiManager = new WiFiManager();

                // Create and expose JavaScript bridge
                jsBridge = new JavaScriptBridge(
                    tcpServerHandler,  // Passe TcpServerHandler au lieu de BluetoothHandler
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

                // Start TCP server
                // MIGRATION: Démarre le serveur TCP au lieu de Bluetooth
                // await bluetoothHandler.StartAsync();
                await tcpServerHandler.StartAsync();
            }
            catch (Exception ex)
            {
                System.Windows.MessageBox.Show($"Initialization error: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        protected override void OnClosed(EventArgs e)
        {
            // MIGRATION: Dispose du serveur TCP au lieu de Bluetooth
            // bluetoothHandler?.Dispose();
            tcpServerHandler?.Dispose();
            base.OnClosed(e);
        }
    }
}
