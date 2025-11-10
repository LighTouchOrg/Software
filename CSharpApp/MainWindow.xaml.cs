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
        private BluetoothHandler bluetoothHandler;
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
                bluetoothHandler = new BluetoothHandler();
                mouseKeyboardController = new MouseKeyboardController();
                wifiManager = new WiFiManager();

                // Create and expose JavaScript bridge
                jsBridge = new JavaScriptBridge(
                    bluetoothHandler,
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
                    MessageBox.Show($"Cannot find index.html at {indexPath}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                }

                // Start Bluetooth handler
                await bluetoothHandler.StartAsync();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Initialization error: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        protected override void OnClosed(EventArgs e)
        {
            bluetoothHandler?.Dispose();
            base.OnClosed(e);
        }
    }
}
