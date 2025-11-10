# LighTouch - Application C#

Cette application C# remplace l'application Electron originale tout en gardant le front-end HTML/CSS/JS existant.

## Architecture

- **WPF + WebView2** : Interface graphique qui héberge le front-end web
- **C# Backend** : Remplace Node.js et Python
  - BluetoothHandler : Communication Bluetooth (remplace server.py)
  - MouseKeyboardController : Contrôle souris/clavier (remplace @nut-tree-fork/nut-js)
  - WiFiManager : Gestion WiFi et génération QR codes
  - JavaScriptBridge : Pont entre C# et JavaScript (remplace IPC Electron)

## Prérequis

- .NET 9.0 SDK
- Windows 10/11
- WebView2 Runtime (généralement déjà installé sur Windows 11)

## Installation

1. **Copier les fichiers frontend** :
   ```powershell
   cd CSharpApp
   .\copy-frontend.ps1
   ```

2. **Modifier index.html** :
   Ouvrez `wwwroot\index.html` et ajoutez cette ligne au début de la balise `<body>` :
   ```html
   <script src="webview-adapter.js"></script>
   ```

3. **Restaurer les packages NuGet** :
   ```bash
   dotnet restore
   ```

## Compilation et exécution

### Mode développement
```bash
dotnet run
```

### Compilation en mode Release
```bash
dotnet build -c Release
```

### Créer un exécutable
```bash
dotnet publish -c Release -r win-x64 --self-contained true
```

L'exécutable sera dans `bin\Release\net9.0-windows\win-x64\publish\`

## Configuration Bluetooth

L'application détecte automatiquement les ports COM Bluetooth disponibles sur Windows.
Si vous avez plusieurs appareils Bluetooth, vous devrez peut-être modifier la logique dans `BluetoothHandler.cs` pour identifier le bon appareil.

## Différences avec Electron

### Avantages
- **Plus léger** : Pas besoin de Chromium embarqué (utilise WebView2 du système)
- **Plus rapide au démarrage** : Application native C#
- **Meilleure intégration Windows** : APIs Windows natives
- **Un seul langage backend** : Tout en C# (plus besoin de Python)

### Points d'attention
- L'API JavaScript est asynchrone pour certaines méthodes (via `chrome.webview.hostObjects`)
- Le fichier `webview-adapter.js` fait le pont pour garder la compatibilité

## Structure des fichiers

```
CSharpApp/
├── LighTouch.csproj              # Fichier projet
├── App.xaml / App.xaml.cs        # Application WPF
├── MainWindow.xaml / .cs         # Fenêtre principale
├── JavaScriptBridge.cs           # Pont JS ↔ C#
├── BluetoothHandler.cs           # Gestion Bluetooth
├── MouseKeyboardController.cs    # Contrôle souris/clavier
├── WiFiManager.cs                # Gestion WiFi
├── copy-frontend.ps1             # Script de copie
├── wwwroot/                      # Fichiers web (copié depuis ../src)
│   ├── index.html
│   ├── renderer.js
│   ├── style.css
│   ├── webview-adapter.js       # Adapter WebView2
│   └── ...                       # Autres fichiers du front
└── README.md                     # Ce fichier
```

## Dépendances

- **Microsoft.Web.WebView2** : Pour héberger le contenu web
- **System.IO.Ports** : Pour la communication série Bluetooth
- **QRCoder** : Pour générer les QR codes WiFi

## Troubleshooting

### L'application ne trouve pas index.html
Vérifiez que vous avez exécuté `copy-frontend.ps1` pour copier les fichiers.

### Les APIs JavaScript ne fonctionnent pas
Assurez-vous que `webview-adapter.js` est inclus dans `index.html`.

### Bluetooth ne se connecte pas
- Vérifiez que l'appareil est appairé dans les paramètres Windows
- Vérifiez dans le Gestionnaire de périphériques que le port COM est disponible
- Consultez la console pour voir les messages de debug

### Les touches clavier ne fonctionnent pas
Certaines touches peuvent nécessiter des privilèges administrateur. Essayez de lancer l'application en tant qu'administrateur.
