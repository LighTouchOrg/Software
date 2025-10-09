# 📦 Installation des Dépendances - LighTouch C++

## 🎯 Ce dont vous avez besoin

Pour compiler l'application LighTouch C++, vous devez installer :

1. ✅ **CMake** - Déjà installé ✓
2. ✅ **Ninja** - Déjà installé ✓
3. ❌ **Compilateur C++** (g++, clang++, ou MSVC)
4. ❌ **Qt6** (avec Widgets + SerialPort)

---

## 🚀 **Option 1 : Qt6 avec MinGW (RECOMMANDÉ - Tout en un)**

C'est la solution la plus simple car **Qt6 inclut MinGW** !

### Étape 1 : Télécharger Qt Online Installer

1. Aller sur : https://www.qt.io/download-qt-installer
2. Cliquer sur "Download the Qt Online Installer"
3. Créer un compte Qt gratuit (obligatoire)
4. Télécharger `qt-online-installer-windows-x64-x.x.x.exe`

### Étape 2 : Installer Qt6 avec MinGW

Lors de l'installation, **COCHER** :

```
📦 Qt 6.8.0 (ou plus récent)
    ✅ MinGW 11.2.0 64-bit  ← IMPORTANT : inclut g++
    ✅ Qt5 Compatibility Module
    
📦 Developer and Designer Tools
    ✅ CMake (optionnel si déjà installé)
    ✅ Ninja (optionnel si déjà installé)
    ✅ MinGW 11.2.0 64-bit  ← IMPORTANT
```

**Taille totale : ~3-4 GB**

### Étape 3 : Configurer les variables d'environnement

Après installation (exemple avec Qt 6.8.0) :

```powershell
# PowerShell
$env:Qt6_DIR = "C:\Qt\6.8.0\mingw_64"
$env:PATH += ";C:\Qt\6.8.0\mingw_64\bin"
$env:PATH += ";C:\Qt\Tools\mingw1120_64\bin"

# Pour rendre permanent (optionnel)
[System.Environment]::SetEnvironmentVariable("Qt6_DIR", "C:\Qt\6.8.0\mingw_64", "User")
```

**OU dans Git Bash :**

```bash
export Qt6_DIR="/c/Qt/6.8.0/mingw_64"
export PATH="$PATH:/c/Qt/6.8.0/mingw_64/bin:/c/Qt/Tools/mingw1120_64/bin"
```

### Étape 4 : Vérifier l'installation

```bash
# Vérifier Qt
qmake --version
# Devrait afficher : Qt version 6.8.0

# Vérifier g++ (compilateur)
g++ --version
# Devrait afficher : gcc (MinGW) 11.2.0

# Vérifier CMake
cmake --version
# Devrait afficher : cmake version 3.x

# Vérifier Ninja
ninja --version
# Devrait afficher : 1.11.1
```

### Étape 5 : Compiler LighTouch

```bash
cd "c:\Users\Arnaud\Desktop\repo-git\epitech projects\EIP\Software\cpp app"
cmd //c build.bat
```

**Devrait compiler sans erreur ! 🎉**

---

## 🚀 **Option 2 : Visual Studio (Alternative lourde)**

Si vous préférez utiliser MSVC au lieu de MinGW :

### Étape 1 : Installer Visual Studio 2022

1. Télécharger : https://visualstudio.microsoft.com/fr/downloads/
2. Choisir **"Community"** (gratuit)
3. Lors de l'installation, cocher :
   - ✅ **"Développement Desktop en C++"**
   - ✅ **"Outils CMake Windows pour C++"**

**Taille : ~7-10 GB**

### Étape 2 : Installer Qt6 avec MSVC

Installer Qt6 avec :

```
📦 Qt 6.8.0
    ✅ MSVC 2019 64-bit  ← Au lieu de MinGW
```

### Étape 3 : Configurer

```powershell
$env:Qt6_DIR = "C:\Qt\6.8.0\msvc2019_64"
$env:PATH += ";C:\Qt\6.8.0\msvc2019_64\bin"
```

### Étape 4 : Compiler

Ouvrir **"Developer Command Prompt for VS 2022"** puis :

```cmd
cd "c:\Users\Arnaud\Desktop\repo-git\epitech projects\EIP\Software\cpp app"
build.bat
```

---

## 🚀 **Option 3 : MSYS2 (Légère, environnement Unix)**

Pour un environnement plus léger avec packages manager :

### Étape 1 : Installer MSYS2

1. Télécharger : https://www.msys2.org/
2. Installer dans `C:\msys64`
3. Lancer **MSYS2 MINGW64**

### Étape 2 : Installer dépendances

```bash
# Mettre à jour MSYS2
pacman -Syu

# Installer compilateur + outils
pacman -S mingw-w64-x86_64-gcc \
          mingw-w64-x86_64-cmake \
          mingw-w64-x86_64-ninja

# Installer Qt6
pacman -S mingw-w64-x86_64-qt6-base \
          mingw-w64-x86_64-qt6-serialport \
          mingw-w64-x86_64-qt6-tools
```

**Taille : ~2 GB**

### Étape 3 : Compiler

Dans **MSYS2 MINGW64 terminal** :

```bash
cd "/c/Users/Arnaud/Desktop/repo-git/epitech projects/EIP/Software/cpp app"

mkdir build && cd build
cmake .. -G "Ninja"
ninja

# Exécuter
./LighTouch.exe
```

---

## 🎯 **Comparaison des Options**

| Critère | Qt Installer + MinGW | Visual Studio + Qt | MSYS2 |
|---------|---------------------|-------------------|-------|
| **Taille** | 3-4 GB | 10-15 GB | 2 GB |
| **Facilité** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Vitesse compile** | Rapide | Rapide | Rapide |
| **IDE Qt Creator** | ✅ Inclus | ❌ Séparé | ❌ Séparé |
| **Debugging** | Bon (GDB) | Excellent (VS) | Bon (GDB) |
| **Recommandé pour** | Débutants | Pros VS | Linux users |

---

## ✅ **Recommandation Finale**

**Pour vous (débutant en C++) : Option 1 - Qt Installer avec MinGW**

**Raisons :**
- ✅ Installation simple (1 seul installeur)
- ✅ Tout est inclus (compilateur + Qt + IDE)
- ✅ Qt Creator IDE pour éditer/débugger facilement
- ✅ Taille raisonnable (~4 GB)
- ✅ Compilation rapide

---

## 📝 **Checklist Post-Installation**

Après avoir installé Qt + MinGW, vérifier :

```bash
# 1. Qt installé ?
qmake --version

# 2. Compilateur disponible ?
g++ --version

# 3. CMake disponible ?
cmake --version

# 4. Ninja disponible ?
ninja --version

# 5. Qt6_DIR défini ?
echo $Qt6_DIR  # Git Bash
echo %Qt6_DIR%  # PowerShell
```

**Si tous affichent des versions : vous êtes prêt ! 🚀**

---

## 🆘 **Problèmes Fréquents**

### "g++ not found" après installation Qt

**Solution :** Ajouter MinGW au PATH

```powershell
# PowerShell
$env:PATH += ";C:\Qt\Tools\mingw1120_64\bin"
```

### "Qt6 not found" pendant cmake

**Solution :** Définir Qt6_DIR

```bash
export Qt6_DIR="/c/Qt/6.8.0/mingw_64"
```

### "cmake command not found"

**Solution :** Installer CMake standalone

```powershell
winget install Kitware.CMake
```

---

## 🎓 **Ressources Utiles**

- **Qt Documentation** : https://doc.qt.io/qt-6/
- **Qt Creator IDE Guide** : https://doc.qt.io/qtcreator/
- **CMake Tutorial** : https://cmake.org/cmake/help/latest/guide/tutorial/
- **MinGW FAQ** : https://www.mingw-w64.org/

---

## ⏱️ **Estimation Temps Total**

- **Téléchargement** : 30-60 min (selon connexion)
- **Installation** : 10-15 min
- **Configuration** : 5 min
- **Première compilation** : 2-3 min

**Total : ~1h - 1h30** ⏰

---

## 🎉 **Après Installation**

Une fois tout installé :

1. **Compiler** : `cd "cpp app" && cmd //c build.bat`
2. **Exécuter** : `cd build && ./LighTouch.exe`
3. **Développer** : Ouvrir `CMakeLists.txt` dans Qt Creator

**Votre application C++ sera opérationnelle ! 🚀**
