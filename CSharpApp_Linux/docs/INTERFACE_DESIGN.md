# Interface LighTouch - Version Avalonia

## 🎨 Design reproduit

L'interface a été recréée pour reproduire le style visuel de la version WPF originale avec :

### Éléments visuels

✅ **Fond dégradé radial** - Gradient gris clair (#d8d2d2 → #f3f3f3)  
✅ **Logo LighTouch** - Affiché en haut (80x80px)  
✅ **Titre "LighTouch"** - Grande police (60px), couleur violette (#1d1136)  
✅ **Boutons principaux** - Style violet (#301d55) avec hover (#1d1136)  
✅ **Box de status** - Encadré avec bordure violette  
✅ **Section logs** - Zone scrollable avec police monospace  
✅ **Lien documentation** - En bas à droite, couleur dorée (#ffb920)

### Différences avec WPF

| Élément | WPF (original) | Avalonia (nouveau) | Raison |
|---------|----------------|-------------------|---------|
| WebView | ✅ WebView2 intégré | ❌ Non disponible | Avalonia n'a pas de WebView natif |
| Animations fond | ✅ Grid animée CSS | ❌ Non implémentée | Complexe en XAML pur |
| Effets glow | ✅ Animation CSS | ❌ Non implémenté | Nécessiterait Skia custom |
| Calibration | ✅ Page HTML | ⚠️ Désactivée | Nécessite implémentation native |
| Onboarding | ✅ Page HTML | ⚠️ Désactivée | Nécessite implémentation native |
| Settings | ✅ Pages HTML | ⚠️ Futures | À implémenter en XAML |

## 📐 Dimensions

- **Fenêtre** : 1150x875px (identique à l'original)
- **Boutons principaux** : 480px de large
- **Boutons secondaires** : 350px de large
- **Zone logs** : 700px de large, 200px de haut

## 🎨 Palette de couleurs

```
Violet principal : #1d1136
Violet clair : #301d55
Doré : #ffb920
Fond gris clair : #d8d2d2 → #f3f3f3
Texte status : #9a3412
```

## 🚀 Pour exécuter

```bash
make run
```

L'interface devrait maintenant ressembler visuellement à l'ancienne version WPF, avec une disposition et des couleurs identiques.

## 🔄 Améliorations futures possibles

1. **Ajouter WebView externe** - Utiliser `Avalonia.WebView` (package tiers)
2. **Implémenter les animations** - Avec SkiaSharp pour le fond animé
3. **Pages natives XAML** - Recréer Calibration/Onboarding en XAML
4. **Mode sombre** - Ajouter le thème sombre de l'original
5. **Internationalisation** - Français/Anglais comme l'original

## 📝 Notes

- L'interface est maintenant entièrement native Avalonia (pas de HTML/CSS/JS)
- Les services backend (TCP, UDP, souris/clavier) fonctionnent à l'identique
- Le design est responsive et s'adapte à différentes résolutions
- Compatible Windows, Linux et macOS
