using System;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Xunit;
using LighTouch.Services;

namespace LighTouch.Tests.Services
{
    /// <summary>
    /// Unit tests for UdpDiscoveryService.
    /// Tests cover: construction, property defaults, start/stop lifecycle,
    /// server discovery via valid UDP broadcast, invalid JSON handling,
    /// wrong message type filtering, and concurrent operations.
    /// </summary>
    public class UdpDiscoveryServiceTests : IDisposable
    {
        private UdpDiscoveryService _service;
        private readonly int _port;

        public UdpDiscoveryServiceTests()
        {
            _port = GetFreeUdpPort();
            _service = new UdpDiscoveryService(_port);
        }

        public void Dispose()
        {
            _service?.Dispose();
        }

        // ── Construction ─────────────────────────────────────────────────

        [Fact]
        public void Constructor_WithDefaultPort_ShouldNotThrow()
        {
            var svc = new UdpDiscoveryService();
            svc.Should().NotBeNull();
            svc.Dispose();
        }

        [Fact]
        public void Constructor_WithCustomPort_ShouldNotThrow()
        {
            var svc = new UdpDiscoveryService(9999);
            svc.Should().NotBeNull();
            svc.Dispose();
        }

        // ── Lifecycle ────────────────────────────────────────────────────

        [Fact]
        public async Task StartAsync_ShouldReturnCompletedTask()
        {
            var task = _service.StartAsync();
            task.Should().Be(Task.CompletedTask);
            _service.Stop();
        }

        [Fact]
        public async Task StartAsync_CalledTwice_ShouldNotThrow()
        {
            await _service.StartAsync();
            var act = () => _service.StartAsync();
            await act.Should().NotThrowAsync();
            _service.Stop();
        }

        [Fact]
        public void Stop_WhenNotStarted_ShouldNotThrow()
        {
            var act = () => _service.Stop();
            act.Should().NotThrow();
        }

        [Fact]
        public async Task Stop_WhenStarted_ShouldNotThrow()
        {
            await _service.StartAsync();
            var act = () => _service.Stop();
            act.Should().NotThrow();
        }

        [Fact]
        public void Dispose_ShouldNotThrowWhenCalledMultipleTimes()
        {
            _service.Dispose();
            var act = () => _service.Dispose();
            act.Should().NotThrow();
        }

        // ── Events ──────────────────────────────────────────────────────

        [Fact]
        public void ServerDiscovered_EventCanBeSubscribed()
        {
            bool raised = false;
            _service.ServerDiscovered += (s, e) => raised = true;
            raised.Should().BeFalse();
        }

        // ── Discovery: Valid Broadcast ───────────────────────────────────

        [Fact]
        public async Task ShouldDiscoverServer_WhenValidBroadcastReceived()
        {
            ServerDiscoveredEventArgs? discoveredArgs = null;
            _service.ServerDiscovered += (s, e) => discoveredArgs = e;

            await _service.StartAsync();
            await Task.Delay(300); // Let listener start

            // Send a valid discovery broadcast
            using var sender = new UdpClient();
            var message = JsonSerializer.Serialize(new
            {
                type = "server_discovery",
                ip = "192.168.1.50",
                port = 8888,
                name = "TestRaspberryPi"
            });
            var data = Encoding.UTF8.GetBytes(message);
            await sender.SendAsync(data, data.Length, new IPEndPoint(IPAddress.Loopback, _port));

            await WaitUntil(() => discoveredArgs != null, 3000);

            discoveredArgs.Should().NotBeNull();
            discoveredArgs!.ServerIp.Should().Be("192.168.1.50");
            discoveredArgs.ServerPort.Should().Be(8888);
            discoveredArgs.ServerName.Should().Be("TestRaspberryPi");

            _service.Stop();
        }

        [Fact]
        public async Task ShouldUseSenderIp_WhenMessageIpIsEmpty()
        {
            ServerDiscoveredEventArgs? discoveredArgs = null;
            _service.ServerDiscovered += (s, e) => discoveredArgs = e;

            await _service.StartAsync();
            await Task.Delay(300);

            using var sender = new UdpClient();
            var message = JsonSerializer.Serialize(new
            {
                type = "server_discovery",
                ip = "",
                port = 8888,
                name = "TestNode"
            });
            var data = Encoding.UTF8.GetBytes(message);
            await sender.SendAsync(data, data.Length, new IPEndPoint(IPAddress.Loopback, _port));

            await WaitUntil(() => discoveredArgs != null, 3000);

            discoveredArgs.Should().NotBeNull();
            discoveredArgs!.ServerIp.Should().Be("127.0.0.1");

            _service.Stop();
        }

        // ── Discovery: Invalid Messages ──────────────────────────────────

        [Fact]
        public async Task ShouldIgnore_WhenInvalidJsonReceived()
        {
            ServerDiscoveredEventArgs? discoveredArgs = null;
            _service.ServerDiscovered += (s, e) => discoveredArgs = e;

            await _service.StartAsync();
            await Task.Delay(300);

            using var sender = new UdpClient();
            var data = Encoding.UTF8.GetBytes("NOT JSON AT ALL");
            await sender.SendAsync(data, data.Length, new IPEndPoint(IPAddress.Loopback, _port));

            await Task.Delay(500);
            discoveredArgs.Should().BeNull("invalid JSON should be ignored");

            _service.Stop();
        }

        [Fact]
        public async Task ShouldIgnore_WhenWrongMessageType()
        {
            ServerDiscoveredEventArgs? discoveredArgs = null;
            _service.ServerDiscovered += (s, e) => discoveredArgs = e;

            await _service.StartAsync();
            await Task.Delay(300);

            using var sender = new UdpClient();
            var message = JsonSerializer.Serialize(new
            {
                type = "client_heartbeat",
                ip = "10.0.0.1",
                port = 8888,
                name = "Wrong"
            });
            var data = Encoding.UTF8.GetBytes(message);
            await sender.SendAsync(data, data.Length, new IPEndPoint(IPAddress.Loopback, _port));

            await Task.Delay(500);
            discoveredArgs.Should().BeNull("wrong message type should be ignored");

            _service.Stop();
        }

        [Fact]
        public async Task ShouldHandleMultipleBroadcasts()
        {
            int discoveryCount = 0;
            _service.ServerDiscovered += (s, e) => Interlocked.Increment(ref discoveryCount);

            await _service.StartAsync();
            await Task.Delay(300);

            for (int i = 0; i < 5; i++)
            {
                using var sender = new UdpClient();
                var message = JsonSerializer.Serialize(new
                {
                    type = "server_discovery",
                    ip = $"192.168.1.{i + 1}",
                    port = 8888,
                    name = $"Server{i}"
                });
                var data = Encoding.UTF8.GetBytes(message);
                await sender.SendAsync(data, data.Length, new IPEndPoint(IPAddress.Loopback, _port));
                await Task.Delay(100);
            }

            await WaitUntil(() => discoveryCount >= 5, 5000);
            discoveryCount.Should().BeGreaterOrEqualTo(5);

            _service.Stop();
        }

        // ── Helpers ──────────────────────────────────────────────────────

        private static int GetFreeUdpPort()
        {
            using var udp = new UdpClient(new IPEndPoint(IPAddress.Loopback, 0));
            return ((IPEndPoint)udp.Client.LocalEndPoint!).Port;
        }

        private static async Task WaitUntil(Func<bool> condition, int timeoutMs)
        {
            var sw = System.Diagnostics.Stopwatch.StartNew();
            while (!condition() && sw.ElapsedMilliseconds < timeoutMs)
            {
                await Task.Delay(50);
            }
        }
    }
}
