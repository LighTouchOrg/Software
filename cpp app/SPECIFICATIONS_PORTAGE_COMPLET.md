# 📋 Spécifications Complètes - Portage Exact Electron → C++

## 🎯 Structure de l'Interface Principale (index.html)

### Layout Exact :
```
┌─────────────────────────────────────────┐
│  [Background avec grid + glow + scanline]│
│                                          │
│         [Logo 80x80 cropped]             │
│                                          │
│            LighTouch (h1)                │
│                                          │
│      [Calibration Button - Large]        │
│      [Onboarding Button - Large]         │
│                                          │
│     [Settings] [Key Bindings]            │
│        (petits boutons côte à côte)      │
│                                          │
│    [Device Status - centered box]        │
│                                          │
│    [Enabled Status text]                 │
│                                          │
│                       [Documentation →]  │
└─────────────────────────────────────────┘
```

### Éléments Manquants dans le C++ :
1. ❌ Background avec grid animée
2. ❌ Glow effect animé (cercle cyan)
3. ❌ Scanline animée
4. ❌ Logo LighTouch 80x80
5. ❌ Disposition verticale centrée (actuellement horizontal)
6. ❌ 2 gros boutons en haut (Calibrate + Onboarding)
7. ❌ 2 petits boutons en dessous (Settings + Key Bindings)
8. ❌ Lien Documentation en bas à droite
9. ❌ Device status dans une box centrée
10. ❌ Enabled status en dessous

---

## 🎨 Design Exact (style.css)

### Couleurs :
```css
--primary-color: #1d1136;
--primary-color-light: #301d55;
--secondary-color: #ffb920;
--background-color-1: #d8d2d2;
--background-color-2: #f3f3f3;

Dark Mode:
--background-color-dark-1: #2c2535;
--background-color-dark-2: #1f1b24;
--primary-color-dark: #e0e0e0;
```

### Titre H1 :
```css
font-size: 60px;
color: transparent;
-webkit-text-stroke: 1px #1d1136; /* Mode clair */
/* Mode sombre: color: #e0e0e0; */
```

### Boutons :
```css
Gros boutons (Calibrate/Onboarding):
  background: #1d1136;
  border-radius: 12px;
  padding: 15px;
  font-size: 18px;
  min-height: 50px;
  
  hover: #301d55;

Petits boutons (Settings/KeyBindings):
  même style mais plus petits
```

### Device Status Box :
```css
background-color: rgba(243, 243, 243, 0.8);
border-radius: 8px;
padding: 12px;
font-size: 18px;
color: #9a3412; /* Non connecté */
color: #2a9d8f; /* Connecté */
```

---

## ⚙️ Fonctionnement Exact (renderer.js)

### 1. Calibration Flow :
```javascript
Click "Calibrate" →
  Button disabled
  Open fullscreen window (calibration.html)
  Send "START_CALIBRATION" to Python
  
  ESC key → 
    Send "STOP_CALIBRATION"
    Close window
    Status = "calibration_interrupted"
    Color = midnightblue
    Re-enable button
```

### 2. Device Status :
```javascript
Messages:
  - device_not_connected (rouge: #9a3412)
  - device_connected (vert: #2a9d8f)
  - calibration_done (vert)
  - calibration_failed (rouge)
  - calibration_interrupted (bleu: midnightblue)

Sauvegardé dans localStorage
```

### 3. Enabled Status :
```javascript
Spacebar → Toggle enabled
Si disabled:
  Afficher "Les actions sont désactivées..."
Si enabled:
  Cacher le message
```

### 4. Onboarding :
```javascript
Click "Onboarding" →
  Button disabled
  Open fullscreen (onboarding.html)
  
  ESC → Close window, re-enable button
```

---

## 🐛 Bugs Actuels C++ :

### Interface :
1. ❌ Layout horizontal au lieu de vertical
2. ❌ Pas de background animé
3. ❌ Pas de logo
4. ❌ Titre pas en outline stroke
5. ❌ Boutons pas disposés comme Electron (2 gros + 2 petits)
6. ❌ Device status pas dans une box centrée
7. ❌ Pas de lien Documentation

### Fonctionnement :
1. ❌ Calibration : pas de gestion ESC
2. ❌ Calibration : bouton pas disabled pendant calibration
3. ❌ Calibration : status pas mis à jour correctement
4. ❌ Device status : couleurs pas exactes
5. ❌ Enabled status : message pas affiché/caché
6. ❌ Onboarding : pas les 5 étapes interactives
7. ❌ Onboarding : pas de canvas avec cibles

---

## ✅ Plan de Correction

### Phase 1 : Interface (2h)
1. Refaire MainWindow avec QVBoxLayout centré vertical
2. Ajouter QLabel pour logo (80x80)
3. Ajouter background widget avec grid + glow + scanline (QPainter)
4. Styling exact des boutons (2 gros + 2 petits)
5. Device status dans QFrame avec styling
6. Ajouter QLabel lien Documentation

### Phase 2 : Calibration (1h)
1. Passer CalibrationWindow en fullscreen
2. Ajouter gestion ESC key
3. Disabled/enabled du bouton
4. Update status avec bonnes couleurs
5. Message "calibration_interrupted"

### Phase 3 : Onboarding (2h)
1. Refaire OnboardingWindow avec 5 étapes
2. Canvas QPainter pour cibles
3. Détection gestes (swipe-left, swipe-right, move, click)
4. Progression visuelle
5. Dessin libre à la fin

### Phase 4 : Device Status (30min)
1. Couleurs exactes (#9a3412, #2a9d8f, etc.)
2. LocalStorage → QSettings
3. Update en temps réel

### Phase 5 : Background Animé (1h)
1. QWidget custom avec paintEvent
2. QTimer pour animer grid
3. Glow effect avec QPainter
4. Scanline animée

---

## 🚀 Priorités

**URGENT (à faire maintenant) :**
1. ✅ Layout vertical centré
2. ✅ 2 gros boutons + 2 petits
3. ✅ Logo LighTouch
4. ✅ Device status box
5. ✅ Calibration ESC + disabled button

**IMPORTANT (après) :**
6. ✅ Onboarding 5 étapes
7. ✅ Background animé
8. ✅ Couleurs exactes

**OPTIONNEL :**
9. ⚪ Glow/Scanline animations
10. ⚪ Lien Documentation

---

**TEMPS ESTIMÉ TOTAL : 6-7 heures pour un portage 100% fidèle**

Je commence maintenant ?
