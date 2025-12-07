using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using QRCoder;

namespace LighTouch.Services
{
    public class WiFiManager
    {
        private string _cachedProfiles = null;
        private DateTime _cacheTime = DateTime.MinValue;
        private readonly TimeSpan _cacheExpiry = TimeSpan.FromMinutes(5);

        public WiFiManager()
        {
            // Pre-load profiles in background
            System.Threading.Tasks.Task.Run(() => PreloadProfiles());
        }

        private void PreloadProfiles()
        {
            try
            {
                _cachedProfiles = GetSavedWiFiProfiles();
                _cacheTime = DateTime.Now;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error preloading profiles: {ex.Message}");
            }
        }

        public string GetCurrentWiFiInfo()
        {
            try
            {
                Console.WriteLine("=== GetCurrentWiFiInfo START ===");

                // Try to get current WiFi connection first
                string output = ExecuteCommand("netsh wlan show interfaces");
                Console.WriteLine($"NETSH OUTPUT LENGTH: {output?.Length ?? 0}");

                string ssid = null;
                string signal = null;

                if (!string.IsNullOrWhiteSpace(output))
                {
                    ssid = ExtractValue(output, new[] { "SSID", "SSID" });
                    signal = ExtractValue(output, new[] { "Signal", "Signal" });
                    Console.WriteLine($"Current SSID: {ssid}, SIGNAL: {signal}");
                }

                // If not connected to WiFi, get saved profiles
                if (string.IsNullOrEmpty(ssid))
                {
                    Console.WriteLine("Not connected to WiFi, getting saved profiles...");

                    // Use cache if available and not expired
                    if (_cachedProfiles != null && (DateTime.Now - _cacheTime) < _cacheExpiry)
                    {
                        Console.WriteLine("Using cached profiles");
                        return _cachedProfiles;
                    }

                    // Otherwise fetch fresh data
                    var profilesResult = GetSavedWiFiProfiles();
                    _cachedProfiles = profilesResult;
                    _cacheTime = DateTime.Now;
                    return profilesResult;
                }

                // Get password
                string password = GetWiFiPassword(ssid);
                Console.WriteLine($"PASSWORD RETRIEVED: {!string.IsNullOrEmpty(password)}");

                // Get security type
                string profileOutput = ExecuteCommand($"netsh wlan show profile \"{ssid}\"");
                string security = ExtractValue(profileOutput, new[] { "Authentication", "Authentification" });
                Console.WriteLine($"SECURITY: {security}");

                var result = JsonSerializer.Serialize(new
                {
                    success = true,
                    ssid,
                    password,
                    security = ConvertSecurityType(security),
                    signal
                });

                Console.WriteLine($"RESULT: {result}");
                Console.WriteLine("=== GetCurrentWiFiInfo END ===");

                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"=== EXCEPTION: {ex.Message} ===");
                Console.WriteLine($"STACK: {ex.StackTrace}");
                return JsonSerializer.Serialize(new { success = false, error = ex.Message });
            }
        }

        public string GetSavedWiFiProfiles()
        {
            try
            {
                Console.WriteLine("=== GetSavedWiFiProfiles START ===");

                string output = ExecuteCommand("netsh wlan show profiles");

                if (string.IsNullOrWhiteSpace(output))
                {
                    return JsonSerializer.Serialize(new { success = false, error = "No WiFi profiles found" });
                }

                // Parse profiles using regex
                var profiles = new List<object>();

                // Try different patterns for both French and English
                var patterns = new[]
                {
                    @"Profil\s+[Tt]ous\s+les\s+utilisateurs\s*:\s*(.+)",  // French
                    @"All\s+[Uu]ser\s+[Pp]rofile\s*:\s*(.+)",            // English
                };

                var lines = output.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);

                foreach (var line in lines)
                {
                    foreach (var pattern in patterns)
                    {
                        var match = Regex.Match(line, pattern, RegexOptions.IgnoreCase);
                        if (match.Success && match.Groups.Count > 1)
                        {
                            string profileName = match.Groups[1].Value.Trim();

                            // Skip empty or header lines
                            if (!string.IsNullOrEmpty(profileName) &&
                                !profileName.Contains("-----") &&
                                !profileName.Contains("User profiles") &&
                                !profileName.Contains("Profils utilisateur"))
                            {
                                Console.WriteLine($"Found profile: {profileName}");

                                // Get profile details
                                string profileOutput = ExecuteCommand($"netsh wlan show profile \"{profileName}\"");
                                string security = ExtractValue(profileOutput, new[] { "Authentication", "Authentification" });
                                string password = GetWiFiPassword(profileName);

                                profiles.Add(new
                                {
                                    ssid = profileName,
                                    security = ConvertSecurityType(security),
                                    password = password ?? ""
                                });

                                break; // Found a match, no need to try other patterns
                            }
                        }
                    }
                }

                if (profiles.Count == 0)
                {
                    return JsonSerializer.Serialize(new { success = false, error = "No WiFi profiles found" });
                }

                var result = JsonSerializer.Serialize(new
                {
                    success = true,
                    profiles = profiles
                });

                Console.WriteLine($"Found {profiles.Count} profiles");

                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"EXCEPTION: {ex.Message}");
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
                // Register code pages encoding provider for .NET 9
                Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

                ProcessStartInfo processInfo = new ProcessStartInfo("cmd.exe", "/c chcp 65001>nul && " + command)
                {
                    CreateNoWindow = true,
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    StandardOutputEncoding = Encoding.UTF8
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
