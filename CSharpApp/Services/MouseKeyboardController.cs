using System;
using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace LighTouch.Services
{
    public class MouseKeyboardController
    {
        // Windows API imports for mouse control
        [DllImport("user32.dll")]
        private static extern void mouse_event(uint dwFlags, int dx, int dy, uint dwData, UIntPtr dwExtraInfo);

        [DllImport("user32.dll")]
        private static extern bool SetCursorPos(int X, int Y);

        // Mouse event flags
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
                SetCursorPos(x, y);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error moving mouse: {ex.Message}");
            }
        }

        public void PressMouse(int x = -1, int y = -1, string button = "LEFT")
        {
            try
            {
                // Only move if coordinates are provided
                if (x >= 0 && y >= 0)
                {
                    SetCursorPos(x, y);
                }

                uint flag = button.ToUpper() switch
                {
                    "LEFT" => MOUSEEVENTF_LEFTDOWN,
                    "RIGHT" => MOUSEEVENTF_RIGHTDOWN,
                    "MIDDLE" => MOUSEEVENTF_MIDDLEDOWN,
                    _ => MOUSEEVENTF_LEFTDOWN
                };

                mouse_event(flag, 0, 0, 0, UIntPtr.Zero);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error pressing mouse: {ex.Message}");
            }
        }

        public void ReleaseMouse(int x = -1, int y = -1, string button = "LEFT")
        {
            try
            {
                // Only move if coordinates are provided
                if (x >= 0 && y >= 0)
                {
                    SetCursorPos(x, y);
                }

                uint flag = button.ToUpper() switch
                {
                    "LEFT" => MOUSEEVENTF_LEFTUP,
                    "RIGHT" => MOUSEEVENTF_RIGHTUP,
                    "MIDDLE" => MOUSEEVENTF_MIDDLEUP,
                    _ => MOUSEEVENTF_LEFTUP
                };

                mouse_event(flag, 0, 0, 0, UIntPtr.Zero);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error releasing mouse: {ex.Message}");
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
