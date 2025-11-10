# LighTouch® - Application C#

Application de contrôle gestuel pour ordinateur Windows utilisant WPF et WebView2.

## 🚀 Démarrage rapide

```batch
cd Build
run-dev.bat
```

C'est tout ! L'application va copier les fichiers frontend et démarrer.

## 📁 Structure du projet

```
CSharpApp/
├── Services/              # Backend C# (Bluetooth, Mouse/Keyboard, WiFi, Bridge)
│   ├── BluetoothHandler.cs
│   ├── MouseKeyboardController.cs
│   ├── WiFiManager.cs
│   └── JavaScriptBridge.cs
├── Frontend/              # Code source web (HTML/CSS/JS)
│   ├── index.html
│   ├── renderer.js
│   ├── style.css
│   ├── interactions/      # Actions et settings
│   ├── settings/          # Configuration utilisateur
│   └── ...
├── wwwroot/               # Fichiers web générés (ne pas éditer)
├── Documentation/         # Documentation complète
│   ├── QUICK-START.md     # Guide de démarrage
│   ├── README.md          # Documentation détaillée
│   └── ARCHITECTURE.md    # Architecture technique
├── Build/                 # Scripts de build
│   ├── run-dev.bat        # Lancer en dev
│   ├── build-release.bat  # Build production
│   └── copy-frontend.ps1  # Copie des fichiers frontend
├── App.xaml[.cs]          # Application WPF
├── MainWindow.xaml[.cs]   # Fenêtre principale
├── LighTouch.csproj       # Projet .NET
└── .gitignore
```

## 📚 Documentation

- **[Documentation/QUICK-START.md](Documentation/QUICK-START.md)** - Guide de démarrage en 3 étapes
- **[Documentation/README.md](Documentation/README.md)** - Documentation technique complète
- **[Documentation/ARCHITECTURE.md](Documentation/ARCHITECTURE.md)** - Architecture détaillée

## 🛠️ Commandes principales

### Développement
```batch
cd Build
run-dev.bat
```

### Build production
```batch
cd Build
build-release.bat
```

L'exécutable sera dans : `bin\Release\net9.0-windows\win-x64\publish\LighTouch.exe`

### Build manuel
```batch
dotnet restore
dotnet build
dotnet run
```

## 🔧 Prérequis

- Windows 10/11
- .NET 9.0 SDK
- WebView2 Runtime (généralement déjà installé)

## 🎯 Technologies

- **WPF** - Interface Windows native
- **WebView2** - Hébergement du frontend web
- **System.IO.Ports** - Communication Bluetooth
- **Win32 API** - Contrôle souris/clavier
- **QRCoder** - Génération de QR codes WiFi

## 💡 Fonctionnalités

- ✅ Contrôle par gestes (swipe, déplacement, clics)
- ✅ Calibration du dispositif de tracking
- ✅ Modes présentation et navigation
- ✅ Configuration WiFi avec QR code
- ✅ Multilingue (FR/EN)
- ✅ Thème sombre/clair
- ✅ Accessibilité (synthèse vocale, tailles ajustables)

## 🐛 Dépannage

### L'application ne démarre pas
Vérifiez que .NET 9.0 est installé :
```batch
dotnet --version
```

### Le frontend ne s'affiche pas
Assurez-vous que les fichiers ont été copiés :
```batch
dir wwwroot
```

### Bluetooth ne se connecte pas
- Appairez votre dispositif dans Windows
- Vérifiez les ports COM dans le Gestionnaire de périphériques

Pour plus d'aide, consultez la [documentation complète](Documentation/README.md).

## 📄 Licence

Voir le fichier [LICENSE](../LICENSE) à la racine du projet.

---

**Partie de l'EIP (Epitech Innovative Project) - LighTouch®**
