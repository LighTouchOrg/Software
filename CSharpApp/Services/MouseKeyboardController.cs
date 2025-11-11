using System;
using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace LighTouch.Services
{
    public class MouseKeyboardController
    {
        // Structure pour SendInput
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

        // Windows API imports for mouse control
        [DllImport("user32.dll", SetLastError = true)]
        private static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);

        [DllImport("user32.dll")]
        private static extern bool SetCursorPos(int X, int Y);

        [DllImport("user32.dll")]
        private static extern bool GetCursorPos(out POINT lpPoint);

        [StructLayout(LayoutKind.Sequential)]
        private struct POINT
        {
            public int X;
            public int Y;
        }

        // Mouse event flags pour SendInput
        private const uint INPUT_MOUSE = 0;
        private const uint MOUSEEVENTF_MOVE = 0x0001;
        private const uint MOUSEEVENTF_ABSOLUTE = 0x8000;
        private const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
        private const uint MOUSEEVENTF_LEFTUP = 0x0004;
        private const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
        private const uint MOUSEEVENTF_RIGHTUP = 0x0010;
        private const uint MOUSEEVENTF_MIDDLEDOWN = 0x0020;
        private const uint MOUSEEVENTF_MIDDLEUP = 0x0040;

        public void MoveMouse(int x, int y)
        {
            try
            {
                Console.WriteLine($"[MouseKeyboardController] MoveMouse appelé: x={x}, y={y}");

                // Obtenir la résolution de l'écran
                int screenWidth = System.Windows.Forms.Screen.PrimaryScreen.Bounds.Width;
                int screenHeight = System.Windows.Forms.Screen.PrimaryScreen.Bounds.Height;

                Console.WriteLine($"[MouseKeyboardController] Résolution écran: {screenWidth}x{screenHeight}");

                // Convertir les coordonnées en coordonnées absolues (0-65535)
                // SendInput utilise un système de coordonnées normalisé
                int absoluteX = (int)((x * 65535.0) / screenWidth);
                int absoluteY = (int)((y * 65535.0) / screenHeight);

                Console.WriteLine($"[MouseKeyboardController] Coordonnées absolues: {absoluteX}, {absoluteY}");

                // Créer l'input pour SendInput
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

                // Envoyer l'input
                uint result = SendInput(1, new INPUT[] { input }, Marshal.SizeOf(typeof(INPUT)));

                if (result == 0)
                {
                    int error = Marshal.GetLastWin32Error();
                    Console.WriteLine($"[MouseKeyboardController] ✗ SendInput ÉCHEC! Error code: {error}");
                }
                else
                {
                    Console.WriteLine($"[MouseKeyboardController] ✓ SendInput réussi! {result} événement(s) envoyé(s)");

                    // Vérifier la position réelle de la souris
                    POINT currentPos;
                    if (GetCursorPos(out currentPos))
                    {
                        Console.WriteLine($"[MouseKeyboardController] Position réelle souris: ({currentPos.X}, {currentPos.Y})");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MouseKeyboardController] ✗ Exception: {ex.Message}");
                Console.WriteLine($"[MouseKeyboardController] Stack trace: {ex.StackTrace}");
            }
        }

        public void PressMouse(int x = -1, int y = -1, string button = "LEFT")
        {
            try
            {
                Console.WriteLine($"[MouseKeyboardController] PressMouse: x={x}, y={y}, button={button}");

                // Move mouse if coordinates provided
                if (x >= 0 && y >= 0)
                {
                    MoveMouse(x, y);
                }

                uint flag = button.ToUpper() switch
                {
                    "LEFT" => MOUSEEVENTF_LEFTDOWN,
                    "RIGHT" => MOUSEEVENTF_RIGHTDOWN,
                    "MIDDLE" => MOUSEEVENTF_MIDDLEDOWN,
                    _ => MOUSEEVENTF_LEFTDOWN
                };

                // Créer l'input pour le clic
                INPUT input = new INPUT
                {
                    type = INPUT_MOUSE,
                    mi = new MOUSEINPUT
                    {
                        dx = 0,
                        dy = 0,
                        mouseData = 0,
                        dwFlags = flag,
                        time = 0,
                        dwExtraInfo = IntPtr.Zero
                    }
                };

                uint result = SendInput(1, new INPUT[] { input }, Marshal.SizeOf(typeof(INPUT)));
                Console.WriteLine($"[MouseKeyboardController] PressMouse result: {result}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MouseKeyboardController] Error pressing mouse: {ex.Message}");
            }
        }

        public void ReleaseMouse(int x = -1, int y = -1, string button = "LEFT")
        {
            try
            {
                Console.WriteLine($"[MouseKeyboardController] ReleaseMouse: x={x}, y={y}, button={button}");

                // Move mouse if coordinates provided
                if (x >= 0 && y >= 0)
                {
                    MoveMouse(x, y);
                }

                uint flag = button.ToUpper() switch
                {
                    "LEFT" => MOUSEEVENTF_LEFTUP,
                    "RIGHT" => MOUSEEVENTF_RIGHTUP,
                    "MIDDLE" => MOUSEEVENTF_MIDDLEUP,
                    _ => MOUSEEVENTF_LEFTUP
                };

                // Créer l'input pour relâcher le clic
                INPUT input = new INPUT
                {
                    type = INPUT_MOUSE,
                    mi = new MOUSEINPUT
                    {
                        dx = 0,
                        dy = 0,
                        mouseData = 0,
                        dwFlags = flag,
                        time = 0,
                        dwExtraInfo = IntPtr.Zero
                    }
                };

                uint result = SendInput(1, new INPUT[] { input }, Marshal.SizeOf(typeof(INPUT)));
                Console.WriteLine($"[MouseKeyboardController] ReleaseMouse result: {result}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MouseKeyboardController] Error releasing mouse: {ex.Message}");
            }
        }

        public void PressKey(string key)
        {
            try
            {
                // Handle special Arrow keys from JS (ArrowLeft, ArrowRight, etc.)
                if (key.StartsWith("Arrow"))
                {
                    key = key.Substring(5); // Remove "Arrow" prefix
                }

                // Convert string key to Keys enum
                Keys keyCode = ConvertToKeys(key);
                if (keyCode != Keys.None)
                {
                    SendKeys.SendWait($"{{{keyCode}}}");
                }
                else
                {
                    // Try to send the key as-is for single characters
                    if (key.Length == 1)
                    {
                        SendKeys.SendWait(key);
                    }
                    else
                    {
                        Console.WriteLine($"Key '{key}' not recognized");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error pressing key: {ex.Message}");
            }
        }

        private Keys ConvertToKeys(string key)
        {
            string lowerKey = key.ToLower();

            // Handle arrow keys
            if (lowerKey == "left") return Keys.Left;
            if (lowerKey == "right") return Keys.Right;
            if (lowerKey == "up") return Keys.Up;
            if (lowerKey == "down") return Keys.Down;

            // Handle common keys
            return lowerKey switch
            {
                "space" => Keys.Space,
                "enter" => Keys.Enter,
                "escape" => Keys.Escape,
                "esc" => Keys.Escape,
                "tab" => Keys.Tab,
                "backspace" => Keys.Back,
                "delete" => Keys.Delete,
                "del" => Keys.Delete,
                "home" => Keys.Home,
                "end" => Keys.End,
                "pageup" => Keys.PageUp,
                "pagedown" => Keys.PageDown,
                "insert" => Keys.Insert,

                // Function keys
                "f1" => Keys.F1,
                "f2" => Keys.F2,
                "f3" => Keys.F3,
                "f4" => Keys.F4,
                "f5" => Keys.F5,
                "f6" => Keys.F6,
                "f7" => Keys.F7,
                "f8" => Keys.F8,
                "f9" => Keys.F9,
                "f10" => Keys.F10,
                "f11" => Keys.F11,
                "f12" => Keys.F12,

                _ => Keys.None
            };
        }
    }
}
