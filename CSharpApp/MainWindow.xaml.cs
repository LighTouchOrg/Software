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
        private UdpDiscoveryService udpDiscoveryService;
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
                // Configure WebView2 to use AppData for user data
                string userDataFolder = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "LighTouch",
                    "WebView2Data"
                );

                var webView2Environment = await CoreWebView2Environment.CreateAsync(
                    null, // browserExecutableFolder (null = use installed WebView2)
                    userDataFolder, // userDataFolder
                    null // options
                );

                // Initialize WebView2
                await webView.EnsureCoreWebView2Async(webView2Environment);

                // Initialize handlers
                // MIGRATION: Utilisation de TCP au lieu de Bluetooth
                // bluetoothHandler = new BluetoothHandler();
                // MIGRATION V2: Client TCP qui se connecte au serveur Python
                tcpClientHandler = new TcpClientHandler();
                // L'IP sera définie automatiquement par la découverte UDP
                tcpClientHandler.ReconnectDelayMs = 5000; // Reconnexion toutes les 5 secondes

                // Service de découverte réseau pour trouver automatiquement le serveur
                udpDiscoveryService = new UdpDiscoveryService(8889);
                udpDiscoveryService.ServerDiscovered += OnServerDiscovered;

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

                // If wwwroot doesn't exist locally, try the Frontend folder (dev mode)
                if (!File.Exists(indexPath))
                {
                    wwwrootPath = Path.Combine(Directory.GetParent(appPath).Parent.Parent.Parent.FullName, "Frontend");
                    indexPath = Path.Combine(wwwrootPath, "index.html");
                }

                // If still not found, try embedded resources (release mode)
                if (!File.Exists(indexPath))
                {
                    try
                    {
                        wwwrootPath = ResourceExtractor.GetWwwRootPath();
                        indexPath = Path.Combine(wwwrootPath, "index.html");
                    }
                    catch (Exception ex)
                    {
                        System.Windows.MessageBox.Show($"Failed to extract embedded resources: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                    }
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

                // Start UDP discovery first
                await udpDiscoveryService.StartAsync();

                // Start TCP client (will connect when server is discovered)
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

        /// <summary>
        /// Appelé quand un serveur est découvert via UDP broadcast
        /// </summary>
        private void OnServerDiscovered(object sender, ServerDiscoveredEventArgs e)
        {
            Console.WriteLine($"[MainWindow] Serveur découvert: {e.ServerIp}:{e.ServerPort}");

            // Met à jour l'IP et le port du client TCP
            tcpClientHandler.ServerHost = e.ServerIp;
            tcpClientHandler.ServerPort = e.ServerPort;

            Console.WriteLine($"[MainWindow] Configuration TCP mise à jour: {e.ServerIp}:{e.ServerPort}");
        }

        protected override void OnClosed(EventArgs e)
        {
            // MIGRATION: Dispose du client TCP au lieu de Bluetooth
            // MIGRATION V2: Dispose du client TCP au lieu du serveur
            // bluetoothHandler?.Dispose();
            udpDiscoveryService?.Dispose();
            tcpClientHandler?.Dispose();
            base.OnClosed(e);
        }
    }
}
