# 🚀 Installation Rapide de Qt6 avec Vcpkg

## Pour tester rapidement sans Qt Online Installer lourd

### Étape 1 : Installer Vcpkg (Gestionnaire de packages C++)

```bash
# Dans Git Bash
cd /c/
git clone https://github.com/microsoft/vcpkg.git
cd vcpkg
./bootstrap-vcpkg.sh

# Ajouter au PATH
export PATH="/c/vcpkg:$PATH"
```

### Étape 2 : Installer Qt6 Base + SerialPort

```bash
cd /c/vcpkg
./vcpkg install qt6-base:x64-mingw-static
./vcpkg install qt6-serialport:x64-mingw-static
```

**⚠️ Attention : Installation longue (~2-3h, compile Qt depuis sources)**

### Étape 3 : Compiler LighTouch

```bash
cd "/c/Users/Arnaud/Desktop/repo-git/epitech projects/EIP/Software/cpp app"
export CMAKE_TOOLCHAIN_FILE=/c/vcpkg/scripts/buildsystems/vcpkg.cmake
./build.sh
```

---

## ⚖️ Comparaison

| Méthode | Taille | Temps | Facilité | Production Ready |
|---------|--------|-------|----------|-----------------|
| **Qt Installer** | ~4 GB | 1h | ⭐⭐⭐⭐⭐ | ✅ Oui |
| **Vcpkg** | ~2 GB | 2-3h | ⭐⭐⭐ | ⚠️ Build statique |

---

## 🎯 Recommandation

**Utilisez Qt Online Installer** pour :
- ✅ Installation plus rapide
- ✅ Binaires pré-compilés
- ✅ Qt Creator IDE inclus
- ✅ Updates automatiques
- ✅ Configuration simplifiée

**Vcpkg est utile si** :
- Vous voulez un build statique (1 exe sans DLLs)
- Vous êtes à l'aise avec la ligne de commande
- Vous avez du temps devant vous

---

## 📝 Instructions Qt Installer (Détaillées)

### 1. Télécharger

https://www.qt.io/download-qt-installer

Fichier : `qt-online-installer-windows-x64-x.x.x.exe`

### 2. Lancer l'installeur

- Créer compte Qt (gratuit)
- Choisir "Custom Installation"

### 3. Sélectionner ces composants

```
📦 Qt 6.8.0 (ou 6.5+)
   ✅ MinGW 11.2.0 64-bit
   ✅ Additional Libraries
      ✅ Qt SerialPort
      ✅ Qt Network (optionnel)

📦 Developer and Designer Tools
   ✅ MinGW 11.2.0 64-bit (compilateur)
   ✅ CMake (optionnel, vous l'avez déjà)
   ✅ Ninja (optionnel, vous l'avez déjà)
```

### 4. Installation

Laisser installer dans : `C:\Qt\6.8.0\`

Durée : 30-60 min selon connexion

### 5. Configuration

```bash
# Dans Git Bash (~/.bashrc pour rendre permanent)
export Qt6_DIR="/c/Qt/6.8.0/mingw_64"
export PATH="$PATH:/c/Qt/6.8.0/mingw_64/bin"
export PATH="$PATH:/c/Qt/Tools/mingw1120_64/bin"
```

### 6. Vérifier

```bash
qmake --version
# Qt version 6.8.0
```

### 7. Compiler LighTouch

```bash
cd "/c/Users/Arnaud/Desktop/repo-git/epitech projects/EIP/Software/cpp app"
./build.sh
```

**✅ Devrait compiler sans erreur !**

---

## 🆘 Support

Si vous rencontrez des problèmes :

1. Vérifier les versions :
   ```bash
   g++ --version      # MinGW 6.3.0+
   cmake --version    # 3.16+
   qmake --version    # Qt 6.x
   ```

2. Vérifier le PATH :
   ```bash
   echo $PATH | grep -i qt
   echo $Qt6_DIR
   ```

3. Nettoyer et rebuilder :
   ```bash
   rm -rf build
   ./build.sh
   ```
