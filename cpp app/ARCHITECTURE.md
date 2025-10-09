# Architecture Technique - LighTouch C++

## Vue d'ensemble

```
┌──────────────────────────────────────────────────────────────┐
│                      Application Layer                        │
│                         (main.cpp)                            │
│                      QApplication                             │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                      GUI Layer (Qt Widgets)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ MainWindow   │  │ Calibration  │  │  Settings    │       │
│  │              │  │   Window     │  │   Window     │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                  │                  │               │
│         └──────────────────┼──────────────────┘               │
│                            │                                  │
└────────────────────────────┼──────────────────────────────────┘
                             │ Signals/Slots
                             ↓
┌──────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                       │
│  ┌──────────────────────────────────────────────────────┐    │
│  │            DeviceController (Core)                   │    │
│  │  - Gestion état device                               │    │
│  │  - Orchestration calibration                         │    │
│  │  - Actions management                                │    │
│  └─────────────────┬───────────────┬────────────────────┘    │
│                    │               │                          │
│         ┌──────────┴─────┐    ┌───┴─────────┐                │
│         │ ActionManager  │    │  Settings   │                │
│         │ (Future)       │    │  (QSettings)│                │
│         └────────────────┘    └─────────────┘                │
└────────────────────────────────┬─────────────────────────────┘
                                 │
                                 ↓
┌──────────────────────────────────────────────────────────────┐
│                  Communication Layer                          │
│  ┌──────────────────────────────────────────────────────┐    │
│  │         BluetoothManager (Qt SerialPort)             │    │
│  │  - Détection port COM/rfcomm                         │    │
│  │  - Communication série asynchrone                    │    │
│  │  - Auto-reconnexion                                  │    │
│  │  - Gestion erreurs                                   │    │
│  └─────────────────┬────────────────────────────────────┘    │
│                    │                                          │
│         ┌──────────┴─────────────┐                            │
│         │   MessageBuilder       │                            │
│         │   (JSON Messages)      │                            │
│         └────────────────────────┘                            │
└────────────────────────────┬─────────────────────────────────┘
                             │ Serial Bluetooth
                             ↓
┌──────────────────────────────────────────────────────────────┐
│              LighTouch Device (Raspberry Pi)                  │
└──────────────────────────────────────────────────────────────┘
```

---

## Composants Principaux

### 1. Application Layer

#### `main.cpp`
Point d'entrée de l'application.

**Responsabilités :**
- Initialisation QApplication
- Configuration application (nom, version, icône)
- Création et affichage MainWindow
- Boucle d'événements Qt

**Code clé :**
```cpp
QApplication app(argc, argv);
MainWindow mainWindow;
mainWindow.show();
return app.exec();
```

---

### 2. GUI Layer

#### `MainWindow`
Fenêtre principale de l'application.

**Responsabilités :**
- Affichage statut device
- Boutons navigation (Calibrer, Settings, Key Bindings)
- Toggle thème (Dark/Light)
- Toggle langue (FR/EN)
- Gestion touches clavier (Space = Enable/Disable)

**Signaux émis :**
- Aucun (fenêtre principale)

**Slots connectés :**
- `deviceConnected()` ← DeviceController
- `deviceDisconnected()` ← DeviceController
- `deviceStatusChanged(QString)` ← DeviceController

#### `CalibrationWindow`
Fenêtre de calibration en plein écran.

**Responsabilités :**
- Affichage instructions calibration
- Gestion touches (Échap pour annuler)
- Communication avec device via DeviceController
- Fermeture automatique à la fin

**Signaux émis :**
- `closed()` → MainWindow

**Slots connectés :**
- `calibrationCompleted()` ← DeviceController
- `bluetoothDataReceived(QString)` ← DeviceController

#### `SettingsWindow`
Fenêtre de configuration.

**Responsabilités :**
- Sélection main dominante
- Sélection langue
- Sélection thème
- Sauvegarde persistante (QSettings)

**Signaux émis :**
- Aucun

**Slots :**
- `onDominantHandChanged(int)`
- `onLanguageChanged(int)`
- `onThemeChanged(int)`

#### `OnboardingWindow`
Assistant de première utilisation.

**Responsabilités :**
- Guide utilisateur nouveau
- Configuration initiale (main dominante)
- Navigation multi-pages

**Signaux émis :**
- `finished()` → MainWindow

---

### 3. Business Logic Layer

#### `DeviceController`
Contrôleur principal orchestrant toute la logique métier.

**Responsabilités :**
- Gestion état connexion device
- Orchestration calibration
- Gestion des settings via classe Settings
- Bridge entre GUI et Bluetooth
- Traitement données Bluetooth

**Signaux émis :**
- `deviceConnected()`
- `deviceDisconnected()`
- `calibrationStarted()`
- `calibrationCompleted()`
- `calibrationFailed()`
- `bluetoothDataReceived(QString)`
- `deviceStatusChanged(QString)`

**Méthodes publiques :**
```cpp
bool isDeviceConnected() const;
void startCalibration();
void stopCalibration();
void completeCalibration();
void setDominantHand(const QString& hand);
void enableActions(bool enabled);
```

#### `Settings`
Gestion de la configuration persistante (QSettings).

**Stockage :**
- Windows : Registre `HKEY_CURRENT_USER\Software\LighTouch`
- Linux : `~/.config/LighTouch/LighTouch.conf`

**Données stockées :**
```cpp
QString language;              // "fr" | "en"
QString deviceStatusString;    // "device_connected" | ...
QColor statusColorLight;       // Couleur status mode clair
QColor statusColorDark;        // Couleur status mode sombre
QString dominantHand;          // "left" | "right"
bool darkMode;                 // true | false
bool actionsEnabled;           // true | false
bool firstRun;                 // true | false
```

#### `ActionManager`
Gestionnaire d'actions (futur).

**Responsabilités futures :**
- Binding gestes → actions clavier/souris
- Exécution actions
- Configuration raccourcis

---

### 4. Communication Layer

#### `BluetoothManager`
Gestionnaire de communication Bluetooth série.

**Responsabilités :**
- Détection automatique port Bluetooth
- Ouverture/fermeture connexion série
- Envoi/réception messages
- Gestion erreurs et déconnexions
- Reconnexion automatique (timer 10s)

**Configuration série :**
```cpp
BaudRate: 9600
DataBits: 8
Parity: None
StopBits: 1
FlowControl: None
```

**Détection port :**
- **Windows** : Recherche ports contenant "BTHENUM" (exclut 000000000000)
- **Linux** : Recherche `/dev/rfcomm*` ou `/dev/ttyUSB*`

**Signaux émis :**
- `connected()`
- `disconnected()`
- `dataReceived(QString)`
- `errorOccurred(QString)`

**Méthodes publiques :**
```cpp
void startConnection();
void stopConnection();
bool sendMessage(const QString& message);
bool isConnected() const;
QString findBluetoothPort();
```

#### `MessageBuilder`
Construction et parsing de messages JSON.

**Format messages :**
```json
{
  "category": "screen|settings",
  "method": "start_calibration|set_dominant_hand|...",
  "params": {
    "value": "..."
  }
}
```

**Méthodes statiques :**
```cpp
QString buildMessage(const QString& category, 
                     const QString& method, 
                     const QString& params);
QString buildMessage(const QString& category, 
                     const QString& method, 
                     bool value);
QJsonObject parseMessage(const QString& message);
bool isValidMessage(const QString& message);
```

---

## Flux de Données

### 1. Démarrage Application

```
main()
  └─> QApplication::exec()
      └─> MainWindow::MainWindow()
          ├─> DeviceController::DeviceController()
          │   └─> BluetoothManager::startConnection()
          │       └─> findBluetoothPort()
          │           └─> QSerialPort::open()
          │               └─> emit connected()
          └─> setupUI()
```

### 2. Calibration Flow

```
User clicks "Calibrer"
  └─> MainWindow::onCalibrateClicked()
      ├─> new CalibrationWindow()
      │   └─> DeviceController::startCalibration()
      │       └─> MessageBuilder::buildMessage("screen", "start_calibration", "")
      │           └─> BluetoothManager::sendMessage()
      │               └─> QSerialPort::write()
      │
      └─> CalibrationWindow::showFullScreen()

Device sends "CLOSE_CALIBRATION_WINDOW"
  └─> BluetoothManager::handleReadyRead()
      └─> emit dataReceived("CLOSE_CALIBRATION_WINDOW")
          └─> DeviceController::handleBluetoothData()
              └─> DeviceController::completeCalibration()
                  └─> emit calibrationCompleted()
                      └─> CalibrationWindow::handleCalibrationComplete()
                          └─> close()
```

### 3. Settings Change

```
User changes dominant hand in SettingsWindow
  └─> SettingsWindow::onDominantHandChanged()
      ├─> Settings::setDominantHand("left")
      │   └─> QSettings::setValue("dominantHand", "left")
      │
      └─> DeviceController::setDominantHand("left")
          └─> MessageBuilder::buildMessage("settings", "set_dominant_hand", "left")
              └─> BluetoothManager::sendMessage()
                  └─> QSerialPort::write()
```

### 4. Bluetooth Reconnection

```
Device disconnected
  └─> QSerialPort::errorOccurred(ResourceError)
      └─> BluetoothManager::handleError()
          ├─> closeConnection()
          ├─> emit disconnected()
          │   └─> DeviceController::handleBluetoothDisconnected()
          │       └─> emit deviceStatusChanged("device_not_connected")
          │           └─> MainWindow::updateDeviceStatus()
          │
          └─> reconnectTimer->start() // 10s
              └─> [10 secondes plus tard]
                  └─> BluetoothManager::retryConnection()
                      └─> startConnection()
```

---

## Threading Model

**Single-threaded (main GUI thread)**

Tous les composants s'exécutent dans le thread principal Qt (GUI thread).

**Opérations asynchrones :**
- QSerialPort : I/O asynchrone via event loop Qt
- QTimer : Callbacks sur event loop
- Signals/Slots : Communication asynchrone intra-thread

**Avantages :**
- Simplicité (pas de mutex, pas de race conditions)
- Sécurité thread GUI (tous les widgets dans main thread)
- Performance suffisante (I/O série non bloquant)

**Note :** Si nécessaire, on peut migrer BluetoothManager vers un thread séparé en utilisant `QThread` et `moveToThread()`.

---

## Gestion Mémoire

### Ownership (Qt Parent-Child)

Qt utilise un système de parent-child pour gérer automatiquement la mémoire :

```cpp
// Parent-child relationships
MainWindow (root)
  └─> DeviceController (parent: MainWindow)
      └─> BluetoothManager (parent: DeviceController)
          └─> QSerialPort (parent: BluetoothManager)
              └─> QTimer (parent: BluetoothManager)

// Lors de delete MainWindow:
// Tous les enfants sont automatiquement détruits
```

### Smart Pointers

Non utilisés car Qt parent-child gère tout.

### Allocation manuelle

```cpp
// CalibrationWindow
calibrationWindow = new CalibrationWindow(...);
calibrationWindow->setAttribute(Qt::WA_DeleteOnClose);
// Sera automatiquement delete lors du close()
```

---

## Gestion Erreurs

### Bluetooth Errors

```cpp
void handleError(QSerialPort::SerialPortError error) {
    switch (error) {
        case QSerialPort::NoError:
        case QSerialPort::TimeoutError:
            // Ignore
            break;
        
        case QSerialPort::ResourceError:
        case QSerialPort::DeviceNotFoundError:
            // Device disconnected
            closeConnection();
            emit errorOccurred("Device disconnected");
            startReconnectTimer();
            break;
        
        default:
            // Log error
            qWarning() << "Serial error:" << error;
            break;
    }
}
```

### JSON Parsing Errors

```cpp
bool MessageBuilder::isValidMessage(const QString& message) {
    QJsonParseError error;
    QJsonDocument doc = QJsonDocument::fromJson(message.toUtf8(), &error);
    
    if (error.error != QJsonParseError::NoError) {
        qWarning() << "JSON parse error:" << error.errorString();
        return false;
    }
    
    return doc.isObject();
}
```

---

## Configuration Build

### CMake Options

```cmake
# Debug build
cmake .. -DCMAKE_BUILD_TYPE=Debug

# Release build (optimisé)
cmake .. -DCMAKE_BUILD_TYPE=Release

# Avec Qt custom path
cmake .. -DCMAKE_PREFIX_PATH=/path/to/Qt/6.x/compiler
```

### Compilation Flags

```cmake
set(CMAKE_CXX_STANDARD 17)        # C++17
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)             # Qt MOC automatique
set(CMAKE_AUTORCC ON)             # Qt Resources
set(CMAKE_AUTOUIC ON)             # Qt UI files
```

---

## Performance

### Optimisations appliquées

1. **Compilation :**
   - Release mode : `-O2` ou `-O3`
   - Link Time Optimization (LTO)

2. **Qt :**
   - Signals/Slots compilés (pas de `SIGNAL()` macros)
   - Qt Creator profiler compatible

3. **Mémoire :**
   - Parent-child ownership (pas de fuites)
   - Smart reuse de windows (Settings, etc.)

### Profiling

```bash
# Valgrind (Linux)
valgrind --leak-check=full ./LighTouch

# Qt Creator Profiler
# Ouvrir avec Qt Creator et utiliser Analyze > QML Profiler
```

---

## Tests

### Tests manuels actuels

- ✅ Lancement application
- ✅ Affichage MainWindow
- ✅ Toggle thème
- ✅ Toggle langue
- ✅ Ouverture Settings
- ✅ Ouverture Calibration
- ⏳ Communication Bluetooth (nécessite device)

### Tests futurs (Qt Test Framework)

```cpp
#include <QtTest/QtTest>

class TestBluetoothManager : public QObject {
    Q_OBJECT
private slots:
    void testPortDetection();
    void testMessageSending();
    void testReconnection();
};
```

---

## Maintenance et Extensions

### Ajouter une nouvelle fenêtre

1. Créer header dans `include/gui/NewWindow.h`
2. Créer source dans `src/gui/NewWindow.cpp`
3. Ajouter dans `CMakeLists.txt` (SOURCES et HEADERS)
4. Instancier dans `MainWindow`

### Ajouter une nouvelle commande Bluetooth

1. Ajouter méthode dans `DeviceController`
2. Utiliser `MessageBuilder::buildMessage()`
3. Appeler `BluetoothManager::sendMessage()`

### Ajouter un nouveau setting

1. Ajouter getter/setter dans `Settings.h`
2. Implémenter dans `Settings.cpp` avec `QSettings`
3. Exposer dans `SettingsWindow` si nécessaire

---

## Diagramme de Classes (Simplifié)

```
QMainWindow                    QWidget
    ↑                             ↑
    │                             │
MainWindow ──────────────→ CalibrationWindow
    │                             │
    │                             │
    ├──→ DeviceController ←───────┘
    │         │
    │         ├──→ BluetoothManager
    │         │         │
    │         │         └──→ QSerialPort
    │         │         └──→ QTimer
    │         │
    │         └──→ Settings
    │                  └──→ QSettings
    │
    ├──→ SettingsWindow
    │
    └──→ OnboardingWindow

MessageBuilder (static utility class)
ActionManager (future)
```

---

## Conclusion

Cette architecture C++ est :
- **Modulaire** : Séparation claire GUI / Logic / Communication
- **Maintenable** : Code bien structuré et documenté
- **Extensible** : Facile d'ajouter features
- **Performante** : Code natif optimisé
- **Cross-platform** : Qt6 gère tout
