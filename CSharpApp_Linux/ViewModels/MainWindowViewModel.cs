using System;
using System.Threading.Tasks;
using System.Windows.Input;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using LighTouch.Services;

namespace LighTouch.ViewModels;

public partial class MainWindowViewModel : ViewModelBase
{
    [ObservableProperty]
    private string _status = "Service arrêté";
    
    [ObservableProperty]
    private string _serverInfo = "En attente de connexion...";
    
    [ObservableProperty]
    private string _logs = "";

    private TcpClientHandler? _tcpClient;
    private UdpDiscoveryService? _udpDiscovery;
    private MouseKeyboardController? _mouseKeyboard;
    private JavaScriptBridge? _jsBridge;

    public MainWindowViewModel()
    {
        AddLog("Application démarrée");
    }

    [RelayCommand]
    private async Task StartService()
    {
        try
        {
            AddLog("Démarrage du service...");
            Status = "Démarrage...";

            // Initialiser le contrôleur souris/clavier
            _mouseKeyboard = new MouseKeyboardController();
            AddLog("Contrôleur souris/clavier initialisé");

            // Initialiser le client TCP
            _tcpClient = new TcpClientHandler();
            _tcpClient.ServerConnected += OnServerConnected;
            _tcpClient.ServerDisconnected += OnServerDisconnected;
            _tcpClient.MessageReceived += OnMessageReceived;

            // Initialiser le bridge JavaScript
            _jsBridge = new JavaScriptBridge(_tcpClient, _mouseKeyboard);

            // Initialiser la découverte UDP
            _udpDiscovery = new UdpDiscoveryService();
            _udpDiscovery.ServerDiscovered += OnServerDiscovered;

            // Démarrer la découverte UDP
            await _udpDiscovery.StartAsync();
            AddLog("Service de découverte UDP démarré");

            Status = "Service démarré - Recherche du serveur...";
        }
        catch (Exception ex)
        {
            AddLog($"Erreur lors du démarrage: {ex.Message}");
            Status = "Erreur";
        }
    }

    [RelayCommand]
    private void StopService()
    {
        try
        {
            AddLog("Arrêt du service...");
            
            _udpDiscovery?.Dispose();
            _tcpClient?.Dispose();
            
            _udpDiscovery = null;
            _tcpClient = null;
            _jsBridge = null;
            _mouseKeyboard = null;

            Status = "Service arrêté";
            ServerInfo = "En attente de connexion...";
            AddLog("Service arrêté");
        }
        catch (Exception ex)
        {
            AddLog($"Erreur lors de l'arrêt: {ex.Message}");
        }
    }

    [RelayCommand]
    private void Calibrate()
    {
        AddLog("Calibration non implémentée dans cette version");
    }

    [RelayCommand]
    private void Onboarding()
    {
        AddLog("Onboarding non implémenté dans cette version");
    }

    private async void OnServerDiscovered(object? sender, ServerDiscoveredEventArgs e)
    {
        AddLog($"Serveur découvert: {e.ServerIp}:{e.ServerPort}");
        ServerInfo = $"Serveur: {e.ServerIp}:{e.ServerPort}";

        if (_tcpClient != null)
        {
            _tcpClient.ServerHost = e.ServerIp;
            _tcpClient.ServerPort = e.ServerPort;
            await _tcpClient.StartAsync();
            AddLog("Connexion TCP démarrée");
        }
    }

    private void OnServerConnected(object? sender, EventArgs e)
    {
        AddLog("Connecté au serveur !");
        Status = "Connecté";
    }

    private void OnServerDisconnected(object? sender, EventArgs e)
    {
        AddLog("Déconnecté du serveur");
        Status = "Déconnecté - Tentative de reconnexion...";
    }

    private void OnMessageReceived(object? sender, string message)
    {
        AddLog($"Message reçu: {message}");
        _jsBridge?.HandleMessage(message);
    }

    private void AddLog(string message)
    {
        string timestamp = DateTime.Now.ToString("HH:mm:ss");
        Logs += $"[{timestamp}] {message}\n";
        
        // Garder seulement les 50 dernières lignes
        var lines = Logs.Split('\n');
        if (lines.Length > 50)
        {
            Logs = string.Join('\n', lines[^50..]);
        }
    }
}
