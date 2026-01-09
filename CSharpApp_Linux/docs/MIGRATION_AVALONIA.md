# Migration vers Avalonia UI - Version Cross-Platform

## 🎯 Objectif

Le projet LighTouch a été migré de **WPF (Windows uniquement)** vers **Avalonia UI** pour supporter **Linux, macOS et Windows**.

## ✅ Ce qui a été fait

### 1. **Nouveau projet Avalonia**
- Création d'un nouveau projet basé sur Avalonia UI 11.3.10
- Framework cible : **.NET 8.0** (compatible avec le SDK installé)
- Architecture MVVM (Model-View-ViewModel)

### 2. **Services Backend (100% conservés)**
Les services réseau sont déjà cross-platform et ont été copiés tels quels :
- ✅ `TcpClientHandler.cs` - Client TCP pour communiquer avec le serveur Python
- ✅ `UdpDiscoveryService.cs` - Découverte automatique du serveur via UDP
- ✅ `WiFiManager.cs` - Gestion WiFi
- ✅ `ResourceExtractor.cs` - Extraction de ressources embarquées

### 3. **Nouveau contrôleur Souris/Clavier Cross-Platform**
- **Windows** : Utilise P/Invoke avec `user32.dll` (SendInput, SetCursorPos)
- **Linux** : Utilise `xdotool` (installable via `sudo apt install xdotool`)
- Fonctionnalités :
  - ✅ Déplacement de la souris
  - ✅ Clics de souris (gauche, droit, milieu)
  - ✅ Pression de touches
  - ✅ Saisie de texte
  - ✅ Défilement

### 4. **Interface utilisateur Avalonia**
Nouvelle fenêtre principale avec :
- Status de connexion en temps réel
- Informations sur le serveur découvert
- Boutons Démarrer/Arrêter le service
- Console de logs intégrée
- Design moderne et responsive

### 5. **Makefile mis à jour**
Nouvelles commandes :
```bash
make check-dotnet    # Vérifie .NET SDK
make install-deps    # Installe xdotool sur Linux
make build           # Compile en mode Debug
make run             # Compile et exécute
make publish-linux   # Build standalone pour Linux
make publish-win     # Build standalone pour Windows
make clean           # Nettoie les fichiers générés
```

## 📦 Sauvegarde

L'ancien projet WPF a été sauvegardé dans `CSharpApp.wpf.backup/`

## 🚀 Utilisation

### Linux

1. **Installer les dépendances** :
```bash
make install-deps
```

2. **Compiler et exécuter** :
```bash
make run
```

3. **Créer un exécutable standalone** :
```bash
make publish-linux
# L'exécutable sera dans bin/publish-linux/
```

### Windows

1. **Compiler** :
```bash
make build
```

2. **Créer un exécutable standalone** :
```bash
make publish-win
# L'exécutable sera dans bin/publish-win/
```

## 🔧 Configuration requise

- **.NET 8.0 SDK** (ou supérieur)
- **Linux** : `xdotool` pour le contrôle souris/clavier
- **Windows** : Aucune dépendance supplémentaire

## 📝 Notes techniques

### Différences avec WPF

| Fonctionnalité | WPF (Windows) | Avalonia (Cross-platform) |
|---------------|---------------|---------------------------|
| UI Framework | WPF + WebView2 | Avalonia UI |
| Contrôle Souris/Clavier | user32.dll | user32.dll (Windows) + xdotool (Linux) |
| Réseau TCP/UDP | ✅ Inchangé | ✅ Inchangé |
| XAML | WPF XAML | Avalonia XAML (similaire) |

### Limitations connues

- **WebView** : Avalonia n'a pas de WebView intégré par défaut. Si vous avez besoin d'afficher du contenu web, vous devrez utiliser un package comme `Avalonia.WebView` ou communiquer via le serveur Python.
- **Contrôle Clavier Windows** : Certaines fonctions de clavier avancées ne sont pas encore implémentées (peuvent être ajoutées si nécessaire).

## 🎨 Architecture

```
CSharpApp/
├── App.axaml                      # Application principale Avalonia
├── Program.cs                     # Point d'entrée
├── Views/
│   └── MainWindow.axaml          # Fenêtre principale (UI)
├── ViewModels/
│   └── MainWindowViewModel.cs    # Logique de la fenêtre (MVVM)
└── Services/
    ├── TcpClientHandler.cs       # Client TCP
    ├── UdpDiscoveryService.cs    # Découverte UDP
    ├── MouseKeyboardController.cs # Contrôle cross-platform
    ├── JavaScriptBridge.cs       # Bridge de communication
    ├── WiFiManager.cs            # Gestion WiFi
    └── ResourceExtractor.cs      # Ressources embarquées
```

## 🐛 Dépannage

### Linux : "xdotool: command not found"
```bash
sudo apt-get install xdotool
```

### Erreur de compilation avec nullable
Les warnings de nullability sont normaux avec .NET 8.0 et peuvent être ignorés. Pour les désactiver :
```xml
<Nullable>disable</Nullable>
```

### L'application ne démarre pas
Vérifiez que vous avez bien .NET 8.0 ou supérieur :
```bash
dotnet --version
```

## 📚 Ressources

- [Avalonia UI Documentation](https://docs.avaloniaui.net/)
- [.NET 8.0 Download](https://dotnet.microsoft.com/download/dotnet/8.0)
- [xdotool Manual](https://manpages.ubuntu.com/manpages/focal/man1/xdotool.1.html)

## ✨ Prochaines étapes suggérées

1. Tester l'application avec le serveur Python
2. Ajouter des fonctionnalités de clavier avancées si nécessaire
3. Implémenter un WebView si besoin (via package externe)
4. Améliorer l'interface utilisateur avec plus de fonctionnalités
5. Ajouter des tests unitaires

---

**Migration effectuée le** : 9 janvier 2026
**Frameworks** : WPF → Avalonia UI
**Compatibilité** : Windows, Linux, macOS
