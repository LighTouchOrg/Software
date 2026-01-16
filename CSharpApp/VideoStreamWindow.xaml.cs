using System;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media.Imaging;
using System.Windows.Threading;
using LighTouch.Services;

namespace LighTouch
{
    public partial class VideoStreamWindow : Window
    {
        private readonly VideoStreamClient _videoStreamClient;
        private readonly DispatcherTimer _fpsTimer;
        private int _frameCount;
        private DateTime _lastFpsUpdate;

        public VideoStreamWindow(VideoStreamClient videoStreamClient)
        {
            InitializeComponent();

            _videoStreamClient = videoStreamClient;

            // Subscribe to events
            _videoStreamClient.FrameReceived += OnFrameReceived;
            _videoStreamClient.Connected += OnConnected;
            _videoStreamClient.Disconnected += OnDisconnected;

            // FPS counter timer
            _fpsTimer = new DispatcherTimer
            {
                Interval = TimeSpan.FromSeconds(1)
            };
            _fpsTimer.Tick += FpsTimer_Tick;
            _fpsTimer.Start();

            _lastFpsUpdate = DateTime.Now;

            // Update initial status
            UpdateConnectionStatus(_videoStreamClient.IsConnected);

            Closed += VideoStreamWindow_Closed;
        }

        private void OnFrameReceived(object sender, BitmapImage frame)
        {
            Dispatcher.BeginInvoke(new Action(() =>
            {
                videoImage.Source = frame;
                statusText.Visibility = Visibility.Collapsed;
                _frameCount++;
            }));
        }

        private void OnConnected(object sender, EventArgs e)
        {
            Dispatcher.BeginInvoke(new Action(() =>
            {
                UpdateConnectionStatus(true);
            }));
        }

        private void OnDisconnected(object sender, EventArgs e)
        {
            Dispatcher.BeginInvoke(new Action(() =>
            {
                UpdateConnectionStatus(false);
                statusText.Text = "Disconnected. Reconnecting...";
                statusText.Visibility = Visibility.Visible;
            }));
        }

        private void UpdateConnectionStatus(bool isConnected)
        {
            if (isConnected)
            {
                connectionStatus.Text = "Connected";
                connectionStatus.Foreground = System.Windows.Media.Brushes.LightGreen;
                statusText.Visibility = Visibility.Collapsed;
            }
            else
            {
                connectionStatus.Text = "Disconnected";
                connectionStatus.Foreground = new System.Windows.Media.SolidColorBrush(
                    System.Windows.Media.Color.FromRgb(233, 69, 96));
            }
        }

        private void FpsTimer_Tick(object sender, EventArgs e)
        {
            var now = DateTime.Now;
            var elapsed = (now - _lastFpsUpdate).TotalSeconds;
            if (elapsed > 0)
            {
                int fps = (int)(_frameCount / elapsed);
                fpsText.Text = $"{fps} FPS";
                _frameCount = 0;
                _lastFpsUpdate = now;
            }
        }

        private void Window_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Escape)
            {
                Close();
            }
        }

        private void VideoStreamWindow_Closed(object sender, EventArgs e)
        {
            // Unsubscribe from events
            _videoStreamClient.FrameReceived -= OnFrameReceived;
            _videoStreamClient.Connected -= OnConnected;
            _videoStreamClient.Disconnected -= OnDisconnected;

            _fpsTimer.Stop();
        }
    }
}
