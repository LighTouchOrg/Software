using System;
using FluentAssertions;
using Xunit;
using LighTouch.Services;

namespace LighTouch.Tests.Services
{
    /// <summary>
    /// Unit tests for MouseKeyboardController.
    /// Tests cover: construction, method invocation without crash
    /// (mouse move, press, release, key press), edge cases (negative coords,
    /// invalid buttons, unrecognised keys, special keys).
    ///
    /// IMPORTANT: These tests validate that calls do not throw exceptions.
    /// Actual cursor movement and key presses rely on Win32 API and cannot
    /// be asserted in a headless test environment.
    /// </summary>
    public class MouseKeyboardControllerTests
    {
        private readonly MouseKeyboardController _controller;

        public MouseKeyboardControllerTests()
        {
            _controller = new MouseKeyboardController();
        }

        // ── Construction ─────────────────────────────────────────────────

        [Fact]
        public void Constructor_ShouldNotThrow()
        {
            var act = () => new MouseKeyboardController();
            act.Should().NotThrow();
        }

        // ── MoveMouse ────────────────────────────────────────────────────

        [Fact]
        public void MoveMouse_ValidCoordinates_ShouldNotThrow()
        {
            var act = () => _controller.MoveMouse(100, 200);
            act.Should().NotThrow();
        }

        [Fact]
        public void MoveMouse_ZeroCoordinates_ShouldNotThrow()
        {
            var act = () => _controller.MoveMouse(0, 0);
            act.Should().NotThrow();
        }

        [Fact]
        public void MoveMouse_NegativeCoordinates_ShouldNotThrow()
        {
            var act = () => _controller.MoveMouse(-1, -1);
            act.Should().NotThrow();
        }

        [Fact]
        public void MoveMouse_LargeCoordinates_ShouldNotThrow()
        {
            var act = () => _controller.MoveMouse(99999, 99999);
            act.Should().NotThrow();
        }

        // ── PressMouse ───────────────────────────────────────────────────

        [Fact]
        public void PressMouse_DefaultParams_ShouldNotThrow()
        {
            var act = () => _controller.PressMouse();
            act.Should().NotThrow();
        }

        [Fact]
        public void PressMouse_WithCoordinates_ShouldNotThrow()
        {
            var act = () => _controller.PressMouse(500, 300);
            act.Should().NotThrow();
        }

        [Theory]
        [InlineData("LEFT")]
        [InlineData("RIGHT")]
        [InlineData("MIDDLE")]
        public void PressMouse_DifferentButtons_ShouldNotThrow(string button)
        {
            var act = () => _controller.PressMouse(100, 100, button);
            act.Should().NotThrow();
        }

        [Fact]
        public void PressMouse_UnknownButton_ShouldNotThrow()
        {
            var act = () => _controller.PressMouse(100, 100, "UNKNOWN_BTN");
            act.Should().NotThrow();
        }

        // ── ReleaseMouse ─────────────────────────────────────────────────

        [Fact]
        public void ReleaseMouse_DefaultParams_ShouldNotThrow()
        {
            var act = () => _controller.ReleaseMouse();
            act.Should().NotThrow();
        }

        [Fact]
        public void ReleaseMouse_WithCoordinates_ShouldNotThrow()
        {
            var act = () => _controller.ReleaseMouse(500, 300);
            act.Should().NotThrow();
        }

        [Theory]
        [InlineData("LEFT")]
        [InlineData("RIGHT")]
        [InlineData("MIDDLE")]
        public void ReleaseMouse_DifferentButtons_ShouldNotThrow(string button)
        {
            var act = () => _controller.ReleaseMouse(100, 100, button);
            act.Should().NotThrow();
        }

        [Fact]
        public void ReleaseMouse_UnknownButton_ShouldNotThrow()
        {
            var act = () => _controller.ReleaseMouse(100, 100, "UNKNOWN_BTN");
            act.Should().NotThrow();
        }

        // ── PressKey ─────────────────────────────────────────────────────

        [Theory]
        [InlineData("ArrowLeft")]
        [InlineData("ArrowRight")]
        [InlineData("ArrowUp")]
        [InlineData("ArrowDown")]
        public void PressKey_ArrowKeys_ShouldNotThrow(string key)
        {
            var act = () => _controller.PressKey(key);
            act.Should().NotThrow();
        }

        [Theory]
        [InlineData("space")]
        [InlineData("enter")]
        [InlineData("escape")]
        [InlineData("tab")]
        [InlineData("backspace")]
        [InlineData("delete")]
        [InlineData("home")]
        [InlineData("end")]
        [InlineData("pageup")]
        [InlineData("pagedown")]
        [InlineData("insert")]
        public void PressKey_SpecialKeys_ShouldNotThrow(string key)
        {
            var act = () => _controller.PressKey(key);
            act.Should().NotThrow();
        }

        [Theory]
        [InlineData("f1")]
        [InlineData("f5")]
        [InlineData("f12")]
        public void PressKey_FunctionKeys_ShouldNotThrow(string key)
        {
            var act = () => _controller.PressKey(key);
            act.Should().NotThrow();
        }

        [Theory]
        [InlineData("a")]
        [InlineData("z")]
        [InlineData("1")]
        [InlineData("9")]
        public void PressKey_SingleCharacter_ShouldNotThrow(string key)
        {
            var act = () => _controller.PressKey(key);
            act.Should().NotThrow();
        }

        [Fact]
        public void PressKey_UnrecognisedKey_ShouldNotThrow()
        {
            var act = () => _controller.PressKey("UNKNOWN_KEY_VALUE");
            act.Should().NotThrow();
        }

        [Fact]
        public void PressKey_EscAbbreviation_ShouldNotThrow()
        {
            var act = () => _controller.PressKey("esc");
            act.Should().NotThrow();
        }

        [Fact]
        public void PressKey_DelAbbreviation_ShouldNotThrow()
        {
            var act = () => _controller.PressKey("del");
            act.Should().NotThrow();
        }

        // ── Mouse Press + Release Cycle ──────────────────────────────────

        [Fact]
        public void PressAndRelease_FullCycle_ShouldNotThrow()
        {
            var act = () =>
            {
                _controller.PressMouse(400, 300, "LEFT");
                _controller.ReleaseMouse(400, 300, "LEFT");
            };
            act.Should().NotThrow();
        }
    }
}
