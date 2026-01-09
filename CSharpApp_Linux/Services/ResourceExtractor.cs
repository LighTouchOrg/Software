using System;
using System.IO;
using System.Reflection;

namespace LighTouch.Services
{
    public static class ResourceExtractor
    {
        private static string extractedPath = null;

        /// <summary>
        /// Extrait les ressources wwwroot embarquées dans un dossier temporaire
        /// </summary>
        public static string GetWwwRootPath()
        {
            if (extractedPath != null && Directory.Exists(extractedPath))
            {
                return extractedPath;
            }

            // Crée un dossier temporaire unique pour cette application
            string tempDir = Path.Combine(Path.GetTempPath(), "LighTouch", "wwwroot");

            // Nettoie l'ancien dossier si il existe
            if (Directory.Exists(tempDir))
            {
                try
                {
                    Directory.Delete(tempDir, true);
                }
                catch
                {
                    // Ignore les erreurs de suppression
                }
            }

            Directory.CreateDirectory(tempDir);

            // Récupère l'assembly en cours
            var assembly = Assembly.GetExecutingAssembly();
            var resourceNames = assembly.GetManifestResourceNames();

            int extractedCount = 0;
            foreach (var resourceName in resourceNames)
            {
                // Filtre uniquement les ressources wwwroot
                if (!resourceName.StartsWith("wwwroot\\") && !resourceName.StartsWith("wwwroot/"))
                    continue;

                // Extrait le chemin relatif (enlève "wwwroot\" ou "wwwroot/")
                string relativePath = resourceName.StartsWith("wwwroot\\")
                    ? resourceName.Substring("wwwroot\\".Length)
                    : resourceName.Substring("wwwroot/".Length);

                // Normalise les slashes
                relativePath = relativePath.Replace('/', Path.DirectorySeparatorChar);
                string fullPath = Path.Combine(tempDir, relativePath);

                // Crée les sous-dossiers si nécessaire
                string directory = Path.GetDirectoryName(fullPath);
                if (!string.IsNullOrEmpty(directory))
                {
                    Directory.CreateDirectory(directory);
                }

                // Extrait la ressource
                using (Stream resourceStream = assembly.GetManifestResourceStream(resourceName))
                {
                    if (resourceStream != null)
                    {
                        using (FileStream fileStream = new FileStream(fullPath, FileMode.Create, FileAccess.Write))
                        {
                            resourceStream.CopyTo(fileStream);
                        }
                        extractedCount++;
                    }
                }
            }

            if (extractedCount == 0)
            {
                throw new Exception($"Aucune ressource wwwroot trouvée. Ressources disponibles: {string.Join(", ", resourceNames)}");
            }

            extractedPath = tempDir;
            return extractedPath;
        }
    }
}
