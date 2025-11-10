using System;
using System.Diagnostics;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using QRCoder;

namespace LighTouch.Services
{
    public class WiFiManager
    {
        public string GetCurrentWiFiInfo()
        {
            try
            {
                // Execute netsh command to get WiFi info
                string output = ExecuteCommand("netsh wlan show interfaces");

                if (string.IsNullOrWhiteSpace(output))
                {
                    return JsonSerializer.Serialize(new { success = false, error = "No WiFi interface found" });
                }

                // Parse the output
                string ssid = ExtractValue(output, new[] { "SSID", "SSID" });
                string signal = ExtractValue(output, new[] { "Signal", "Signal" });

                if (string.IsNullOrEmpty(ssid))
                {
                    return JsonSerializer.Serialize(new { success = false, error = "Not connected to WiFi" });
                }

                // Get password
                string password = GetWiFiPassword(ssid);

                // Get security type
                string profileOutput = ExecuteCommand($"netsh wlan show profile \"{ssid}\"");
                string security = ExtractValue(profileOutput, new[] { "Authentication", "Authentification" });

                return JsonSerializer.Serialize(new
                {
                    success = true,
                    ssid,
                    password,
                    security = ConvertSecurityType(security),
                    signal
                });
            }
            catch (Exception ex)
            {
                return JsonSerializer.Serialize(new { success = false, error = ex.Message });
            }
        }

        private string GetWiFiPassword(string ssid)
        {
            try
            {
                string output = ExecuteCommand($"netsh wlan show profile \"{ssid}\" key=clear");
                string password = ExtractValue(output, new[] { "Key Content", "Contenu de la cl\u00e9" });
                return password ?? "";
            }
            catch
            {
                return "";
            }
        }

        private string ExtractValue(string output, string[] patterns)
        {
            foreach (string pattern in patterns)
            {
                Regex regex = new Regex($@"{pattern}\s*:\s*(.+)", RegexOptions.IgnoreCase);
                Match match = regex.Match(output);
                if (match.Success)
                {
                    return match.Groups[1].Value.Trim();
                }
            }
            return null;
        }

        private string ConvertSecurityType(string security)
        {
            if (string.IsNullOrEmpty(security))
                return "WPA";

            security = security.ToUpper();
            if (security.Contains("WPA3"))
                return "WPA";
            if (security.Contains("WPA2"))
                return "WPA";
            if (security.Contains("WPA"))
                return "WPA";
            if (security.Contains("WEP"))
                return "WEP";
            return "nopass";
        }

        public string GenerateQRCode(string ssid, string password, string security)
        {
            try
            {
                // Create WiFi payload
                string payload = $"WIFI:T:{security};S:{ssid};P:{password};;";

                // Generate QR code
                using (QRCodeGenerator qrGenerator = new QRCodeGenerator())
                using (QRCodeData qrCodeData = qrGenerator.CreateQrCode(payload, QRCodeGenerator.ECCLevel.Q))
                using (PngByteQRCode qrCode = new PngByteQRCode(qrCodeData))
                {
                    byte[] qrCodeImage = qrCode.GetGraphic(20);
                    string base64 = Convert.ToBase64String(qrCodeImage);
                    return $"data:image/png;base64,{base64}";
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error generating QR code: {ex.Message}");
                return null;
            }
        }

        private string ExecuteCommand(string command)
        {
            try
            {
                ProcessStartInfo processInfo = new ProcessStartInfo("cmd.exe", "/c " + command)
                {
                    CreateNoWindow = true,
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    StandardOutputEncoding = Encoding.GetEncoding(850) // DOS encoding
                };

                using (Process process = Process.Start(processInfo))
                {
                    string output = process.StandardOutput.ReadToEnd();
                    process.WaitForExit();
                    return output;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error executing command: {ex.Message}");
                return string.Empty;
            }
        }
    }
}
