# Architecture de LighTouch C#

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                     Application WPF (C#)                         │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              MainWindow (WPF Window)                      │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │           WebView2 Control                       │    │   │
│  │  │  ┌──────────────────────────────────────────┐  │    │   │
│  │  │  │    Frontend (HTML/CSS/JS)                │  │    │   │
│  │  │  │  - index.html                            │  │    │   │
│  │  │  │  - renderer.js                           │  │    │   │
│  │  │  │  - style.css                             │  │    │   │
│  │  │  │  - webview-adapter.js ← PONT             │  │    │   │
│  │  │  └──────────────────────────────────────────┘  │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↕                                   │
│              chrome.webview.hostObjects.electronAPI             │
│                              ↕                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           JavaScriptBridge.cs (COM Visible)              │   │
│  │  - Expose les APIs C# à JavaScript                       │   │
│  │  - Reçoit les appels depuis le frontend                  │   │
│  │  - Envoie les messages Bluetooth au frontend             │   │
│  └─────────────────────────────────────────────────────────┘   │
│         ↓              ↓              ↓              ↓          │
│  ┌──────────┐  ┌──────────────┐  ┌─────────┐  ┌──────────┐   │
│  │Bluetooth │  │Mouse/Keyboard│  │  WiFi   │  │ Settings │   │
│  │Handler   │  │Controller    │  │ Manager │  │ (Local)  │   │
│  └──────────┘  └──────────────┘  └─────────┘  └──────────┘   │
│       ↕              ↕                 ↕                        │
└───────┼──────────────┼─────────────────┼────────────────────────┘
        ↓              ↓                 ↓
   [Bluetooth]    [Win32 API]     [netsh/QRCoder]
   [COM Port]     [User Input]    [WiFi Info]
```

## Flux de données

### 1. Bluetooth → Frontend

```
Appareil Bluetooth
    ↓
Port COM (Windows)
    ↓
BluetoothHandler.cs
    ↓ (Event MessageReceived)
JavaScriptBridge.cs
    ↓ (ExecuteScriptAsync)
window.handleBluetoothMessage()
    ↓
renderer.js (readMessage)
    ↓
Actions.js / Settings.js
```

### 2. Frontend → Contrôle Système

```
renderer.js / Actions.js
    ↓
window.electronAPI.moveMouse(x, y)
    ↓
webview-adapter.js
    ↓
chrome.webview.hostObjects.electronAPI
    ↓
JavaScriptBridge.cs
    ↓
MouseKeyboardController.cs
    ↓
Win32 API (SetCursorPos, mouse_event, SendKeys)
```

### 3. WiFi QR Code

```
Frontend (wifi-qr.html)
    ↓
window.electronAPI.refreshWiFi()
    ↓
JavaScriptBridge.cs
    ↓
WiFiManager.cs
    ↓
netsh wlan show interfaces
    ↓
Parse et retour JSON
    ↓
QRCoder (génération QR)
    ↓
Base64 image → Frontend
```

## Composants détaillés

### MainWindow.xaml.cs
**Rôle** : Point d'entrée, initialisation
- Crée la fenêtre WPF
- Initialise WebView2
- Instancie tous les handlers
- Charge le HTML depuis wwwroot/
- Expose JavaScriptBridge à JavaScript

### JavaScriptBridge.cs
**Rôle** : Pont bidirectionnel JS ↔ C#
- Marqué `[ComVisible(true)]` pour être accessible depuis JS
- Expose toutes les méthodes utilisées par le frontend
- Gère les événements Bluetooth et les transmet au frontend
- Méthodes principales :
  - `SendToPython(string)` : Envoie commande Bluetooth
  - `MoveMouse(x, y)` : Déplace la souris
  - `PressMouse/ReleaseMouse()` : Clics souris
  - `PressKey(string)` : Presse une touche
  - `GenerateWiFiQR()` : Génère QR code
  - `RefreshWiFi()` : Récupère infos WiFi

### BluetoothHandler.cs
**Rôle** : Communication Bluetooth
- Détection automatique des ports COM Bluetooth
- Connexion/reconnexion automatique
- Lecture des messages (ligne par ligne)
- Envoi de commandes
- Event `MessageReceived` pour notifier JavaScriptBridge

**Logique de connexion** :
1. Liste tous les ports COM
2. Essaie d'ouvrir chaque port
3. Se connecte au premier disponible
4. Si déconnexion, réessaye toutes les 10 secondes

### MouseKeyboardController.cs
**Rôle** : Contrôle souris/clavier via Win32 API
- `MoveMouse(x, y)` : `SetCursorPos()`
- `PressMouse/ReleaseMouse()` : `mouse_event()`
- `PressKey(key)` : `SendKeys.SendWait()`
- Gère les touches spéciales (Arrow*, F1-F12, etc.)
- Supporte les clics sans position (position actuelle)

### WiFiManager.cs
**Rôle** : Gestion WiFi et QR codes
- Exécute `netsh wlan show interfaces`
- Parse la sortie (FR/EN)
- Récupère mot de passe : `netsh wlan show profile "SSID" key=clear`
- Génère QR code avec QRCoder
- Retourne image en base64

### webview-adapter.js
**Rôle** : Compatibilité avec code Electron existant
- Attend que `chrome.webview.hostObjects` soit prêt
- Crée un objet `window.electronAPI` compatible
- Mappe les appels sync/async
- Gère l'événement `onPythonData` via callback

## Différences clés avec Electron

| Aspect | Electron | C# + WebView2 |
|--------|----------|---------------|
| **IPC** | ipcRenderer/ipcMain | chrome.webview.hostObjects |
| **Async** | Promesses natives | COM async (via adapter) |
| **Backend** | Node.js + Python | 100% C# |
| **Bluetooth** | Python (serialport) | C# (System.IO.Ports) |
| **Souris/Clavier** | @nut-tree-fork/nut-js | Win32 API |
| **Packaging** | electron-builder | dotnet publish |
| **Runtime** | Chromium embarqué | WebView2 système |

## Sécurité

### WebView2
- Context isolation par défaut
- Pas d'accès direct à Node.js
- APIs exposées explicitement via COM

### Permissions
- Bluetooth : Requiert appareil appairé Windows
- Clavier/Souris : Certaines touches nécessitent admin
- WiFi : Lecture seule des informations

## Performance

### Taille
- **Electron** : ~200 MB (Chromium + Node.js)
- **C# WebView2** : ~50 MB (utilise WebView2 système)

### Démarrage
- **Electron** : 2-4 secondes
- **C# WebView2** : 1-2 secondes

### Mémoire
- **Electron** : ~150-200 MB
- **C# WebView2** : ~80-120 MB

## Extensions futures possibles

### Facile à ajouter
- Base de données locale (SQLite)
- Logs structurés (Serilog)
- Notifications Windows natives
- Auto-updates (Squirrel.Windows)
- Tests unitaires (xUnit)

### Modifications du frontend
Aucune modification nécessaire ! Le code JS existant fonctionne tel quel grâce à `webview-adapter.js`.

## Debugging

### C# (Backend)
```csharp
Console.WriteLine("Debug info");  // Visible dans la console
```

### JavaScript (Frontend)
```javascript
console.log("Debug info");  // Visible dans DevTools
```

Ouvrir DevTools : **Ctrl+Shift+I** ou **F12**

## Dépendances NuGet

| Package | Version | Usage |
|---------|---------|-------|
| Microsoft.Web.WebView2 | 1.0.2592.51 | Hébergement web |
| System.IO.Ports | 8.0.0 | Communication série |
| QRCoder | 1.6.0 | Génération QR codes |

## Questions fréquentes

**Q: Dois-je modifier mon code JavaScript existant ?**
A: Non ! L'adapter WebView2 assure la compatibilité.

**Q: Puis-je utiliser plusieurs appareils Bluetooth ?**
A: Actuellement, le code se connecte au premier port disponible. Vous pouvez modifier `BluetoothHandler.cs` pour cibler un port spécifique.

**Q: L'application fonctionne-t-elle sur Linux/Mac ?**
A: Non, cette version utilise des APIs Windows (Win32, WebView2). Pour le cross-platform, il faudrait utiliser Avalonia UI + CefSharp.

**Q: Puis-je créer un installeur ?**
A: Oui ! Utilisez WiX Toolset ou Inno Setup pour créer un MSI/EXE d'installation.
