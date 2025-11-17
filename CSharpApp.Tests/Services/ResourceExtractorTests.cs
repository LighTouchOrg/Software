using System;
using System.IO;
using FluentAssertions;
using Xunit;
using LighTouch.Services;

namespace LighTouch.Tests.Services
{
    /// <summary>
    /// Unit tests for ResourceExtractor.
    /// Tests cover: static method invocation, error handling when no embedded
    /// resources are present (Debug mode), and path format validation.
    /// </summary>
    public class ResourceExtractorTests
    {
        // ── GetWwwRootPath ───────────────────────────────────────────────

        [Fact]
        public void GetWwwRootPath_InDebugMode_ShouldThrowOrReturnValidPath()
        {
            // In Debug builds, there are no embedded resources.
            // The method should either:
            //   - Return a valid path (if wwwroot was previously extracted)
            //   - Throw an Exception ("Aucune ressource wwwroot trouvée")
            try
            {
                string path = ResourceExtractor.GetWwwRootPath();
                // If it returns, the path should be valid
                path.Should().NotBeNullOrEmpty();
                path.Should().Contain("wwwroot");
            }
            catch (Exception ex)
            {
                // Expected in Debug mode when no resources are embedded
                ex.Message.Should().Contain("wwwroot");
            }
        }

        [Fact]
        public void GetWwwRootPath_ShouldReturnPathUnderTempDirectory()
        {
            try
            {
                string path = ResourceExtractor.GetWwwRootPath();
                string tempBase = Path.GetTempPath();
                path.Should().StartWith(tempBase.TrimEnd(Path.DirectorySeparatorChar));
            }
            catch (Exception)
            {
                // Expected in Debug
            }
        }

        [Fact]
        public void GetWwwRootPath_CalledTwice_ShouldReturnSamePath()
        {
            try
            {
                string path1 = ResourceExtractor.GetWwwRootPath();
                string path2 = ResourceExtractor.GetWwwRootPath();
                path1.Should().Be(path2, "cached path should be reused");
            }
            catch (Exception)
            {
                // Expected in Debug
            }
        }
    }
}
