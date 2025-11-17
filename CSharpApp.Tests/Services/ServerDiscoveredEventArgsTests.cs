using System;
using System.Text.Json;
using FluentAssertions;
using Xunit;
using LighTouch.Services;

namespace LighTouch.Tests.Services
{
    /// <summary>
    /// Unit tests for ServerDiscoveredEventArgs.
    /// Tests cover: property assignment and retrieval.
    /// </summary>
    public class ServerDiscoveredEventArgsTests
    {
        [Fact]
        public void Properties_ShouldBeSetAndRetrieved()
        {
            var args = new ServerDiscoveredEventArgs
            {
                ServerIp = "10.0.0.1",
                ServerPort = 9999,
                ServerName = "MyRaspberry"
            };

            args.ServerIp.Should().Be("10.0.0.1");
            args.ServerPort.Should().Be(9999);
            args.ServerName.Should().Be("MyRaspberry");
        }

        [Fact]
        public void DefaultValues_ShouldBeNull()
        {
            var args = new ServerDiscoveredEventArgs();
            args.ServerIp.Should().BeNull();
            args.ServerPort.Should().Be(0);
            args.ServerName.Should().BeNull();
        }

        [Fact]
        public void ShouldInheritFromEventArgs()
        {
            var args = new ServerDiscoveredEventArgs();
            args.Should().BeAssignableTo<EventArgs>();
        }
    }
}
