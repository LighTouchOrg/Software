# PowerShell script to copy frontend files to wwwroot

$sourcePath = "..\Frontend"
$destPath = "..\wwwroot"

# Create wwwroot directory if it doesn't exist
if (-not (Test-Path $destPath)) {
    New-Item -ItemType Directory -Path $destPath -Force
}

# Copy all files from Frontend to wwwroot
Write-Host "Copying frontend files from $sourcePath to $destPath..."
Copy-Item -Path "$sourcePath\*" -Destination $destPath -Recurse -Force

# Ensure the adapter file is in wwwroot
$adapterSource = "$destPath\webview-adapter.js"
if (-not (Test-Path $adapterSource)) {
    Write-Host "Warning: webview-adapter.js not found in wwwroot!"
}

Write-Host "Frontend files copied successfully!"
Write-Host ""
Write-Host "Note: The webview-adapter.js should already be included in Frontend/index.html"
