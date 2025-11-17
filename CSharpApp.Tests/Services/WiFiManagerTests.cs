using System;
using FluentAssertions;
using Xunit;
using LighTouch.Services;

namespace LighTouch.Tests.Services
{
    /// <summary>
    /// Unit tests for WiFiManager.
    /// Tests cover: construction, QR code generation (valid and edge cases),
    /// security type conversion, and GetCurrentWiFiInfo / GetSavedWiFiProfiles output format.
    /// Note: WiFi command execution depends on the OS; those tests are integration-level.
    /// </summary>
    public class WiFiManagerTests
    {
        private readonly WiFiManager _manager;

        public WiFiManagerTests()
        {
            _manager = new WiFiManager();
        }

        // ── Construction ─────────────────────────────────────────────────

        [Fact]
        public void Constructor_ShouldNotThrow()
        {
            var act = () => new WiFiManager();
            act.Should().NotThrow();
        }

        // ── QR Code Generation ───────────────────────────────────────────

        [Fact]
        public void GenerateQRCode_ValidParams_ShouldReturnBase64DataUrl()
        {
            var result = _manager.GenerateQRCode("TestNetwork", "password123", "WPA");
            result.Should().NotBeNullOrEmpty();
            result.Should().StartWith("data:image/png;base64,");
        }

        [Fact]
        public void GenerateQRCode_EmptyPassword_ShouldStillWork()
        {
            var result = _manager.GenerateQRCode("OpenNetwork", "", "nopass");
            result.Should().NotBeNullOrEmpty();
            result.Should().StartWith("data:image/png;base64,");
        }

        [Fact]
        public void GenerateQRCode_EmptySSID_ShouldStillWork()
        {
            var result = _manager.GenerateQRCode("", "password", "WPA");
            result.Should().NotBeNullOrEmpty();
            result.Should().StartWith("data:image/png;base64,");
        }

        [Fact]
        public void GenerateQRCode_SpecialCharactersInSSID_ShouldWork()
        {
            var result = _manager.GenerateQRCode("My \"Net;work\"", "p@ss:w0rd!", "WPA");
            result.Should().NotBeNullOrEmpty();
            result.Should().StartWith("data:image/png;base64,");
        }

        [Fact]
        public void GenerateQRCode_LongSSID_ShouldWork()
        {
            var longSsid = new string('A', 256);
            var result = _manager.GenerateQRCode(longSsid, "password", "WPA");
            result.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public void GenerateQRCode_DifferentSecurityTypes_ShouldAllWork()
        {
            var types = new[] { "WPA", "WEP", "nopass" };
            foreach (var sec in types)
            {
                var result = _manager.GenerateQRCode("TestNet", "pass", sec);
                result.Should().NotBeNullOrEmpty($"QR code should be generated for security type '{sec}'");
            }
        }

        [Fact]
        public void GenerateQRCode_UnicodeSSID_ShouldWork()
        {
            var result = _manager.GenerateQRCode("Réseau_WiFi_日本語", "motdepasse", "WPA");
            result.Should().NotBeNullOrEmpty();
            result.Should().StartWith("data:image/png;base64,");
        }

        // ── WiFi Info (Integration - Depends on OS) ──────────────────────

        [Fact]
        public void GetCurrentWiFiInfo_ShouldReturnJsonString()
        {
            var result = _manager.GetCurrentWiFiInfo();
            result.Should().NotBeNullOrEmpty();

            // Should be valid JSON
            var act = () => System.Text.Json.JsonDocument.Parse(result);
            act.Should().NotThrow("result should be valid JSON");
        }

        [Fact]
        public void GetCurrentWiFiInfo_ShouldContainSuccessField()
        {
            var result = _manager.GetCurrentWiFiInfo();
            var doc = System.Text.Json.JsonDocument.Parse(result);
            doc.RootElement.TryGetProperty("success", out _).Should().BeTrue();
        }

        [Fact]
        public void GetSavedWiFiProfiles_ShouldReturnJsonString()
        {
            var result = _manager.GetSavedWiFiProfiles();
            result.Should().NotBeNullOrEmpty();

            var act = () => System.Text.Json.JsonDocument.Parse(result);
            act.Should().NotThrow("result should be valid JSON");
        }

        [Fact]
        public void GetSavedWiFiProfiles_ShouldContainSuccessField()
        {
            var result = _manager.GetSavedWiFiProfiles();
            var doc = System.Text.Json.JsonDocument.Parse(result);
            doc.RootElement.TryGetProperty("success", out _).Should().BeTrue();
        }
    }
}
