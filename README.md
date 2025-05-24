# Lightouch Software

Lightouch Software est une application Electron utilisée pour contrôler le système Lightouch.

## Installation

1. installez les dépendances nécessaires :
   ```bash
   npm install
   ```
   ```bash
   pip install -r requirements.txt
   ```
2. Lancez l'application :
   ```bash
   npm start
   ```
3. Si vous êtes sur Windows et que vous rencontrez des problèmes avec le sous-système WSL il est possible que vous deviez installer les dépendances suivantes :
   ```bash
   sudo apt update && sudo apt install -y libnss3 libxss1 libasound2 libatk1.0-0 libatk-bridge2.0-0 libgtk-3-0 libx11-xcb1
   ```