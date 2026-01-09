# Guide d'installation - LighTouch sur Linux

## Prérequis système

- Ubuntu 20.04+ (ou distribution Linux compatible)
- 2 Go de RAM minimum
- 500 Mo d'espace disque

## Installation complète

### 1. Installer .NET 8.0 SDK

```bash
# Télécharger le package de configuration Microsoft
wget https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/packages-microsoft-prod.deb -O /tmp/packages-microsoft-prod.deb

# Installer le package
sudo dpkg -i /tmp/packages-microsoft-prod.deb

# Mettre à jour la liste des packages
sudo apt update

# Installer le SDK .NET 8.0
sudo apt install -y dotnet-sdk-8.0

# Vérifier l'installation
dotnet --version
```

### 2. Installer xdotool (contrôle souris/clavier)

```bash
sudo apt-get update
sudo apt-get install -y xdotool
```

Ou utilisez simplement le Makefile :
```bash
make install-deps
```

### 3. Compiler le projet

```bash
# Vérifier que dotnet est installé
make check-dotnet

# Compiler en mode Debug
make build

# Ou compiler et exécuter directement
make run
```

### 4. Créer un exécutable standalone

```bash
make publish-linux
```

L'exécutable sera créé dans `bin/publish-linux/LighTouch`

## Exécution

### Mode développement
```bash
make run
```

### Mode production
```bash
./bin/publish-linux/LighTouch
```

## Configuration des permissions

Pour que xdotool fonctionne correctement, vous pourriez avoir besoin de certaines permissions :

### Autoriser le contrôle de la souris/clavier

Sur certaines distributions avec Wayland :
```bash
# Passer en X11 (plus compatible avec xdotool)
# Déconnectez-vous et choisissez "Ubuntu sur Xorg" à la connexion
```

### Ajouter l'utilisateur au groupe input (optionnel)
```bash
sudo usermod -a -G input $USER
```

Puis redémarrez votre session.

## Test de xdotool

Testez que xdotool fonctionne :

```bash
# Déplacer la souris à la position (100, 100)
xdotool mousemove 100 100

# Cliquer
xdotool click 1

# Taper du texte
xdotool type "Hello World"
```

Si ces commandes fonctionnent, LighTouch devrait fonctionner correctement.

## Dépannage

### "dotnet: command not found"
Réinstallez .NET SDK :
```bash
sudo apt remove dotnet-sdk-8.0
sudo apt autoremove
sudo apt install -y dotnet-sdk-8.0
```

### "xdotool: command not found"
```bash
sudo apt-get install -y xdotool
```

### L'application se compile mais ne démarre pas
```bash
# Vérifier les dépendances graphiques Avalonia
sudo apt-get install -y libice6 libsm6 libfontconfig1
```

### Erreur "Cannot open display"
Assurez-vous que vous êtes dans une session graphique (pas en SSH sans X forwarding).

### xdotool ne fonctionne pas sur Wayland
Wayland a des restrictions de sécurité. Solutions :
1. Utilisez X11 au lieu de Wayland
2. Ou installez `ydotool` comme alternative :
   ```bash
   sudo apt install ydotool
   ```

## Compilation pour d'autres distributions

### Debian
Même procédure qu'Ubuntu

### Fedora / RHEL / CentOS
```bash
# Installer .NET
sudo dnf install dotnet-sdk-8.0

# Installer xdotool
sudo dnf install xdotool

# Compiler
make build
```

### Arch Linux
```bash
# Installer .NET
sudo pacman -S dotnet-sdk

# Installer xdotool
sudo pacman -S xdotool

# Compiler
make build
```

## Performance

Sur Linux, l'application devrait utiliser :
- **RAM** : ~50-100 Mo
- **CPU** : <1% au repos, 2-5% en utilisation

## Sécurité

⚠️ **Important** : xdotool peut contrôler votre souris et clavier. Assurez-vous de :
- N'exécuter que sur des machines de confiance
- Configurer correctement les pare-feu pour le serveur TCP
- Utiliser uniquement sur des réseaux privés/sécurisés

## Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs de l'application
2. Testez xdotool manuellement
3. Vérifiez que le serveur Python est accessible
4. Consultez `MIGRATION_AVALONIA.md` pour plus de détails

## Désinstallation

```bash
# Supprimer l'application
rm -rf bin/

# Désinstaller .NET (optionnel)
sudo apt remove dotnet-sdk-8.0

# Désinstaller xdotool (optionnel)
sudo apt remove xdotool
```
