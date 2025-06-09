const translations = {
    en: {
      Calibration: "Calibrate the camera",
      Setting: "Settings",
      Status: "No Bluetooth device connected",
      Back: "Back",
      Reader: "Digital Reader",
      SizeText: "Text size",
      Theme: "Dark Theme",
      PresMode: "Presentation Mode",
      NavMode: "Navigation Mode",
      Langage: "Language"
    },
    fr: {
      Calibration: "Calibrer la caméra",
      Setting: "Paramètres",
      Status: "Aucun appareil Bluetooth connecté",
      Back: "Retour",
      Reader: "Liseuse Numérique",
      SizeText: "Taille du texte",
      Theme: "Thème Sombre",
      PresMode: "Mode Presentation",
      NavMode: "Mode Naviguation",
      Langage: "Langue"
    }
};

function applyTranslations() {
    lang = localStorage.getItem('preferredLang') || 'en';
    console.log("Apply : ", lang);
    const t = translations[lang];
    if (!t) return console.warn(`Langue inconnue : ${lang}`);

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key]) el.textContent = t[key];
      else console.warn(`Clé manquante : "${key}" pour la langue ${lang}`);
    });
}
