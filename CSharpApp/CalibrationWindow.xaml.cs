using System;
using System.IO;
using System.Windows;
using System.Windows.Input;
using Microsoft.Web.WebView2.Core;
using LighTouch.Services;

namespace LighTouch
{
    public partial class CalibrationWindow : Window
    {
        private readonly TcpClientHandler _tcpClientHandler;
        private readonly Action<bool> _onClosed; // true = calibration réussie, false = annulée
        private bool _calibrationSuccess = false;

        public CalibrationWindow(TcpClientHandler tcpClientHandler, Action<bool> onClosed = null)
        {
            InitializeComponent();
            _tcpClientHandler = tcpClientHandler;
            _onClosed = onClosed;

            Loaded += CalibrationWindow_Loaded;
        }

        private async void CalibrationWindow_Loaded(object sender, RoutedEventArgs e)
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
                    null,
                    userDataFolder,
                    null
                );

                await webView.EnsureCoreWebView2Async(webView2Environment);

                // Configure WebView2
                webView.CoreWebView2.Settings.AreDevToolsEnabled = false;
                webView.CoreWebView2.Settings.IsScriptEnabled = true;
                webView.CoreWebView2.Settings.IsWebMessageEnabled = true;

                // Subscribe to TCP messages pour recevoir le résultat de calibration
                if (_tcpClientHandler != null)
                {
                    _tcpClientHandler.MessageReceived += OnTcpMessageReceived;
                }

                // Get the path to the calibration HTML file
                string appPath = AppDomain.CurrentDomain.BaseDirectory;
                string wwwrootPath = Path.Combine(appPath, "wwwroot");
                string calibrationPath = Path.Combine(wwwrootPath, "calibration.html");

                // If wwwroot doesn't exist locally, try the Frontend folder (dev mode)
                if (!File.Exists(calibrationPath))
                {
                    wwwrootPath = Path.Combine(Directory.GetParent(appPath).Parent.Parent.Parent.FullName, "Frontend");
                    calibrationPath = Path.Combine(wwwrootPath, "calibration.html");
                }

                // Load the calibration HTML file
                if (File.Exists(calibrationPath))
                {
                    webView.CoreWebView2.Navigate(new Uri(calibrationPath).AbsoluteUri);
                    Console.WriteLine($"[CalibrationWindow] Loaded: {calibrationPath}");

                    // Envoyer la commande de calibration au Python
                    SendStartCalibration();
                }
                else
                {
                    Console.WriteLine($"[CalibrationWindow] Cannot find calibration.html at {calibrationPath}");
                    Close();
                }

                // Focus la fenêtre
                Activate();
                Focus();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CalibrationWindow] Error initializing: {ex.Message}");
                Close();
            }
        }

        private void SendStartCalibration()
        {
            if (_tcpClientHandler != null)
            {
                var msg = System.Text.Json.JsonSerializer.Serialize(new
                {
                    category = "screen",
                    method = "start_calibration",
                    @params = new { }
                });
                _tcpClientHandler.SendMessage(msg);
                Console.WriteLine($"[CalibrationWindow] Sent: {msg}");
            }
        }

        private void SendStopCalibration()
        {
            if (_tcpClientHandler != null)
            {
                var msg = System.Text.Json.JsonSerializer.Serialize(new
                {
                    category = "screen",
                    method = "stop_calibration",
                    @params = new { }
                });
                _tcpClientHandler.SendMessage(msg);
                Console.WriteLine($"[CalibrationWindow] Sent: {msg}");
            }
        }

        /// <summary>
        /// Reçoit les messages TCP pour détecter la fin de calibration
        /// </summary>
        private void OnTcpMessageReceived(object sender, string message)
        {
            try
            {
                // Parse le message JSON
                var parsed = System.Text.Json.JsonDocument.Parse(message);
                var root = parsed.RootElement;

                if (root.TryGetProperty("category", out var category) &&
                    root.TryGetProperty("method", out var method) &&
                    category.GetString() == "screen" &&
                    method.GetString() == "calibrate")
                {
                    // Calibration terminée
                    if (root.TryGetProperty("params", out var paramsElement) &&
                        paramsElement.TryGetProperty("value", out var value))
                    {
                        _calibrationSuccess = value.GetBoolean() == false; // false = succès dans ce protocole
                    }

                    Dispatcher.Invoke(() =>
                    {
                        Console.WriteLine($"[CalibrationWindow] Calibration finished, success: {_calibrationSuccess}");
                        Close();
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CalibrationWindow] Error parsing message: {ex.Message}");
            }
        }

        private void Window_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Escape)
            {
                Console.WriteLine("[CalibrationWindow] Escape pressed, cancelling calibration");
                SendStopCalibration();
                _calibrationSuccess = false;
                Close();
            }
        }

        protected override void OnClosed(EventArgs e)
        {
            // Se désabonner des événements TCP
            if (_tcpClientHandler != null)
            {
                _tcpClientHandler.MessageReceived -= OnTcpMessageReceived;
            }

            // Appeler le callback avec le résultat
            _onClosed?.Invoke(_calibrationSuccess);

            base.OnClosed(e);
        }
    }
}
