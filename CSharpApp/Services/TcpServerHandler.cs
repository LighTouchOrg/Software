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
    /// Gère un serveur TCP pour remplacer la communication Bluetooth.
    /// Compatible avec l'interface de BluetoothHandler.
    /// </summary>
    public class TcpServerHandler : IDisposable
    {
        private TcpListener _tcpListener;
        private TcpClient _currentClient;
        private NetworkStream _currentStream;
        private CancellationTokenSource _cancellationTokenSource;
        private bool _isRunning;
        private readonly object _lock = new object();

        // Configuration
        public int Port { get; set; } = 8888;
        public bool AllowMultipleClients { get; set; } = false;

        // Event compatible avec BluetoothHandler
        public event EventHandler<string> MessageReceived;
        
        // Événements de connexion/déconnexion
        public event EventHandler ClientConnected;
        public event EventHandler ClientDisconnected;

        public TcpServerHandler()
        {
            Console.WriteLine("[TcpServerHandler] Instance créée");
        }

        /// <summary>
        /// Démarre le serveur TCP de manière asynchrone
        /// </summary>
        public async Task StartAsync()
        {
            if (_isRunning)
            {
                Console.WriteLine("[TcpServerHandler] Serveur déjà démarré");
                return;
            }

            _isRunning = true;
            _cancellationTokenSource = new CancellationTokenSource();

            Console.WriteLine($"[TcpServerHandler] Démarrage du serveur TCP sur le port {Port}...");

            await Task.Run(() => ServerLoop(_cancellationTokenSource.Token), _cancellationTokenSource.Token);
        }

        /// <summary>
        /// Boucle principale du serveur
        /// </summary>
        private async Task ServerLoop(CancellationToken cancellationToken)
        {
            while (_isRunning && !cancellationToken.IsCancellationRequested)
            {
                try
                {
                    // Démarrage du listener
                    if (_tcpListener == null)
                    {
                        _tcpListener = new TcpListener(IPAddress.Any, Port);
                        _tcpListener.Start();
                        Console.WriteLine($"[TcpServerHandler] Serveur en écoute sur 0.0.0.0:{Port}");
                        Console.WriteLine($"[TcpServerHandler] Adresses IP locales :");

                        // Affiche toutes les adresses IP locales
                        foreach (var ip in GetLocalIPAddresses())
                        {
                            Console.WriteLine($"  - {ip}:{Port}");
                        }
                    }

                    // Accepte les connexions entrantes
                    Console.WriteLine("[TcpServerHandler] En attente de connexion client...");
                    var client = await _tcpListener.AcceptTcpClientAsync();

                    var clientEndpoint = client.Client.RemoteEndPoint.ToString();
                    Console.WriteLine($"[TcpServerHandler] Client connecté : {clientEndpoint}");

                    // Gestion du client
                    if (!AllowMultipleClients)
                    {
                        // Mode client unique : ferme la connexion précédente
                        lock (_lock)
                        {
                            if (_currentClient != null && _currentClient.Connected)
                            {
                                Console.WriteLine("[TcpServerHandler] Fermeture du client précédent");
                                _currentStream?.Close();
                                _currentClient?.Close();
                            }

                            _currentClient = client;
                            _currentStream = client.GetStream();
                        }

                        // Déclenche l'événement de connexion
                        ClientConnected?.Invoke(this, EventArgs.Empty);
                        Console.WriteLine("[TcpServerHandler] Événement ClientConnected déclenché");

                        // Gère la communication avec ce client
                        await HandleClientCommunication(_currentClient, _currentStream, cancellationToken);
                    }
                    else
                    {
                        // Mode multi-clients : gère chaque client dans une tâche séparée
                        _ = Task.Run(async () =>
                        {
                            var stream = client.GetStream();
                            await HandleClientCommunication(client, stream, cancellationToken);
                        }, cancellationToken);
                    }
                }
                catch (SocketException ex)
                {
                    Console.WriteLine($"[TcpServerHandler] Erreur socket : {ex.Message}");
                    await Task.Delay(5000, cancellationToken); // Attend avant de réessayer
                }
                catch (Exception ex) when (!(ex is OperationCanceledException))
                {
                    Console.WriteLine($"[TcpServerHandler] Erreur serveur : {ex.Message}");
                    await Task.Delay(5000, cancellationToken);
                }
            }
        }

        /// <summary>
        /// Gère la communication avec un client connecté
        /// </summary>
        private async Task HandleClientCommunication(TcpClient client, NetworkStream stream, CancellationToken cancellationToken)
        {
            var clientEndpoint = client.Client.RemoteEndPoint?.ToString() ?? "Unknown";
            var reader = new System.IO.StreamReader(stream, Encoding.UTF8);

            try
            {
                while (_isRunning && !cancellationToken.IsCancellationRequested && client.Connected)
                {
                    // Lecture ligne par ligne (compatible avec le format Bluetooth)
                    var message = await reader.ReadLineAsync();

                    if (message == null)
                    {
                        Console.WriteLine($"[TcpServerHandler] Client {clientEndpoint} déconnecté");
                        break;
                    }

                    if (string.IsNullOrWhiteSpace(message))
                    {
                        continue;
                    }

                    Console.WriteLine($"[TcpServerHandler] Message reçu de {clientEndpoint}: {message}");

                    // Déclenche l'événement (compatible avec BluetoothHandler)
                    OnMessageReceived(message);
                }
            }
            catch (System.IO.IOException ex)
            {
                Console.WriteLine($"[TcpServerHandler] Erreur I/O avec {clientEndpoint}: {ex.Message}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[TcpServerHandler] Erreur communication {clientEndpoint}: {ex.Message}");
            }
            finally
            {
                Console.WriteLine($"[TcpServerHandler] Nettoyage de la connexion {clientEndpoint}");
                stream?.Close();
                client?.Close();

                lock (_lock)
                {
                    if (_currentClient == client)
                    {
                        _currentClient = null;
                        _currentStream = null;
                        
                        // Déclenche l'événement de déconnexion
                        ClientDisconnected?.Invoke(this, EventArgs.Empty);
                        Console.WriteLine("[TcpServerHandler] Événement ClientDisconnected déclenché");
                    }
                }
            }
        }

        /// <summary>
        /// Vérifie si un client est actuellement connecté
        /// </summary>
        public bool IsClientConnected()
        {
            lock (_lock)
            {
                // Vérification simple et fiable : client existe ET est connecté
                bool connected = _currentClient != null && _currentClient.Connected;

                // Log uniquement si changement d'état pour éviter le spam
                if (!connected && _currentClient != null)
                {
                    Console.WriteLine("[TcpServerHandler] IsClientConnected: client déconnecté, nettoyage");
                    try
                    {
                        _currentStream?.Close();
                        _currentClient?.Close();
                    }
                    catch { }
                    _currentStream = null;
                    _currentClient = null;
                }

                return connected;
            }
        }

        /// <summary>
        /// Envoie un message au client connecté
        /// Compatible avec BluetoothHandler.SendMessage()
        /// </summary>
        public void SendMessage(string message)
        {
            lock (_lock)
            {
                if (_currentStream == null || !_currentClient.Connected)
                {
                    Console.WriteLine("[TcpServerHandler] Aucun client connecté pour envoyer le message");
                    return;
                }

                try
                {
                    var data = Encoding.UTF8.GetBytes(message + "\n");
                    _currentStream.Write(data, 0, data.Length);
                    _currentStream.Flush();
                    Console.WriteLine($"[TcpServerHandler] Message envoyé : {message}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[TcpServerHandler] Erreur envoi message : {ex.Message}");
                }
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
        /// Obtient toutes les adresses IP locales
        /// </summary>
        private List<string> GetLocalIPAddresses()
        {
            var addresses = new List<string>();

            try
            {
                var hostName = Dns.GetHostName();
                var hostEntry = Dns.GetHostEntry(hostName);

                foreach (var ip in hostEntry.AddressList)
                {
                    // Filtre pour ne garder que les IPv4 locales
                    if (ip.AddressFamily == AddressFamily.InterNetwork)
                    {
                        addresses.Add(ip.ToString());
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[TcpServerHandler] Erreur récupération IP : {ex.Message}");
            }

            return addresses;
        }

        /// <summary>
        /// Arrête le serveur
        /// </summary>
        public void Stop()
        {
            Console.WriteLine("[TcpServerHandler] Arrêt du serveur...");
            _isRunning = false;
            _cancellationTokenSource?.Cancel();

            lock (_lock)
            {
                _currentStream?.Close();
                _currentClient?.Close();
                _tcpListener?.Stop();
            }

            _tcpListener = null;
            Console.WriteLine("[TcpServerHandler] Serveur arrêté");
        }

        /// <summary>
        /// Libère les ressources
        /// </summary>
        public void Dispose()
        {
            Stop();
            _cancellationTokenSource?.Dispose();
            _currentStream?.Dispose();
            _currentClient?.Dispose();
        }
    }
}
