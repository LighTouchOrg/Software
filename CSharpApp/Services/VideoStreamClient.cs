using System;
using System.IO;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Media.Imaging;

namespace LighTouch.Services
{
    /// <summary>
    /// Client for receiving video stream from the Python application.
    /// Protocol: [4 bytes frame size (big-endian)][JPEG data]
    /// </summary>
    public class VideoStreamClient : IDisposable
    {
        private TcpClient _tcpClient;
        private NetworkStream _stream;
        private CancellationTokenSource _cancellationTokenSource;
        private bool _isRunning;
        private bool _isConnected;
        private readonly object _lock = new object();

        // Configuration
        public string ServerHost { get; set; }
        public int ServerPort { get; set; } = 8890;
        public int ReconnectDelayMs { get; set; } = 5000;

        // Events
        public event EventHandler<BitmapImage> FrameReceived;
        public event EventHandler Connected;
        public event EventHandler Disconnected;

        public VideoStreamClient()
        {
            Console.WriteLine("[VideoStreamClient] Instance created");
        }

        /// <summary>
        /// Start the video stream client
        /// </summary>
        public Task StartAsync()
        {
            if (_isRunning)
            {
                Console.WriteLine("[VideoStreamClient] Already running");
                return Task.CompletedTask;
            }

            _isRunning = true;
            _cancellationTokenSource = new CancellationTokenSource();

            Console.WriteLine($"[VideoStreamClient] Starting...");

            Task.Run(() => ConnectionLoop(_cancellationTokenSource.Token), _cancellationTokenSource.Token);

            return Task.CompletedTask;
        }

        /// <summary>
        /// Main connection loop with auto-reconnect
        /// </summary>
        private async Task ConnectionLoop(CancellationToken cancellationToken)
        {
            while (_isRunning && !cancellationToken.IsCancellationRequested)
            {
                try
                {
                    if (!_isConnected)
                    {
                        await ConnectToServer(cancellationToken);
                    }

                    if (_isConnected && _stream != null)
                    {
                        await ReceiveFrames(cancellationToken);
                    }
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[VideoStreamClient] Error: {ex.Message}");
                    _isConnected = false;
                }

                if (!_isConnected && _isRunning)
                {
                    await Task.Delay(ReconnectDelayMs, cancellationToken);
                }
            }
        }

        /// <summary>
        /// Connect to the Python video stream server
        /// </summary>
        private async Task ConnectToServer(CancellationToken cancellationToken)
        {
            if (string.IsNullOrEmpty(ServerHost))
            {
                return;
            }

            try
            {
                Console.WriteLine($"[VideoStreamClient] Connecting to {ServerHost}:{ServerPort}...");

                lock (_lock)
                {
                    _tcpClient?.Close();
                    _tcpClient = new TcpClient();
                }

                var connectTask = _tcpClient.ConnectAsync(ServerHost, ServerPort);
                var timeoutTask = Task.Delay(5000, cancellationToken);

                var completedTask = await Task.WhenAny(connectTask, timeoutTask);

                if (completedTask == timeoutTask)
                {
                    Console.WriteLine("[VideoStreamClient] Connection timeout");
                    lock (_lock)
                    {
                        _tcpClient?.Close();
                        _tcpClient = null;
                    }
                    return;
                }

                await connectTask;

                lock (_lock)
                {
                    if (_tcpClient?.Connected == true)
                    {
                        _stream = _tcpClient.GetStream();
                        _isConnected = true;
                        Console.WriteLine($"[VideoStreamClient] Connected to {ServerHost}:{ServerPort}");
                        Connected?.Invoke(this, EventArgs.Empty);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[VideoStreamClient] Connection failed: {ex.Message}");
                lock (_lock)
                {
                    _isConnected = false;
                    _stream = null;
                    _tcpClient = null;
                }
            }
        }

        /// <summary>
        /// Receive and decode video frames
        /// </summary>
        private async Task ReceiveFrames(CancellationToken cancellationToken)
        {
            byte[] sizeBuffer = new byte[4];

            try
            {
                while (_isRunning && !cancellationToken.IsCancellationRequested && _isConnected)
                {
                    // Read frame size (4 bytes, big-endian)
                    int bytesRead = await ReadExactAsync(_stream, sizeBuffer, 0, 4, cancellationToken);
                    if (bytesRead < 4)
                    {
                        Console.WriteLine("[VideoStreamClient] Server disconnected (incomplete size header)");
                        break;
                    }

                    // Convert big-endian to frame size
                    int frameSize = (sizeBuffer[0] << 24) | (sizeBuffer[1] << 16) | (sizeBuffer[2] << 8) | sizeBuffer[3];

                    if (frameSize <= 0 || frameSize > 10_000_000) // Max 10MB per frame
                    {
                        Console.WriteLine($"[VideoStreamClient] Invalid frame size: {frameSize}");
                        break;
                    }

                    // Read frame data
                    byte[] frameData = new byte[frameSize];
                    bytesRead = await ReadExactAsync(_stream, frameData, 0, frameSize, cancellationToken);
                    if (bytesRead < frameSize)
                    {
                        Console.WriteLine("[VideoStreamClient] Server disconnected (incomplete frame)");
                        break;
                    }

                    // Decode JPEG to BitmapImage on UI thread
                    try
                    {
                        var bitmap = DecodeJpeg(frameData);
                        if (bitmap != null)
                        {
                            FrameReceived?.Invoke(this, bitmap);
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[VideoStreamClient] Frame decode error: {ex.Message}");
                    }
                }
            }
            catch (IOException ex)
            {
                Console.WriteLine($"[VideoStreamClient] IO error: {ex.Message}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[VideoStreamClient] Receive error: {ex.Message}");
            }
            finally
            {
                Console.WriteLine("[VideoStreamClient] Disconnected from server");

                lock (_lock)
                {
                    _isConnected = false;
                    _stream?.Close();
                    _tcpClient?.Close();
                    _stream = null;
                    _tcpClient = null;
                }

                Disconnected?.Invoke(this, EventArgs.Empty);
            }
        }

        /// <summary>
        /// Read exact number of bytes from stream
        /// </summary>
        private async Task<int> ReadExactAsync(NetworkStream stream, byte[] buffer, int offset, int count, CancellationToken cancellationToken)
        {
            int totalRead = 0;
            while (totalRead < count)
            {
                int read = await stream.ReadAsync(buffer, offset + totalRead, count - totalRead, cancellationToken);
                if (read == 0)
                {
                    return totalRead;
                }
                totalRead += read;
            }
            return totalRead;
        }

        /// <summary>
        /// Decode JPEG bytes to BitmapImage
        /// </summary>
        private BitmapImage DecodeJpeg(byte[] jpegData)
        {
            var bitmap = new BitmapImage();
            bitmap.BeginInit();
            bitmap.StreamSource = new MemoryStream(jpegData);
            bitmap.CacheOption = BitmapCacheOption.OnLoad;
            bitmap.EndInit();
            bitmap.Freeze(); // Make it cross-thread accessible
            return bitmap;
        }

        /// <summary>
        /// Check if connected to server
        /// </summary>
        public bool IsConnected
        {
            get
            {
                lock (_lock)
                {
                    return _isConnected && _tcpClient?.Connected == true;
                }
            }
        }

        /// <summary>
        /// Stop the video stream client
        /// </summary>
        public void Stop()
        {
            Console.WriteLine("[VideoStreamClient] Stopping...");
            _isRunning = false;
            _cancellationTokenSource?.Cancel();

            lock (_lock)
            {
                _isConnected = false;
                _stream?.Close();
                _tcpClient?.Close();
            }

            Console.WriteLine("[VideoStreamClient] Stopped");
        }

        /// <summary>
        /// Dispose resources
        /// </summary>
        public void Dispose()
        {
            Stop();
            _cancellationTokenSource?.Dispose();
            _stream?.Dispose();
            _tcpClient?.Dispose();
        }
    }
}
