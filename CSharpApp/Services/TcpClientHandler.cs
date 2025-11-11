using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace LighTouch.Services
{
    /// <summary>
    /// Gère un client TCP pour se connecter au serveur Python.
    /// Se reconnecte automatiquement en cas de déconnexion.
    /// Compatible avec l'interface de BluetoothHandler.
    /// </summary>
    public class TcpClientHandler : IDisposable
    {
        private TcpClient _tcpClient;
        private NetworkStream _currentStream;
        private CancellationTokenSource _cancellationTokenSource;
        private bool _isRunning;
        private bool _isConnected;
        private readonly object _lock = new object();

        // Configuration
        public string ServerHost { get; set; } = "127.0.0.1";
        public int ServerPort { get; set; } = 8888;
        public int ReconnectDelayMs { get; set; } = 5000; // Délai entre les tentatives de reconnexion

        // Event compatible avec BluetoothHandler
        public event EventHandler<string> MessageReceived;

        // Événements de connexion/déconnexion
        public event EventHandler ServerConnected;
        public event EventHandler ServerDisconnected;

        public TcpClientHandler()
        {
            Console.WriteLine("[TcpClientHandler] Instance créée");
        }

        /// <summary>
        /// Démarre le client TCP de manière asynchrone
        /// </summary>
        public async Task StartAsync()
        {
            if (_isRunning)
            {
                Console.WriteLine("[TcpClientHandler] Client déjà démarré");
                return;
            }

            _isRunning = true;
            _cancellationTokenSource = new CancellationTokenSource();

            Console.WriteLine($"[TcpClientHandler] Démarrage du client TCP...");
            Console.WriteLine($"[TcpClientHandler] Cible: {ServerHost}:{ServerPort}");

            await Task.Run(() => ConnectionLoop(_cancellationTokenSource.Token), _cancellationTokenSource.Token);
        }

        /// <summary>
        /// Boucle principale de connexion (avec reconnexion automatique)
        /// </summary>
        private async Task ConnectionLoop(CancellationToken cancellationToken)
        {
            while (_isRunning && !cancellationToken.IsCancellationRequested)
            {
                try
                {
                    // Tente de se connecter au serveur
                    if (!_isConnected)
                    {
                        await ConnectToServer(cancellationToken);
                    }

                    // Si connecté, gère la communication
                    if (_isConnected && _currentStream != null)
                    {
                        await HandleServerCommunication(_currentStream, cancellationToken);
                    }
                }
                catch (SocketException ex)
                {
                    Console.WriteLine($"[TcpClientHandler] Erreur socket : {ex.Message}");
                    _isConnected = false;
                }
                catch (Exception ex) when (!(ex is OperationCanceledException))
                {
                    Console.WriteLine($"[TcpClientHandler] Erreur client : {ex.Message}");
                    _isConnected = false;
                }

                // Si déconnecté, attend avant de réessayer
                if (!_isConnected && _isRunning)
                {
                    Console.WriteLine($"[TcpClientHandler] Reconnexion dans {ReconnectDelayMs / 1000}s...");
                    await Task.Delay(ReconnectDelayMs, cancellationToken);
                }
            }
        }

        /// <summary>
        /// Se connecte au serveur Python
        /// </summary>
        private async Task ConnectToServer(CancellationToken cancellationToken)
        {
            try
            {
                Console.WriteLine($"[TcpClientHandler] Tentative de connexion à {ServerHost}:{ServerPort}...");

                lock (_lock)
                {
                    // Ferme l'ancienne connexion si elle existe
                    if (_tcpClient != null)
                    {
                        try
                        {
                            _currentStream?.Close();
                            _tcpClient?.Close();
                        }
                        catch { }
                    }

                    _tcpClient = new TcpClient();
                }

                // Tente la connexion (avec timeout)
                var connectTask = _tcpClient.ConnectAsync(ServerHost, ServerPort);
                var timeoutTask = Task.Delay(5000, cancellationToken);

                var completedTask = await Task.WhenAny(connectTask, timeoutTask);

                if (completedTask == timeoutTask)
                {
                    Console.WriteLine("[TcpClientHandler] Timeout de connexion");
                    lock (_lock)
                    {
                        _tcpClient?.Close();
                        _tcpClient = null;
                    }
                    return;
                }

                await connectTask; // Attend la fin de la connexion

                lock (_lock)
                {
                    if (_tcpClient?.Connected == true)
                    {
                        _currentStream = _tcpClient.GetStream();
                        _isConnected = true;
                        Console.WriteLine($"[TcpClientHandler] ✓ Connecté au serveur {ServerHost}:{ServerPort}");

                        // Déclenche l'événement de connexion
                        ServerConnected?.Invoke(this, EventArgs.Empty);
                        Console.WriteLine("[TcpClientHandler] Événement ServerConnected déclenché");

                        // Envoie un message de confirmation
                        SendMessage(new
                        {
                            category = "status",
                            method = "connected",
                            message = "Application C# connectée"
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[TcpClientHandler] Échec de connexion : {ex.Message}");
                lock (_lock)
                {
                    _isConnected = false;
                    _currentStream = null;
                    _tcpClient = null;
                }
            }
        }

        /// <summary>
        /// Gère la communication avec le serveur connecté
        /// </summary>
        private async Task HandleServerCommunication(NetworkStream stream, CancellationToken cancellationToken)
        {
            var reader = new System.IO.StreamReader(stream, Encoding.UTF8);

            try
            {
                while (_isRunning && !cancellationToken.IsCancellationRequested && _isConnected)
                {
                    // Lecture ligne par ligne (compatible avec le format serveur Python)
                    var message = await reader.ReadLineAsync();

                    if (message == null)
                    {
                        Console.WriteLine($"[TcpClientHandler] Serveur déconnecté");
                        break;
                    }

                    if (string.IsNullOrWhiteSpace(message))
                    {
                        continue;
                    }

                    Console.WriteLine($"[TcpClientHandler] Message reçu du serveur: {message}");

                    // Déclenche l'événement (compatible avec BluetoothHandler)
                    OnMessageReceived(message);
                }
            }
            catch (System.IO.IOException ex)
            {
                Console.WriteLine($"[TcpClientHandler] Erreur I/O avec le serveur: {ex.Message}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[TcpClientHandler] Erreur communication serveur: {ex.Message}");
            }
            finally
            {
                Console.WriteLine($"[TcpClientHandler] Déconnexion du serveur");

                lock (_lock)
                {
                    _isConnected = false;

                    try
                    {
                        _currentStream?.Close();
                        _tcpClient?.Close();
                    }
                    catch { }

                    _currentStream = null;
                    _tcpClient = null;

                    // Déclenche l'événement de déconnexion
                    ServerDisconnected?.Invoke(this, EventArgs.Empty);
                    Console.WriteLine("[TcpClientHandler] Événement ServerDisconnected déclenché");
                }
            }
        }

        /// <summary>
        /// Vérifie si le client est actuellement connecté au serveur
        /// </summary>
        public bool IsClientConnected()
        {
            lock (_lock)
            {
                // Vérification simple et fiable
                bool connected = _isConnected && _tcpClient != null && _tcpClient.Connected;

                // Si l'état interne dit connecté mais le socket ne l'est pas, corrige
                if (_isConnected && !connected)
                {
                    Console.WriteLine("[TcpClientHandler] IsClientConnected: détection de déconnexion");
                    _isConnected = false;
                    try
                    {
                        _currentStream?.Close();
                        _tcpClient?.Close();
                    }
                    catch { }
                    _currentStream = null;
                    _tcpClient = null;
                }

                return connected;
            }
        }

        /// <summary>
        /// Envoie un message au serveur connecté
        /// Compatible avec BluetoothHandler.SendMessage()
        /// </summary>
        public void SendMessage(string message)
        {
            lock (_lock)
            {
                if (!_isConnected || _currentStream == null || _tcpClient == null || !_tcpClient.Connected)
                {
                    Console.WriteLine("[TcpClientHandler] Non connecté au serveur, impossible d'envoyer le message");
                    return;
                }

                try
                {
                    var data = Encoding.UTF8.GetBytes(message + "\n");
                    _currentStream.Write(data, 0, data.Length);
                    _currentStream.Flush();
                    Console.WriteLine($"[TcpClientHandler] Message envoyé : {message}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[TcpClientHandler] Erreur envoi message : {ex.Message}");
                    _isConnected = false;
                }
            }
        }

        /// <summary>
        /// Envoie un message au serveur connecté (surcharge pour objets)
        /// </summary>
        public void SendMessage(object messageObject)
        {
            try
            {
                var json = System.Text.Json.JsonSerializer.Serialize(messageObject);
                SendMessage(json);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[TcpClientHandler] Erreur sérialisation message : {ex.Message}");
            }
        }

        /// <summary>
        /// Déclenche l'événement MessageReceived
        /// </summary>
        protected virtual void OnMessageReceived(string message)
        {
            MessageReceived?.Invoke(this, message);
        }

        /// <summary>
        /// Arrête le client
        /// </summary>
        public void Stop()
        {
            Console.WriteLine("[TcpClientHandler] Arrêt du client...");
            _isRunning = false;
            _cancellationTokenSource?.Cancel();

            lock (_lock)
            {
                _isConnected = false;
                _currentStream?.Close();
                _tcpClient?.Close();
            }

            Console.WriteLine("[TcpClientHandler] Client arrêté");
        }

        /// <summary>
        /// Libère les ressources
        /// </summary>
        public void Dispose()
        {
            Stop();
            _cancellationTokenSource?.Dispose();
            _currentStream?.Dispose();
            _tcpClient?.Dispose();
        }
    }
}
