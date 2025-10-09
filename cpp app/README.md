# LighTouch C++ Application

**🎉 Migration COMPLÈTE d'Electron + Python vers C++ pur avec Qt6 !**

Version: **2.0.0** (Full C++ Rewrite)

## 🚀 Features

### ✅ Interface Graphique
- ✨ Fenêtre principale avec statut device
- ✨ Calibration plein écran (ESC pour annuler)
- ✨ Settings complets (8+ paramètres)
- ✨ Onboarding pour nouveaux utilisateurs
- ✨ **Key Bindings personnalisables**
- ✨ **Toast/Notifications animées**

### ✅ Communication
- 📡 Bluetooth cross-platform (Windows/Linux)
- 🔄 Auto-reconnexion (10s interval)
- 📨 Messages JSON bidirectionnels
- 🔌 Détection automatique ports

### ✅ Accessibilité
- 🔊 **Screen Reader** (lecture vocale)
- 📏 **Taille texte ajustable** (3 tailles)
- ⏸️ **Pause globale** (Spacebar)
- 🌍 Multi-langue (FR/EN)
- 🌙 Thème Dark/Light

### ✅ Modes Spéciaux
- 🎤 **Mode Présentation** optimisé
- ⚙️ **Paramètres persistants** (QSettings)
- 🎯 **Actions personnalisables**

---

## 📊 Performance vs Electron

| Métrique | Electron + Python | C++ Qt6 | Amélioration |
|----------|-------------------|---------|--------------|
| **Taille** | ~230 MB | ~25 MB | **9x plus léger** |
| **RAM** | ~250 MB | ~40 MB | **6x moins** |
| **Démarrage** | 3-5s | <1s | **5x plus rapide** |
| **Runtime** | Node.js + Python | Natif | **Performance native** |

---

## 📁 Structure du Projet

```
cpp app/
├── CMakeLists.txt          # CMake build configuration
├── src/                    # Source files
│   ├── main.cpp           # Application entry point
│   ├── gui/               # GUI components
│   │   ├── MainWindow.cpp
│   │   ├── CalibrationWindow.cpp
│   │   ├── SettingsWindow.cpp
│   │   └── OnboardingWindow.cpp
│   ├── bluetooth/         # Bluetooth communication
│   │   ├── BluetoothManager.cpp
│   │   ├── WindowsBluetooth.cpp
│   │   └── LinuxBluetooth.cpp
│   ├── core/              # Business logic
│   │   ├── DeviceController.cpp
│   │   └── ActionManager.cpp
│   └── utils/             # Utilities
│       ├── MessageBuilder.cpp
│       └── Settings.cpp
├── include/               # Header files
│   ├── gui/
│   ├── bluetooth/
│   ├── core/
│   └── utils/
└── resources/             # Resources (images, fonts, etc.)
    └── resources.qrc
```

## Prerequisites

### Windows
- Qt6 (with Widgets, SerialPort, Bluetooth modules)
- CMake 3.16+
- Visual Studio 2019/2022 or MinGW

### Linux
- Qt6 development packages
- CMake 3.16+
- GCC or Clang
- libbluetooth-dev (optional, for native Bluetooth)

## Building

### Windows (Visual Studio)

```bash
mkdir build
cd build
cmake .. -G "Visual Studio 17 2022"
cmake --build . --config Release
```

### Windows (MinGW)

```bash
mkdir build
cd build
cmake .. -G "MinGW Makefiles"
cmake --build .
```

### Linux

```bash
mkdir build
cd build
cmake ..
make -j$(nproc)
```

## Installation

### Qt6 Installation

**Windows:**
```bash
# Using Qt Online Installer
# Download from: https://www.qt.io/download-qt-installer
# Select: Qt 6.x -> Desktop gcc/MSVC

# Or use vcpkg:
vcpkg install qt6-base qt6-serialport
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install qt6-base-dev qt6-serialport-dev libqt6bluetooth6-dev
sudo apt install cmake build-essential
```

**Linux (Arch):**
```bash
sudo pacman -S qt6-base qt6-serialport cmake
```

## Running

After building, the executable will be in:
- Windows: `build/Release/LighTouch.exe`
- Linux: `build/LighTouch`

## Features

✅ **Implemented:**
- Cross-platform Bluetooth communication (via Qt SerialPort)
- Main window with device status
- Calibration window (fullscreen)
- Settings window (language, theme, dominant hand)
- Onboarding wizard for first run
- Dark/Light theme support
- Multi-language support (French/English)
- Persistent settings storage
- Auto-reconnect on device disconnect

🚧 **To be implemented:**
- Key binding configuration
- Action system (gesture → keyboard/mouse actions)
- Advanced Bluetooth features (device pairing UI)

## Configuration

Settings are stored using Qt's QSettings:
- **Windows**: Registry (`HKEY_CURRENT_USER\Software\LighTouch\LighTouch`)
- **Linux**: `~/.config/LighTouch/LighTouch.conf`

## Bluetooth Communication

The application communicates with the LighTouch Raspberry Pi device via Bluetooth Serial Port Profile (SPP).

**Message Format:**
```json
{
  "category": "screen|settings|...",
  "method": "start_calibration|set_dominant_hand|...",
  "params": {
    "value": "..."
  }
}
```

## Troubleshooting

### No Bluetooth device found
- **Windows**: Check Device Manager for COM ports with "Bluetooth" in the name
- **Linux**: Check `ls /dev/rfcomm*` or `ls /dev/ttyUSB*`

### Qt not found
- Ensure Qt6 is in your PATH or set `CMAKE_PREFIX_PATH`:
  ```bash
  cmake .. -DCMAKE_PREFIX_PATH=/path/to/Qt/6.x/compiler
  ```

## License

GPL-3.0 - See LICENSE file

## Authors

- Jérémy Calosso-Merlino
- Benjamin Cottone
- Fabien Gelorse
- Nathan Tranchant
- Arnaud Vitale
