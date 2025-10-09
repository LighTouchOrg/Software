# 🔧 Réparer Qt SerialPort - Guide Rapide

## ✅ Maintenance Tool Détecté

Votre Qt Maintenance Tool est dans : `C:\Qt\MaintenanceTool.exe`

---

## 📝 Étapes de Réparation (5 minutes)

### Étape 1 : Lancer le Maintenance Tool

```bash
# Dans Git Bash
/c/Qt/MaintenanceTool.exe
```

**OU double-cliquer sur** `C:\Qt\MaintenanceTool.exe` dans l'explorateur Windows

---

### Étape 2 : Se connecter

- Entrer vos identifiants Qt (compte créé à l'installation)
- Cliquer "Next"

---

### Étape 3 : Choisir "Add or remove components"

- ⚪ Skip Update
- ⚪ Update components
- 🔘 **Add or remove components** ← SÉLECTIONNER CELUI-CI
- ⚪ Uninstall

Cliquer "Next"

---

### Étape 4 : Cocher Qt SerialPort

Développer l'arbre :

```
📦 Qt 6.9.3
   📦 MinGW 11.2.0 64-bit
      ✅ Qt SerialPort          ← COCHER CETTE CASE
      ✅ Qt Network (optionnel)
```

**IMPORTANT :** Vérifier que ces cases sont cochées :
- ✅ Qt SerialPort
- ✅ Additional Libraries (si disponible)

---

### Étape 5 : Installer

- Cliquer "Next"
- Accepter les licences
- Cliquer "Update" / "Install"

**Durée : ~2-5 minutes** (téléchargement + installation)

---

### Étape 6 : Vérifier l'installation

Une fois terminé, vérifier dans Git Bash :

```bash
# Chercher les fichiers SerialPort
find /c/Qt/6.9.3/mingw_64 -name "*Qt6SerialPort*" -o -name "*libQt6SerialPort*"

# Devrait afficher :
# /c/Qt/6.9.3/mingw_64/bin/Qt6SerialPort.dll
# /c/Qt/6.9.3/mingw_64/lib/libQt6SerialPort.a
# /c/Qt/6.9.3/mingw_64/include/QtSerialPort/...
```

---

## 🚀 Après Installation

### Configurer l'environnement

```bash
# Dans Git Bash
export Qt6_DIR="/c/Qt/6.9.3/mingw_64"
export PATH="$PATH:/c/Qt/6.9.3/mingw_64/bin"
export PATH="$PATH:/c/Qt/Tools/mingw1120_64/bin"

# Vérifier
qmake --version
# Qt version 6.9.3
```

### Compiler LighTouch

```bash
cd "/c/Users/Arnaud/Desktop/repo-git/epitech projects/EIP/Software/cpp app"

# Nettoyer
rm -rf build

# Compiler
mkdir build && cd build
cmake .. -G "Ninja" -DCMAKE_PREFIX_PATH="/c/Qt/6.9.3/mingw_64"
cmake --build .

# Devrait compiler sans erreur !
```

---

## ❌ Si Maintenance Tool ne fonctionne pas

### Méthode Alternative : Installation Manuelle via CLI

```bash
# Dans PowerShell (Admin)
cd C:\Qt

# Installer SerialPort via aqt (Qt CLI installer)
pip install aqtinstall

# Installer le module SerialPort
aqt install-qt windows desktop 6.9.3 win64_mingw --modules qtserialport
```

---

## 🆘 Problèmes Courants

### "Maintenance Tool ne se lance pas"

**Solution :**
```bash
# Lancer en mode admin
runas /user:Administrator "C:\Qt\MaintenanceTool.exe"
```

### "Qt SerialPort toujours pas trouvé après installation"

**Vérification :**
```bash
# Vérifier l'existence des fichiers
ls /c/Qt/6.9.3/mingw_64/bin/Qt6SerialPort.dll
ls /c/Qt/6.9.3/mingw_64/lib/libQt6SerialPort.a

# Si présents mais CMake ne les trouve pas :
export CMAKE_PREFIX_PATH="/c/Qt/6.9.3/mingw_64"
```

### "Erreur de connexion au serveur Qt"

**Solution :**
- Vérifier votre connexion Internet
- Désactiver temporairement le proxy/VPN
- Réessayer dans 5 minutes

---

## 📊 Checklist Post-Installation

Après l'installation de SerialPort, vérifier :

```bash
# 1. DLL présente ?
ls /c/Qt/6.9.3/mingw_64/bin/Qt6SerialPort.dll

# 2. Headers présents ?
ls /c/Qt/6.9.3/mingw_64/include/QtSerialPort/

# 3. Lib présente ?
ls /c/Qt/6.9.3/mingw_64/lib/libQt6SerialPort*

# 4. CMake trouve Qt6 ?
cmake --find-package -DNAME=Qt6 -DCOMPILER_ID=GNU -DLANGUAGE=CXX -DMODE=EXIST

# 5. CMake trouve SerialPort ?
cd "/c/Users/Arnaud/Desktop/repo-git/epitech projects/EIP/Software/cpp app"
mkdir test_build && cd test_build
cmake .. -DCMAKE_PREFIX_PATH="/c/Qt/6.9.3/mingw_64" 2>&1 | grep -i serialport
```

**Si tous les fichiers sont présents : ✅ Installation réussie !**

---

## ⏱️ Timeline

- **Lancer Maintenance Tool** : 30 sec
- **Navigation interface** : 1 min
- **Téléchargement SerialPort** : 2-3 min
- **Installation** : 1 min
- **Vérification** : 30 sec

**Total : ~5 minutes** ⏰

---

## 🎉 Après Réparation Réussie

Vous pourrez compiler LighTouch normalement :

```bash
cd "cpp app"
export Qt6_DIR="/c/Qt/6.9.3/mingw_64"
export PATH="$PATH:/c/Qt/6.9.3/mingw_64/bin:/c/Qt/Tools/mingw1120_64/bin"

mkdir build && cd build
cmake .. -G "Ninja" -DCMAKE_PREFIX_PATH="$Qt6_DIR"
ninja

# Exécuter
./LighTouch.exe
```

---

## 💡 Astuce

Pour rendre la config permanente, ajouter à `~/.bashrc` :

```bash
echo 'export Qt6_DIR="/c/Qt/6.9.3/mingw_64"' >> ~/.bashrc
echo 'export PATH="$PATH:/c/Qt/6.9.3/mingw_64/bin"' >> ~/.bashrc
echo 'export PATH="$PATH:/c/Qt/Tools/mingw1120_64/bin"' >> ~/.bashrc
source ~/.bashrc
```

---

**Lancez le Maintenance Tool maintenant et cochez Qt SerialPort ! 🚀**
