# Guide de Démarrage Rapide - LighTouch C++

## Installation de Qt6 sur Windows

### Méthode 1 : Qt Online Installer (Recommandé)

1. **Télécharger l'installeur**
   - Allez sur https://www.qt.io/download-qt-installer
   - Créez un compte gratuit (open source)

2. **Installer Qt6**
   - Lancez l'installeur
   - Sélectionnez : `Qt 6.8.0` (ou version la plus récente)
   - Cochez :
     - ✅ MSVC 2019 64-bit (ou 2022)
     - ✅ MinGW 64-bit
     - ✅ Qt SerialPort
     - ✅ Qt Bluetooth
     - ✅ CMake
     - ✅ Ninja

3. **Configurer l'environnement**
   ```batch
   set PATH=C:\Qt\6.8.0\msvc2019_64\bin;%PATH%
   set CMAKE_PREFIX_PATH=C:\Qt\6.8.0\msvc2019_64
   ```

### Méthode 2 : vcpkg

```powershell
# Installer vcpkg
git clone https://github.com/Microsoft/vcpkg.git
cd vcpkg
.\bootstrap-vcpkg.bat

# Installer Qt6
.\vcpkg install qt6-base:x64-windows
.\vcpkg install qt6-serialport:x64-windows
.\vcpkg integrate install
```

## Installation de Qt6 sur Linux

### Ubuntu/Debian

```bash
sudo apt update
sudo apt install -y qt6-base-dev qt6-serialport-dev libqt6bluetooth6-dev
sudo apt install -y cmake build-essential git
```

### Arch Linux

```bash
sudo pacman -S qt6-base qt6-serialport cmake base-devel
```

### Fedora

```bash
sudo dnf install qt6-qtbase-devel qt6-qtserialport-devel cmake gcc-c++
```

## Compilation

### Windows (PowerShell)

```powershell
# Cloner le dépôt (si pas déjà fait)
cd "C:\Users\Arnaud\Desktop\repo-git\epitech projects\EIP\Software\cpp app"

# Créer et entrer dans le dossier build
mkdir build
cd build

# Configurer avec CMake
cmake .. -G "Visual Studio 17 2022"

# Compiler
cmake --build . --config Release

# L'exécutable sera dans : build\Release\LighTouch.exe
```

### Windows (Script automatique)

```batch
cd "C:\Users\Arnaud\Desktop\repo-git\epitech projects\EIP\Software\cpp app"
build.bat
```

### Linux

```bash
cd ~/path/to/Software/cpp app

# Rendre le script exécutable
chmod +x build.sh

# Compiler
./build.sh

# Ou manuellement :
mkdir build && cd build
cmake ..
make -j$(nproc)

# L'exécutable sera dans : build/LighTouch
```

## Exécution

### Windows

```powershell
cd build\Release
.\LighTouch.exe
```

### Linux

```bash
cd build
./LighTouch
```

## Problèmes Fréquents

### Erreur : "Qt6 not found"

**Solution :**
```bash
# Windows (PowerShell)
$env:CMAKE_PREFIX_PATH="C:\Qt\6.8.0\msvc2019_64"

# Linux
export CMAKE_PREFIX_PATH=/usr/lib/qt6
```

### Erreur : "No Bluetooth device found"

**Windows :**
1. Ouvrir le Gestionnaire de périphériques
2. Vérifier la présence de ports COM Bluetooth
3. S'assurer que le dispositif est appairé

**Linux :**
1. Vérifier : `ls /dev/rfcomm*` ou `ls /dev/ttyUSB*`
2. Donner les permissions : `sudo usermod -a -G dialout $USER`
3. Redémarrer la session

### Erreur de compilation : "moc not found"

Qt MOC (Meta-Object Compiler) manquant. Assurez-vous que Qt bin est dans votre PATH :

```bash
# Windows
set PATH=C:\Qt\6.8.0\msvc2019_64\bin;%PATH%

# Linux
export PATH=/usr/lib/qt6/bin:$PATH
```

## Structure du Projet Compilé

```
build/
├── Release/              # Windows (Release build)
│   └── LighTouch.exe
├── Debug/                # Windows (Debug build)
│   └── LighTouch.exe
└── LighTouch             # Linux
```

## Configuration Développement (VSCode)

Créer `.vscode/settings.json` :

```json
{
  "cmake.configureOnOpen": true,
  "cmake.preferredGenerators": [
    "Visual Studio 17 2022",
    "Unix Makefiles"
  ],
  "C_Cpp.default.configurationProvider": "ms-vscode.cmake-tools"
}
```

## Debugging

### VSCode

1. Installer l'extension "C/C++"
2. Installer l'extension "CMake Tools"
3. Ouvrir le dossier `cpp app`
4. F5 pour débugger

### Qt Creator

1. Ouvrir `CMakeLists.txt` dans Qt Creator
2. Configurer le kit Qt6
3. Compiler et débugger directement

## Tests

Pour tester l'application sans dispositif Bluetooth :
- L'application se lancera et tentera de se connecter
- Les fonctionnalités GUI seront disponibles
- Messages de reconnexion apparaîtront toutes les 10 secondes

## Prochaines Étapes

1. ✅ Compiler l'application
2. ✅ Tester l'interface graphique
3. ⏳ Connecter le dispositif Bluetooth LighTouch
4. ⏳ Tester la calibration
5. ⏳ Configurer les paramètres

## Support

Pour toute question ou problème :
- GitHub Issues : https://github.com/LighTouchOrg/Software/issues
- Documentation Qt : https://doc.qt.io/qt-6/
