using System;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Xunit;
using LighTouch.Services;

namespace LighTouch.Tests.Services
{
    /// <summary>
    /// Unit tests for TcpClientHandler.
    /// Tests cover: construction, property defaults, start/stop lifecycle,
    /// message sending when disconnected, connection state, dispose, and
    /// end-to-end communication with a mock TCP server.
    /// </summary>
    public class TcpClientHandlerTests : IDisposable
    {
        private TcpClientHandler _handler;

        public TcpClientHandlerTests()
        {
            _handler = new TcpClientHandler();
        }

        public void Dispose()
        {
            _handler?.Dispose();
        }

        // ── Construction & Defaults ──────────────────────────────────────

        [Fact]
        public void Constructor_ShouldInitializeWithDefaultValues()
        {
            _handler.ServerHost.Should().BeNull();
            _handler.ServerPort.Should().Be(8888);
            _handler.ReconnectDelayMs.Should().Be(5000);
        }

        [Fact]
        public void ServerHost_CanBeSetAndRetrieved()
        {
            _handler.ServerHost = "192.168.1.100";
            _handler.ServerHost.Should().Be("192.168.1.100");
        }

        [Fact]
        public void ServerPort_CanBeSetAndRetrieved()
        {
            _handler.ServerPort = 9999;
            _handler.ServerPort.Should().Be(9999);
        }

        [Fact]
        public void ReconnectDelayMs_CanBeSetAndRetrieved()
        {
            _handler.ReconnectDelayMs = 10000;
            _handler.ReconnectDelayMs.Should().Be(10000);
        }

        // ── Lifecycle ────────────────────────────────────────────────────

        [Fact]
        public async Task StartAsync_ShouldReturnCompletedTask()
        {
            var task = _handler.StartAsync();
            task.Should().Be(Task.CompletedTask);
        }

        [Fact]
        public async Task StartAsync_CalledTwice_ShouldNotThrow()
        {
            await _handler.StartAsync();
            var act = () => _handler.StartAsync();
            await act.Should().NotThrowAsync();
        }

        [Fact]
        public void Stop_ShouldNotThrowWhenNotStarted()
        {
            var act = () => _handler.Stop();
            act.Should().NotThrow();
        }

        [Fact]
        public async Task Stop_ShouldNotThrowAfterStart()
        {
            await _handler.StartAsync();
            var act = () => _handler.Stop();
            act.Should().NotThrow();
        }

        [Fact]
        public void Dispose_ShouldNotThrowWhenCalledMultipleTimes()
        {
            _handler.Dispose();
            var act = () => _handler.Dispose();
            act.Should().NotThrow();
        }

        // ── Connection State ─────────────────────────────────────────────

        [Fact]
        public void IsClientConnected_ShouldReturnFalseInitially()
        {
            _handler.IsClientConnected().Should().BeFalse();
        }

        [Fact]
        public async Task IsClientConnected_ShouldReturnFalseWhenNoServer()
        {
            _handler.ServerHost = "127.0.0.1";
            _handler.ServerPort = 59999; // unlikely port
            await _handler.StartAsync();
            await Task.Delay(200);
            _handler.IsClientConnected().Should().BeFalse();
        }

        // ── Sending Messages ─────────────────────────────────────────────

        [Fact]
        public void SendMessage_WhenNotConnected_ShouldNotThrow()
        {
            var act = () => _handler.SendMessage("test");
            act.Should().NotThrow();
        }

        [Fact]
        public void SendMessageObject_WhenNotConnected_ShouldNotThrow()
        {
            var act = () => _handler.SendMessage(new { category = "test", method = "ping" });
            act.Should().NotThrow();
        }

        [Fact]
        public void SendMessage_EmptyString_ShouldNotThrow()
        {
            var act = () => _handler.SendMessage("");
            act.Should().NotThrow();
        }

        [Fact]
        public void SendMessage_NullObject_ShouldNotThrow()
        {
            var act = () => _handler.SendMessage((object)null!);
            act.Should().NotThrow();
        }

        // ── Events ──────────────────────────────────────────────────────

        [Fact]
        public void MessageReceived_EventCanBeSubscribed()
        {
            bool eventRaised = false;
            _handler.MessageReceived += (s, m) => eventRaised = true;
            eventRaised.Should().BeFalse();
        }

        [Fact]
        public void ServerConnected_EventCanBeSubscribed()
        {
            bool eventRaised = false;
            _handler.ServerConnected += (s, e) => eventRaised = true;
            eventRaised.Should().BeFalse();
        }

        [Fact]
        public void ServerDisconnected_EventCanBeSubscribed()
        {
            bool eventRaised = false;
            _handler.ServerDisconnected += (s, e) => eventRaised = true;
            eventRaised.Should().BeFalse();
        }

        // ── Integration: Full Connect / Send / Receive / Disconnect ─────

        [Fact]
        public async Task FullCycle_ConnectSendReceiveDisconnect()
        {
            // Start a mock TCP server
            int port = GetFreePort();
            var listener = new TcpListener(IPAddress.Loopback, port);
            listener.Start();

            string? receivedByServer = null;
            bool clientConnectedEvent = false;
            bool clientDisconnectedEvent = false;
            string? receivedByClient = null;

            _handler.ServerHost = "127.0.0.1";
            _handler.ServerPort = port;
            _handler.ReconnectDelayMs = 500;
            _handler.ServerConnected += (s, e) => clientConnectedEvent = true;
            _handler.ServerDisconnected += (s, e) => clientDisconnectedEvent = true;
            _handler.MessageReceived += (s, m) => receivedByClient = m;

            await _handler.StartAsync();

            // Accept connection from the handler
            var serverClient = await listener.AcceptTcpClientAsync();
            var serverStream = serverClient.GetStream();
            var reader = new System.IO.StreamReader(serverStream, Encoding.UTF8);

            // Wait for connection event
            await WaitUntil(() => clientConnectedEvent, 5000);
            clientConnectedEvent.Should().BeTrue("handler should fire ServerConnected");
            _handler.IsClientConnected().Should().BeTrue();

            // Client -> Server
            // The handler auto-sends a "connected" status message upon connecting.
            // Read and skip that first message before sending our test message.
            var autoMsg = await reader.ReadLineAsync();
            autoMsg.Should().Contain("connected", "first message should be the auto status");

            _handler.SendMessage("{\"category\":\"test\",\"method\":\"ping\"}");
            receivedByServer = await reader.ReadLineAsync();
            receivedByServer.Should().Contain("ping");

            // Server -> Client
            var data = Encoding.UTF8.GetBytes("{\"category\":\"response\",\"method\":\"pong\"}\n");
            await serverStream.WriteAsync(data, 0, data.Length);
            await serverStream.FlushAsync();
            await WaitUntil(() => receivedByClient != null, 3000);
            receivedByClient.Should().Contain("pong");

            // Disconnect from server side
            serverClient.Close();
            listener.Stop();

            await WaitUntil(() => clientDisconnectedEvent, 5000);
            clientDisconnectedEvent.Should().BeTrue("handler should fire ServerDisconnected");

            _handler.Stop();
        }

        [Fact]
        public async Task Reconnection_ShouldReconnectAfterServerRestart()
        {
            int port = GetFreePort();
            var listener = new TcpListener(IPAddress.Loopback, port);
            listener.Start();

            int connectCount = 0;
            _handler.ServerHost = "127.0.0.1";
            _handler.ServerPort = port;
            _handler.ReconnectDelayMs = 500;
            _handler.ServerConnected += (s, e) => Interlocked.Increment(ref connectCount);

            await _handler.StartAsync();

            // First connection
            var client1 = await listener.AcceptTcpClientAsync();
            await WaitUntil(() => connectCount >= 1, 5000);
            connectCount.Should().BeGreaterOrEqualTo(1);

            // Disconnect from server
            client1.Close();
            await Task.Delay(200);

            // Second connection (reconnection)
            var client2 = await listener.AcceptTcpClientAsync();
            await WaitUntil(() => connectCount >= 2, 8000);
            connectCount.Should().BeGreaterOrEqualTo(2);

            client2.Close();
            listener.Stop();
            _handler.Stop();
        }

        // ── Helpers ──────────────────────────────────────────────────────

        private static int GetFreePort()
        {
            var l = new TcpListener(IPAddress.Loopback, 0);
            l.Start();
            int port = ((IPEndPoint)l.LocalEndpoint).Port;
            l.Stop();
            return port;
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
