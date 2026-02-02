# LighTouch® - Application C#

Application de contrôle gestuel pour ordinateur utilisant un dispositif LighTouch connecté en Bluetooth.

## 🎯 Vue d'ensemble

LighTouch permet de contrôler votre ordinateur avec des gestes de la main détectés par un dispositif Bluetooth. L'application offre :

- **Contrôle par gestes** : Swipe, déplacement du curseur, clics
- **Calibration caméra** : Calibration du dispositif de tracking
- **Modes personnalisables** : Mode présentation, mode navigation
- **Configuration WiFi** : Génération de QR codes pour connecter le dispositif au WiFi
- **Multilingue** : Français et Anglais
- **Accessible** : Mode sombre, tailles de texte ajustables, synthèse vocale

## 🚀 Démarrage rapide

### Prérequis
- Windows 10/11
- .NET 10.0 SDK : https://dotnet.microsoft.com/download

### Installation et lancement

```batch
cd CSharpApp/Build
run-dev.bat
```

C'est tout ! L'application va copier les fichiers frontend et démarrer automatiquement.

## 📚 Documentation complète

- **[CSharpApp/README.md](CSharpApp/README.md)** - README principal de l'application
- **[CSharpApp/Documentation/QUICK-START.md](CSharpApp/Documentation/QUICK-START.md)** - Guide de démarrage en 3 étapes
- **[CSharpApp/Documentation/README.md](CSharpApp/Documentation/README.md)** - Documentation technique détaillée
- **[CSharpApp/Documentation/ARCHITECTURE.md](CSharpApp/Documentation/ARCHITECTURE.md)** - Architecture de l'application

## 🏗️ Structure du projet

```
Software/
├── CSharpApp/              # 🎯 Application C# complète (WPF + WebView2)
│   ├── Services/           # Backend C# (Bluetooth, Mouse, WiFi, Bridge)
│   ├── Frontend/           # Code source web (HTML/CSS/JS)
│   ├── wwwroot/            # Build web (généré automatiquement)
│   ├── Documentation/      # Documentation complète
│   ├── Build/              # Scripts de build
│   ├── App.xaml[.cs]       # Application WPF
│   ├── MainWindow.xaml[.cs]# Fenêtre principale
│   ├── LighTouch.csproj    # Projet .NET
│   └── README.md           # README de l'application
├── .github/                # GitHub workflows
├── LICENSE                 # Licence du projet
└── README.md               # Ce fichier
```

## 🎨 Fonctionnalités

### Gestes supportés
- **Swipe gauche/droite** : Navigation (touches clavier configurables)
- **Déplacement du curseur** : Contrôle direct de la souris
- **Clic** : Clic gauche/droit/milieu

### Modes
- **Mode Présentation** : Activer les swipes pour naviguer dans les slides
- **Mode Navigation** : Activer le contrôle de la souris
- **Raccourci** : Appuyez sur **Espace** pour activer/désactiver

### Configuration
- **Calibration** : Calibrer le dispositif de tracking pour votre environnement
- **Key Bindings** : Personnaliser les touches associées aux gestes
- **Settings** : Thème, langue, taille de texte, main dominante
- **WiFi QR** : Générer un QR code pour connecter le dispositif au WiFi

## 🔧 Technologies

### Backend C#
- **WPF** : Framework d'interface Windows
- **WebView2** : Hébergement du frontend web
- **System.IO.Ports** : Communication Bluetooth série
- **Win32 API** : Contrôle souris/clavier natif
- **QRCoder** : Génération de QR codes

### Frontend
- **HTML5/CSS3** : Interface utilisateur
- **Vanilla JavaScript** : Pas de framework, code pur
- **LocalStorage** : Persistance des préférences

## 🆚 Avantages vs Electron (ancienne version)

| Aspect | Electron (ancien) | C# + WebView2 (actuel) |
|--------|-------------------|------------------------|
| **Taille** | ~200 MB | ~50 MB |
| **Démarrage** | 3-4 sec | 1-2 sec |
| **Mémoire** | 150-200 MB | 80-120 MB |
| **Backend** | Node.js + Python | 100% C# |
| **Runtime** | Chromium embarqué | WebView2 système |

## 📦 Build pour production

```batch
cd CSharpApp/Build
build-release.bat
```

L'exécutable sera dans : `CSharpApp/bin/Release/net10.0-windows/win-x64/publish/LighTouch.exe`

## 🤝 Contribution

Ce projet fait partie de l'EIP (Epitech Innovative Project).

## 📄 Licence

Voir le fichier [LICENSE](LICENSE)

## 🐛 Problèmes connus

### Bluetooth ne se connecte pas
- Assurez-vous que votre dispositif est appairé dans Windows (Paramètres > Bluetooth)
- Vérifiez les ports COM dans le Gestionnaire de périphériques

### Les touches clavier ne fonctionnent pas
- Lancez l'application en tant qu'administrateur (certaines touches nécessitent des privilèges élevés)

### Le frontend ne s'affiche pas
- Vérifiez que `Build/run-dev.bat` a bien copié les fichiers dans `wwwroot/`

Pour plus d'aide, consultez la [documentation complète](CSharpApp/Documentation/README.md).

---

**Développé avec ❤️ pour rendre l'informatique accessible à tous**
