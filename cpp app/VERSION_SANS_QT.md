# 🚀 Version SANS Qt - 100% Native Windows

## Pourquoi cette version ?

- ❌ Qt trop lourd (~4 GB)
- ❌ Installation complexe
- ❌ Dépendances multiples
- ❌ SerialPort manquant dans certaines installations

## ✅ Alternative Native

**Stack technique simplifié :**
- **GUI** : Win32 API native (au lieu de Qt Widgets)
- **Bluetooth** : Windows Bluetooth API (au lieu de Qt SerialPort)
- **Settings** : Windows Registry API (au lieu de QSettings)
- **JSON** : nlohmann/json (header-only, pas de lib externe)

---

## 📦 Dépendances Minimales

```
✅ MinGW (g++) - DÉJÀ INSTALLÉ
✅ CMake - DÉJÀ INSTALLÉ
✅ Windows SDK (inclus dans Windows)
```

**Taille totale : ~0 MB (tout est déjà là !)**

---

## 🏗️ Architecture Simplifiée

### Au lieu de Qt :

| Fonctionnalité | Qt (avant) | Native Windows (après) |
|----------------|------------|------------------------|
| **Fenêtres** | QMainWindow | CreateWindow (Win32) |
| **Boutons** | QPushButton | CreateWindow("BUTTON") |
| **Bluetooth** | QSerialPort | CreateFile("\\\\.\\COMx") |
| **Settings** | QSettings | RegCreateKeyEx (Registry) |
| **JSON** | Qt JSON | nlohmann/json |
| **Threads** | QThread | std::thread (C++11) |

---

## 📝 Fichiers à créer (Version simplifiée)

```
cpp app (native)/
├── CMakeLists.txt          # Build simplifié
├── src/
│   ├── main.cpp            # Entry point Win32
│   ├── MainWindow.cpp      # Win32 window
│   ├── BluetoothSerial.cpp # Win32 COM port
│   ├── Settings.cpp        # Windows Registry
│   └── MessageBuilder.cpp  # JSON (nlohmann)
└── include/
    ├── MainWindow.h
    ├── BluetoothSerial.h
    ├── Settings.h
    └── json.hpp            # Header-only (1 fichier)
```

**Total : ~10 fichiers au lieu de 35 !**

---

## 🔧 CMakeLists.txt Simplifié

```cmake
cmake_minimum_required(VERSION 3.16)
project(LighTouch)

set(CMAKE_CXX_STANDARD 17)

# Pas de Qt !
add_executable(LighTouch WIN32
    src/main.cpp
    src/MainWindow.cpp
    src/BluetoothSerial.cpp
    src/Settings.cpp
    src/MessageBuilder.cpp
)

# Seulement des libs Windows natives
target_link_libraries(LighTouch
    ws2_32      # Winsock (networking)
    advapi32    # Registry API
    user32      # Window API
    gdi32       # Graphics
    comctl32    # Common controls
)
```

---

## 📊 Comparaison Tailles

| Métrique | Version Qt | Version Native |
|----------|-----------|----------------|
| **Dépendances** | Qt6 (~4 GB) | Windows SDK (0 MB - déjà là) |
| **Fichiers sources** | 35 fichiers | 10 fichiers |
| **Executable** | ~5 MB + DLLs Qt (~30 MB) | ~500 KB |
| **RAM usage** | ~50 MB | ~10 MB |
| **Temps compilation** | 2-3 min | 10-20 sec |

---

## 🚀 Voulez-vous que je crée cette version ?

**Option A : Version Console Simple (10 min)**
- Interface en ligne de commande
- Bluetooth fonctionnel
- Calibration basique
- Pas de GUI graphique

**Option B : Version Win32 GUI (30 min)**
- Interface graphique native (comme Qt mais plus légère)
- Tous les boutons/fenêtres
- Design Windows natif

**Option C : Réparer Qt SerialPort (15 min)**
- Installer le module manquant via Qt Maintenance Tool
- Compiler avec Qt comme prévu

---

## 💡 Ma Recommandation

**Si vous voulez juste tester le Bluetooth rapidement → Option A (Console)**

C'est la solution la plus rapide pour avoir quelque chose qui fonctionne MAINTENANT.

**Dites-moi quelle option vous préférez !** 😊
