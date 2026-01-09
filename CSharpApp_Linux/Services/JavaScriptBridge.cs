using System;
using System.Text.Json;

namespace LighTouch.Services
{
    /// <summary>
    /// Bridge entre JavaScript et C# pour Avalonia
    /// Simplifié car Avalonia n'a pas de WebView intégré par défaut
    /// </summary>
    public class JavaScriptBridge
    {
        private readonly TcpClientHandler? _tcpClient;
        private readonly MouseKeyboardController? _mouseKeyboard;

        public JavaScriptBridge(
            TcpClientHandler? tcpClient = null,
            MouseKeyboardController? mouseKeyboard = null)
        {
            _tcpClient = tcpClient;
            _mouseKeyboard = mouseKeyboard;
            Console.WriteLine("[JavaScriptBridge] Bridge initialisé");
        }

        public void HandleMessage(string message)
        {
            try
            {
                Console.WriteLine($"[JavaScriptBridge] Message reçu: {message}");
                
                // Parser le message JSON
                var json = JsonDocument.Parse(message);
                var root = json.RootElement;

                if (!root.TryGetProperty("type", out var typeElement))
                {
                    Console.WriteLine("[JavaScriptBridge] Message sans 'type'");
                    return;
                }

                string type = typeElement.GetString() ?? "";

                switch (type)
                {
                    case "mouse_move":
                        HandleMouseMove(root);
                        break;
                    case "mouse_click":
                        HandleMouseClick(root);
                        break;
                    case "key_press":
                        HandleKeyPress(root);
                        break;
                    case "type_text":
                        HandleTypeText(root);
                        break;
                    case "scroll":
                        HandleScroll(root);
                        break;
                    default:
                        Console.WriteLine($"[JavaScriptBridge] Type inconnu: {type}");
                        break;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[JavaScriptBridge] Erreur: {ex.Message}");
            }
        }

        private void HandleMouseMove(JsonElement data)
        {
            if (data.TryGetProperty("x", out var xElement) &&
                data.TryGetProperty("y", out var yElement))
            {
                int x = xElement.GetInt32();
                int y = yElement.GetInt32();
                _mouseKeyboard?.MoveMouse(x, y);
            }
        }

        private void HandleMouseClick(JsonElement data)
        {
            int x = -1, y = -1;
            string button = "LEFT";

            if (data.TryGetProperty("x", out var xElement))
                x = xElement.GetInt32();
            if (data.TryGetProperty("y", out var yElement))
                y = yElement.GetInt32();
            if (data.TryGetProperty("button", out var buttonElement))
                button = buttonElement.GetString() ?? "LEFT";

            _mouseKeyboard?.PressMouse(x, y, button);
        }

        private void HandleKeyPress(JsonElement data)
        {
            if (data.TryGetProperty("key", out var keyElement))
            {
                string key = keyElement.GetString() ?? "";
                _mouseKeyboard?.PressKey(key);
            }
        }

        private void HandleTypeText(JsonElement data)
        {
            if (data.TryGetProperty("text", out var textElement))
            {
                string text = textElement.GetString() ?? "";
                _mouseKeyboard?.TypeText(text);
            }
        }

        private void HandleScroll(JsonElement data)
        {
            if (data.TryGetProperty("direction", out var dirElement))
            {
                int direction = dirElement.GetInt32();
                _mouseKeyboard?.Scroll(direction);
            }
        }

        public void SendToClient(string message)
        {
            _tcpClient?.SendMessage(message);
        }
    }
}
