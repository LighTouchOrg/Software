using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Input;
using Microsoft.Web.WebView2.Core;
using LighTouch.Services;

namespace LighTouch
{
    public partial class OnboardingWindow : Window
    {
        [DllImport("user32.dll")]
        private static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);

        private const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
        private const uint MOUSEEVENTF_LEFTUP = 0x0004;

        private readonly HintService _hintService;
        private readonly TcpClientHandler _tcpClientHandler;
        private readonly Action _onClosed;

        public OnboardingWindow(HintService hintService, TcpClientHandler tcpClientHandler, Action onClosed = null)
        {
            InitializeComponent();
            _hintService = hintService;
            _tcpClientHandler = tcpClientHandler;
            _onClosed = onClosed;

            Loaded += OnboardingWindow_Loaded;
            
            // S'abonner à l'événement Échap du HintService
            _hintService.EscapePressed += OnHintEscapePressed;
        }

        private async void OnboardingWindow_Loaded(object sender, RoutedEventArgs e)
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

                // Create a bridge for hints
                var bridge = new OnboardingBridge(_hintService, this);
                webView.CoreWebView2.AddHostObjectToScript("onboardingAPI", bridge);

                // Configure WebView2
                webView.CoreWebView2.Settings.AreDevToolsEnabled = true;
                webView.CoreWebView2.Settings.IsScriptEnabled = true;
                webView.CoreWebView2.Settings.IsWebMessageEnabled = true;

                // Simuler un clic de souris quand la page est chargée pour forcer le focus
                webView.CoreWebView2.NavigationCompleted += (s, args) =>
                {
                    Dispatcher.Invoke(() =>
                    {
                        // Simuler un clic à la position actuelle de la souris (invisible)
                        mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
                        mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
                    });
                };

                // Subscribe to TCP messages pour recevoir les données du périphérique
                if (_tcpClientHandler != null)
                {
                    _tcpClientHandler.MessageReceived += OnTcpMessageReceived;
                }

                // Get the path to the onboarding HTML file
                string appPath = AppDomain.CurrentDomain.BaseDirectory;
                string wwwrootPath = Path.Combine(appPath, "wwwroot");
                string onboardingPath = Path.Combine(wwwrootPath, "onboarding", "onboarding.html");

                // If wwwroot doesn't exist locally, try the Frontend folder (dev mode)
                if (!File.Exists(onboardingPath))
                {
                    wwwrootPath = Path.Combine(Directory.GetParent(appPath).Parent.Parent.Parent.FullName, "Frontend");
                    onboardingPath = Path.Combine(wwwrootPath, "onboarding", "onboarding.html");
                }

                // Load the onboarding HTML file
                if (File.Exists(onboardingPath))
                {
                    webView.CoreWebView2.Navigate(new Uri(onboardingPath).AbsoluteUri);
                }
                else
                {
                    MessageBox.Show($"Cannot find onboarding.html at {onboardingPath}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                    Close();
                }

                // Signaler que le tutoriel commence
                _hintService.InTutorial = true;
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error initializing onboarding: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                Close();
            }
        }

        /// <summary>
        /// Reçoit les messages TCP et les transmet à la WebView de l'onboarding
        /// </summary>
        private async void OnTcpMessageReceived(object sender, string message)
        {
            await webView.Dispatcher.InvokeAsync(async () =>
            {
                try
                {
                    if (webView.CoreWebView2 == null) return;
                    
                    // Échappe les guillemets et backslashes pour le JSON
                    string escapedMessage = message
                        .Replace("\\", "\\\\")
                        .Replace("'", "\\'")
                        .Replace("\r", "")
                        .Replace("\n", "");

                    // Appelle la fonction JavaScript handleMessage avec le JSON
                    string script = $"if (typeof handleMessage === 'function') {{ handleMessage('{escapedMessage}'); }}";
                    await webView.CoreWebView2.ExecuteScriptAsync(script);

                    Console.WriteLine($"[OnboardingWindow] Message forwarded to JS: {message}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[OnboardingWindow] Error forwarding message to JS: {ex.Message}");
                }
            });
        }

        private void Window_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Escape)
            {
                CloseOnboarding();
            }
        }

        /// <summary>
        /// Appelé quand l'utilisateur appuie sur Échap pendant qu'un hint est affiché
        /// </summary>
        private void OnHintEscapePressed(object sender, EventArgs e)
        {
            // Fermer l'onboarding quand Échap est pressé sur un hint
            Dispatcher.Invoke(() => CloseOnboarding());
        }

        public void CloseOnboarding()
        {
            // Se désabonner des événements
            if (_tcpClientHandler != null)
            {
                _tcpClientHandler.MessageReceived -= OnTcpMessageReceived;
            }

            // Cacher les hints et nettoyer
            _hintService.HideCurrentHint();
            _hintService.InTutorial = false;

            // Appeler le callback
            _onClosed?.Invoke();

            Close();
        }

        public void FinishOnboarding()
        {
            // Se désabonner des événements
            if (_tcpClientHandler != null)
            {
                _tcpClientHandler.MessageReceived -= OnTcpMessageReceived;
            }

            // Marquer comme complété et nettoyer
            _hintService.TutorialCompleted = true;
            _hintService.HideCurrentHint();
            _hintService.InTutorial = false;

            // Appeler le callback
            _onClosed?.Invoke();

            Close();
        }

        protected override void OnClosed(EventArgs e)
        {
            // S'assurer de se désabonner de tous les événements
            if (_tcpClientHandler != null)
            {
                _tcpClientHandler.MessageReceived -= OnTcpMessageReceived;
            }
            _hintService.EscapePressed -= OnHintEscapePressed;
            _hintService.InTutorial = false;
            base.OnClosed(e);
        }
    }

    /// <summary>
    /// Bridge JavaScript pour la fenêtre d'onboarding
    /// </summary>
    [System.Runtime.InteropServices.ClassInterface(System.Runtime.InteropServices.ClassInterfaceType.AutoDual)]
    [System.Runtime.InteropServices.ComVisible(true)]
    public class OnboardingBridge
    {
        private readonly HintService _hintService;
        private readonly OnboardingWindow _window;

        public OnboardingBridge(HintService hintService, OnboardingWindow window)
        {
            _hintService = hintService;
            _window = window;
        }

        public void ShowSwipeHint(string direction)
        {
            System.Windows.Application.Current.Dispatcher.Invoke(() =>
            {
                _hintService.ShowSwipeHint(direction);
            });
        }

        public void ShowMoveHint()
        {
            System.Windows.Application.Current.Dispatcher.Invoke(() =>
            {
                _hintService.ShowMoveHint();
            });
        }

        public void ShowClickHint()
        {
            System.Windows.Application.Current.Dispatcher.Invoke(() =>
            {
                _hintService.ShowClickHint();
            });
        }

        public void ShowHoldClickHint()
        {
            System.Windows.Application.Current.Dispatcher.Invoke(() =>
            {
                _hintService.ShowHoldClickHint();
            });
        }

        public void HideHint()
        {
            System.Windows.Application.Current.Dispatcher.Invoke(() =>
            {
                _hintService.HideCurrentHint();
            });
        }

        public void SetTutorialCompleted(bool completed)
        {
            System.Windows.Application.Current.Dispatcher.Invoke(() =>
            {
                _hintService.TutorialCompleted = completed;
            });
        }

        public void CloseOnboarding()
        {
            System.Windows.Application.Current.Dispatcher.Invoke(() =>
            {
                _window.CloseOnboarding();
            });
        }

        public void FinishOnboarding()
        {
            System.Windows.Application.Current.Dispatcher.Invoke(() =>
            {
                _window.FinishOnboarding();
            });
        }
    }
}
