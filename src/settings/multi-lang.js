const translations = {
    en: {
      Calibration: "Calibrate the camera",
      Setting: "Settings",
      Status: "No Bluetooth device connected",
      Back: "Back",
      Reader: "Screen Reader",
      SizeText: "Text Size",
      Theme: "Dark Theme",
      PresMode: "Presentation Mode",
      NavMode: "Navigation Mode",
      Langage: "Language",
      text_1: "Little",
      text_2: "Medium",
      text_3: "Big",
      on: "On",
      off: "Off",
      fr: "French",
      en: "English",
      Keybind: "Key Binding",
      title_keybind: "LighTouch® - Key Binding",
      title_setting : "LighTouch® – Settings",
      swipe_right: "Right Swipe",
      swipe_left: "Left Swipe"
    },
    fr: {
      Calibration: "Calibrer la caméra",
      Setting: "Paramètres",
      Status: "Aucun appareil Bluetooth connecté",
      Back: "Retour",
      Reader: "Lecteur d'écran",
      SizeText: "Taille du texte",
      Theme: "Thème Sombre",
      PresMode: "Mode Presentation",
      NavMode: "Mode Navigation",
      Langage: "Langue",
      text_1: "Petit",
      text_2: "Moyen",
      text_3: "Grand",
      on: "Activé",
      off: "Désactivé",
      fr: "Français",
      en: "Anglais",
      Keybind: "Assignation des touches",
      title_keybind: "LighTouch® - Assignation des touche",
      title_setting : "LighTouch® – Réglages",
      swipe_right: "Balayage Droit",
      swipe_left: "Balayage Gauche",
    }
};

function applyTranslations() {
    lang = localStorage.getItem('preferredLang') || 'fr';
    console.log("Apply : ", lang);
    const t = translations[lang];
    if (!t) return console.warn(`Unknow Language : ${lang}`);

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key]) el.textContent = t[key];
      else console.warn(`Missing key : "${key}" for the langage ${lang}`);
    });
}

// This one is for the automatic reader, when the user will focus on an element
// with tab, the voice will read the text (work with both lang)

document.querySelectorAll('[data-i18n]').forEach(el => {
    if (el.id === 'text-size-slider' || el.htmlFor === 'text-size-slider') return;

    const inputElement = el.tagName === 'INPUT' && el.type === 'checkbox'
                      ? el
                      : el.querySelector('input[type="checkbox"]');

    if (inputElement) {
      inputElement.addEventListener('change', () => speakFocusedElementText(el));
    } else {
      el.addEventListener('focus', () => speakFocusedElementText(el));
    }
});



function speakFocusedElementText(element) {
    if (localStorage.getItem('Reader') !== 'true') return;

    const lang = localStorage.getItem("preferredLang") || "fr";
    const key = element.getAttribute("data-i18n");

    if (!key || !translations[lang] || !translations[lang][key]) return;

    let textToSpeak = translations[lang][key];

    // Check if it's a switch (checkbox)
    const inputElement = element.tagName === 'INPUT' && element.type === 'checkbox' ? element
                      : element.querySelector('input[type="checkbox"]');

    if (inputElement) {
      const isChecked = inputElement.checked;
      const state = isChecked ? translations[lang]["on"] : translations[lang]["off"];
      textToSpeak += ` ${state}`;
    }

    const msg = new SpeechSynthesisUtterance(textToSpeak);
    msg.lang = lang === "fr" ? "fr-FR" : "en-US";
    speechSynthesis.speak(msg);
}

