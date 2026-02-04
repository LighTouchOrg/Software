using System;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace LighTouch.Services
{
    /// <summary>
    /// Service de découverte réseau UDP pour trouver automatiquement le serveur Python
    /// Écoute les broadcasts UDP du Raspberry Pi et retourne son IP
    /// </summary>
    public class UdpDiscoveryService : IDisposable
    {
        private UdpClient _udpClient;
        private CancellationTokenSource _cancellationTokenSource;
        private bool _isRunning;
        private readonly int _listenPort;

        // Événement déclenché quand le serveur est découvert
        public event EventHandler<ServerDiscoveredEventArgs> ServerDiscovered;

        /// <summary>
        /// Constructeur
        /// </summary>
        /// <param name="listenPort">Port UDP sur lequel écouter les broadcasts (par défaut 8889)</param>
        public UdpDiscoveryService(int listenPort = 8889)
        {
            _listenPort = listenPort;
            Console.WriteLine($"[UdpDiscoveryService] Instance créée (port {_listenPort})");
        }

        /// <summary>
        /// Démarre l'écoute des broadcasts UDP
        /// </summary>
        public Task StartAsync()
        {
            if (_isRunning)
            {
                Console.WriteLine("[UdpDiscoveryService] Service déjà démarré");
                return Task.CompletedTask;
            }

            _isRunning = true;
            _cancellationTokenSource = new CancellationTokenSource();

            Console.WriteLine($"[UdpDiscoveryService] Démarrage de l'écoute UDP sur le port {_listenPort}...");

            // Démarre le thread en arrière-plan SANS bloquer
            Task.Run(() => ListenLoop(_cancellationTokenSource.Token), _cancellationTokenSource.Token);

            return Task.CompletedTask;
        }

        /// <summary>
        /// Boucle d'écoute des broadcasts UDP
        /// </summary>
        private async Task ListenLoop(CancellationToken cancellationToken)
        {
            try
            {
                // Configure UDP client to allow reuse of address and receive broadcasts
                _udpClient = new UdpClient();
                _udpClient.Client.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.ReuseAddress, true);
                _udpClient.Client.Bind(new IPEndPoint(IPAddress.Any, _listenPort));
                _udpClient.EnableBroadcast = true;

                Console.WriteLine($"[UdpDiscoveryService] ✓ Écoute active sur le port {_listenPort}");
                Console.WriteLine($"[UdpDiscoveryService] En attente de broadcasts UDP du Raspberry Pi...");

                var remoteEndPoint = new IPEndPoint(IPAddress.Any, 0);

                while (_isRunning && !cancellationToken.IsCancellationRequested)
                {
                    try
                    {
                        // Écoute les messages UDP (bloquant jusqu'à réception)
                        var result = await _udpClient.ReceiveAsync();
                        var message = Encoding.UTF8.GetString(result.Buffer);

                        Console.WriteLine($"[UdpDiscoveryService] Message reçu de {result.RemoteEndPoint.Address}: {message}");

                        // Parse le message JSON
                        ProcessDiscoveryMessage(message, result.RemoteEndPoint.Address.ToString());
                    }
                    catch (SocketException ex) when (ex.SocketErrorCode == SocketError.Interrupted)
                    {
                        // Socket fermé, sortie normale
                        break;
                    }
                    catch (ObjectDisposedException)
                    {
                        // UDP client disposé, sortie normale
                        break;
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[UdpDiscoveryService] Erreur réception: {ex.Message}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UdpDiscoveryService] Erreur fatale: {ex.Message}");
            }
            finally
            {
                Console.WriteLine("[UdpDiscoveryService] Arrêt de l'écoute UDP");
            }
        }

        /// <summary>
        /// Traite un message de découverte reçu
        /// </summary>
        private void ProcessDiscoveryMessage(string message, string senderIp)
        {
            try
            {
                // Parse le JSON
                var discoveryInfo = JsonSerializer.Deserialize<DiscoveryMessage>(message, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (discoveryInfo == null)
                {
                    Console.WriteLine("[UdpDiscoveryService] Message invalide (JSON null)");
                    return;
                }

                // Vérifie que c'est bien un message de découverte serveur
                if (discoveryInfo.Type != "server_discovery")
                {
                    Console.WriteLine($"[UdpDiscoveryService] Type de message ignoré: {discoveryInfo.Type}");
                    return;
                }

                // Utilise l'IP de l'émetteur si l'IP du message n'est pas fiable
                string serverIp = string.IsNullOrEmpty(discoveryInfo.Ip) ? senderIp : discoveryInfo.Ip;

                Console.WriteLine($"[UdpDiscoveryService] ✓ Serveur découvert: {serverIp}:{discoveryInfo.Port}");

                // Déclenche l'événement
                ServerDiscovered?.Invoke(this, new ServerDiscoveredEventArgs
                {
                    ServerIp = serverIp,
                    ServerPort = discoveryInfo.Port,
                    ServerName = discoveryInfo.Name
                });
            }
            catch (JsonException ex)
            {
                Console.WriteLine($"[UdpDiscoveryService] Erreur parsing JSON: {ex.Message}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UdpDiscoveryService] Erreur traitement message: {ex.Message}");
            }
        }

        /// <summary>
        /// Arrête le service
        /// </summary>
        public void Stop()
        {
            if (!_isRunning)
                return;

            Console.WriteLine("[UdpDiscoveryService] Arrêt du service...");
            _isRunning = false;
            _cancellationTokenSource?.Cancel();
            _udpClient?.Close();
            Console.WriteLine("[UdpDiscoveryService] Service arrêté");
        }

        /// <summary>
        /// Libère les ressources
        /// </summary>
        public void Dispose()
        {
            Stop();
            _cancellationTokenSource?.Dispose();
            _udpClient?.Dispose();
        }

        // Classes pour la désérialisation JSON
        private class DiscoveryMessage
        {
            public string Type { get; set; }
            public string Ip { get; set; }
            public int Port { get; set; }
            public string Name { get; set; }
        }
    }

    /// <summary>
    /// Événement déclenché quand un serveur est découvert
    /// </summary>
    public class ServerDiscoveredEventArgs : EventArgs
    {
        public string ServerIp { get; set; }
        public int ServerPort { get; set; }
        public string ServerName { get; set; }
    }
}
