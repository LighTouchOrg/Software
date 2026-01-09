using System;
using System.Runtime.InteropServices;
using System.Diagnostics;

namespace LighTouch.Services
{
    /// <summary>
    /// Contrôleur de souris et clavier cross-platform
    /// Utilise P/Invoke pour Windows et xdotool pour Linux
    /// </summary>
    public class MouseKeyboardController
    {
        private readonly bool _isWindows;
        private readonly bool _isLinux;

        public MouseKeyboardController()
        {
            _isWindows = RuntimeInformation.IsOSPlatform(OSPlatform.Windows);
            _isLinux = RuntimeInformation.IsOSPlatform(OSPlatform.Linux);
            
            if (_isLinux)
            {
                // Vérifier si xdotool est installé
                try
                {
                    var process = Process.Start(new ProcessStartInfo
                    {
                        FileName = "which",
                        Arguments = "xdotool",
                        RedirectStandardOutput = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    });
                    process?.WaitForExit();
                    
                    if (process?.ExitCode != 0)
                    {
                        Console.WriteLine("[MouseKeyboard] WARNING: xdotool n'est pas installé. Installez-le avec: sudo apt install xdotool");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[MouseKeyboard] Erreur lors de la vérification de xdotool: {ex.Message}");
                }
            }
            
            Console.WriteLine($"[MouseKeyboard] Initialisé pour {(_isWindows ? "Windows" : _isLinux ? "Linux" : "Unknown")}");
        }

        #region Windows P/Invoke

        [StructLayout(LayoutKind.Sequential)]
        private struct INPUT
        {
            public uint type;
            public MOUSEINPUT mi;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct MOUSEINPUT
        {
            public int dx;
            public int dy;
            public uint mouseData;
            public uint dwFlags;
            public uint time;
            public IntPtr dwExtraInfo;
        }

        [DllImport("user32.dll", SetLastError = true)]
        private static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);

        [DllImport("user32.dll")]
        private static extern bool SetCursorPos(int X, int Y);

        private const uint INPUT_MOUSE = 0;
        private const uint MOUSEEVENTF_MOVE = 0x0001;
        private const uint MOUSEEVENTF_ABSOLUTE = 0x8000;
        private const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
        private const uint MOUSEEVENTF_LEFTUP = 0x0004;
        private const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
        private const uint MOUSEEVENTF_RIGHTUP = 0x0010;
        private const uint MOUSEEVENTF_MIDDLEDOWN = 0x0020;
        private const uint MOUSEEVENTF_MIDDLEUP = 0x0040;

        #endregion

        public void MoveMouse(int x, int y)
        {
            try
            {
                if (_isWindows)
                {
                    MoveMouseWindows(x, y);
                }
                else if (_isLinux)
                {
                    MoveMouseLinux(x, y);
                }
                else
                {
                    Console.WriteLine("[MouseKeyboard] Plateforme non supportée pour MoveMouse");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MouseKeyboard] Erreur MoveMouse: {ex.Message}");
            }
        }

        private void MoveMouseWindows(int x, int y)
        {
            // Windows: utiliser SendInput avec coordonnées absolues
            int screenWidth = 1920; // TODO: obtenir la vraie résolution
            int screenHeight = 1080;

            int absoluteX = (int)((x * 65535.0) / screenWidth);
            int absoluteY = (int)((y * 65535.0) / screenHeight);

            INPUT input = new INPUT
            {
                type = INPUT_MOUSE,
                mi = new MOUSEINPUT
                {
                    dx = absoluteX,
                    dy = absoluteY,
                    mouseData = 0,
                    dwFlags = MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE,
                    time = 0,
                    dwExtraInfo = IntPtr.Zero
                }
            };

            SendInput(1, new INPUT[] { input }, Marshal.SizeOf(typeof(INPUT)));
        }

        private void MoveMouseLinux(int x, int y)
        {
            // Linux: utiliser xdotool
            ExecuteCommand("xdotool", $"mousemove {x} {y}");
        }

        public void PressMouse(int x = -1, int y = -1, string button = "LEFT")
        {
            try
            {
                // Si des coordonnées sont spécifiées, déplacer d'abord
                if (x >= 0 && y >= 0)
                {
                    MoveMouse(x, y);
                }

                if (_isWindows)
                {
                    PressMouseWindows(button);
                }
                else if (_isLinux)
                {
                    PressMouseLinux(button);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MouseKeyboard] Erreur PressMouse: {ex.Message}");
            }
        }

        private void PressMouseWindows(string button)
        {
            uint downFlag = button.ToUpper() switch
            {
                "LEFT" => MOUSEEVENTF_LEFTDOWN,
                "RIGHT" => MOUSEEVENTF_RIGHTDOWN,
                "MIDDLE" => MOUSEEVENTF_MIDDLEDOWN,
                _ => MOUSEEVENTF_LEFTDOWN
            };

            uint upFlag = button.ToUpper() switch
            {
                "LEFT" => MOUSEEVENTF_LEFTUP,
                "RIGHT" => MOUSEEVENTF_RIGHTUP,
                "MIDDLE" => MOUSEEVENTF_MIDDLEUP,
                _ => MOUSEEVENTF_LEFTUP
            };

            INPUT[] inputs = new INPUT[2];
            
            // Mouse down
            inputs[0] = new INPUT
            {
                type = INPUT_MOUSE,
                mi = new MOUSEINPUT { dwFlags = downFlag }
            };

            // Mouse up
            inputs[1] = new INPUT
            {
                type = INPUT_MOUSE,
                mi = new MOUSEINPUT { dwFlags = upFlag }
            };

            SendInput(2, inputs, Marshal.SizeOf(typeof(INPUT)));
        }

        private void PressMouseLinux(string button)
        {
            int buttonNum = button.ToUpper() switch
            {
                "LEFT" => 1,
                "MIDDLE" => 2,
                "RIGHT" => 3,
                _ => 1
            };

            ExecuteCommand("xdotool", $"click {buttonNum}");
        }

        public void PressKey(string key)
        {
            try
            {
                if (_isWindows)
                {
                    PressKeyWindows(key);
                }
                else if (_isLinux)
                {
                    PressKeyLinux(key);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MouseKeyboard] Erreur PressKey: {ex.Message}");
            }
        }

        private void PressKeyWindows(string key)
        {
            // TODO: Implémenter avec keybd_event ou SendInput
            Console.WriteLine($"[MouseKeyboard] PressKey Windows non implémenté: {key}");
        }

        private void PressKeyLinux(string key)
        {
            // Convertir les noms de touches si nécessaire
            string xdotoolKey = ConvertKeyName(key);
            ExecuteCommand("xdotool", $"key {xdotoolKey}");
        }

        public void TypeText(string text)
        {
            try
            {
                if (_isWindows)
                {
                    TypeTextWindows(text);
                }
                else if (_isLinux)
                {
                    TypeTextLinux(text);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MouseKeyboard] Erreur TypeText: {ex.Message}");
            }
        }

        private void TypeTextWindows(string text)
        {
            // TODO: Implémenter avec SendInput
            Console.WriteLine($"[MouseKeyboard] TypeText Windows non implémenté: {text}");
        }

        private void TypeTextLinux(string text)
        {
            ExecuteCommand("xdotool", $"type \"{text}\"");
        }

        public void Scroll(int direction)
        {
            try
            {
                if (_isWindows)
                {
                    ScrollWindows(direction);
                }
                else if (_isLinux)
                {
                    ScrollLinux(direction);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MouseKeyboard] Erreur Scroll: {ex.Message}");
            }
        }

        private void ScrollWindows(int direction)
        {
            // TODO: Implémenter avec MOUSEEVENTF_WHEEL
            Console.WriteLine($"[MouseKeyboard] Scroll Windows non implémenté: {direction}");
        }

        private void ScrollLinux(int direction)
        {
            // xdotool: 4 = scroll up, 5 = scroll down
            int button = direction > 0 ? 4 : 5;
            int amount = Math.Abs(direction);
            
            for (int i = 0; i < amount; i++)
            {
                ExecuteCommand("xdotool", $"click {button}");
            }
        }

        private string ConvertKeyName(string key)
        {
            // Convertir les noms de touches Windows vers xdotool
            return key.ToLower() switch
            {
                "return" => "Return",
                "enter" => "Return",
                "escape" => "Escape",
                "esc" => "Escape",
                "tab" => "Tab",
                "space" => "space",
                "backspace" => "BackSpace",
                "delete" => "Delete",
                "up" => "Up",
                "down" => "Down",
                "left" => "Left",
                "right" => "Right",
                _ => key
            };
        }

        private void ExecuteCommand(string command, string arguments)
        {
            try
            {
                var process = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = command,
                        Arguments = arguments,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    }
                };

                process.Start();
                process.WaitForExit(1000); // Timeout de 1 seconde
                
                if (process.ExitCode != 0)
                {
                    string error = process.StandardError.ReadToEnd();
                    Console.WriteLine($"[MouseKeyboard] Erreur commande '{command} {arguments}': {error}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MouseKeyboard] Erreur exécution '{command} {arguments}': {ex.Message}");
            }
        }
    }
}
