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
    /// Unit tests for TcpServerHandler.
    /// Tests cover: construction, property defaults, start/stop lifecycle,
    /// client connection/disconnection events, message sending/receiving,
    /// and multi-client behaviour.
    /// </summary>
    public class TcpServerHandlerTests : IDisposable
    {
        private TcpServerHandler _handler;

        public TcpServerHandlerTests()
        {
            _handler = new TcpServerHandler();
        }

        public void Dispose()
        {
            _handler?.Dispose();
        }

        // ── Construction & Defaults ──────────────────────────────────────

        [Fact]
        public void Constructor_ShouldInitializeWithDefaultValues()
        {
            _handler.Port.Should().Be(8888);
            _handler.AllowMultipleClients.Should().BeFalse();
        }

        [Fact]
        public void Port_CanBeSetAndRetrieved()
        {
            _handler.Port = 12345;
            _handler.Port.Should().Be(12345);
        }

        [Fact]
        public void AllowMultipleClients_CanBeSetAndRetrieved()
        {
            _handler.AllowMultipleClients = true;
            _handler.AllowMultipleClients.Should().BeTrue();
        }

        // ── Lifecycle ────────────────────────────────────────────────────

        [Fact]
        public void Stop_ShouldNotThrowWhenNotStarted()
        {
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

        // ── Sending Messages ─────────────────────────────────────────────

        [Fact]
        public void SendMessage_WhenNoClient_ShouldNotThrow()
        {
            var act = () => _handler.SendMessage("test message");
            act.Should().NotThrow();
        }

        // ── Events ──────────────────────────────────────────────────────

        [Fact]
        public void MessageReceived_EventCanBeSubscribed()
        {
            bool raised = false;
            _handler.MessageReceived += (s, m) => raised = true;
            raised.Should().BeFalse();
        }

        [Fact]
        public void ClientConnected_EventCanBeSubscribed()
        {
            bool raised = false;
            _handler.ClientConnected += (s, e) => raised = true;
            raised.Should().BeFalse();
        }

        [Fact]
        public void ClientDisconnected_EventCanBeSubscribed()
        {
            bool raised = false;
            _handler.ClientDisconnected += (s, e) => raised = true;
            raised.Should().BeFalse();
        }

        // ── Integration: Server accepts client ──────────────────────────

        [Fact]
        public async Task Server_ShouldAcceptClientAndReceiveMessage()
        {
            int port = GetFreePort();
            _handler.Port = port;

            bool clientConnectedEvent = false;
            string? receivedMessage = null;

            _handler.ClientConnected += (s, e) => clientConnectedEvent = true;
            _handler.MessageReceived += (s, m) => receivedMessage = m;

            // Start the server in background (StartAsync blocks, so run in task)
            var serverTask = Task.Run(() => _handler.StartAsync());
            await Task.Delay(500); // Let server start

            // Connect a mock client
            using var client = new TcpClient();
            await client.ConnectAsync("127.0.0.1", port);

            await WaitUntil(() => clientConnectedEvent, 5000);
            clientConnectedEvent.Should().BeTrue();

            // Send a message from client to server
            var stream = client.GetStream();
            var msg = Encoding.UTF8.GetBytes("{\"category\":\"test\",\"method\":\"hello\"}\n");
            await stream.WriteAsync(msg, 0, msg.Length);
            await stream.FlushAsync();

            await WaitUntil(() => receivedMessage != null, 3000);
            receivedMessage.Should().Contain("hello");

            _handler.IsClientConnected().Should().BeTrue();

            _handler.Stop();
        }

        [Fact]
        public async Task Server_ShouldSendMessageToClient()
        {
            int port = GetFreePort();
            _handler.Port = port;

            bool clientConnectedEvent = false;
            _handler.ClientConnected += (s, e) => clientConnectedEvent = true;

            var serverTask = Task.Run(() => _handler.StartAsync());
            await Task.Delay(500);

            using var client = new TcpClient();
            await client.ConnectAsync("127.0.0.1", port);

            await WaitUntil(() => clientConnectedEvent, 5000);

            // Server sends to client
            _handler.SendMessage("{\"status\":\"ok\"}");

            var stream = client.GetStream();
            var reader = new System.IO.StreamReader(stream, Encoding.UTF8);
            var received = await reader.ReadLineAsync();

            received.Should().Contain("ok");

            _handler.Stop();
        }

        [Fact]
        public async Task Server_ShouldDetectClientDisconnection()
        {
            int port = GetFreePort();
            _handler.Port = port;

            bool clientDisconnectedEvent = false;
            _handler.ClientConnected += (s, e) => { };
            _handler.ClientDisconnected += (s, e) => clientDisconnectedEvent = true;

            var serverTask = Task.Run(() => _handler.StartAsync());
            await Task.Delay(500);

            var client = new TcpClient();
            await client.ConnectAsync("127.0.0.1", port);
            await Task.Delay(500);

            // Close client to trigger disconnection
            client.Close();

            await WaitUntil(() => clientDisconnectedEvent, 5000);
            clientDisconnectedEvent.Should().BeTrue();

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
