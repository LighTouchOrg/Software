const translations = {
  en: {
    Calibration: "Camera calibration",
    calibration_in_progress: "Calibration in progress",
    Onboarding: "Learn to use LighTouch",
    Setting: "Settings",
    Status: "No Bluetooth device connected",
    Back: "Back",
    Reader: "Screen reader",
    SizeText: "Text size",
    Theme: "Dark theme",
    PresMode: "Presentation mode",
    NavMode: "Navigation mode",
    Langage: "Language",
    text_1: "Small",
    text_2: "Medium",
    text_3: "Big",
    on: "On",
    off: "Off",
    fr: "French",
    en: "English",
    Keybind: "Key Bindings",
    Documentation: "Documentation",
    title_keybind: "LighTouch® – Key Bindings",
    title_setting: "LighTouch® – Settings",
    swipe_right: "Right swipe",
    swipe_left: "Left swipe",
    esc_to_quit: "Press ESC to quit this screen.",
    onboarding_step_swipe_right: "Swipe right to continue.",
    onboarding_step_swipe_left: "Swipe left to continue.",
    onboarding_step_move_cursor:
      "Move your hand to move the cursor to the center of the frame.",
    onboarding_step_click_target:
      "Click on the target on the screen to validate.",
    onboarding_step_end: "Congratulations, you have completed the tutorial!",
    onboarding_finish: "Back to the main page",
    onboarding_restart: "Restart",
    DominantHand: "Dominant hand",
    left: "Left",
    right: "Right",
    calibration_cancel: "Press ESC to cancel",
  },
  fr: {
    Calibration: "Calibrer la caméra",
    calibration_in_progress: "Calibration en cours",
    Onboarding: "Apprendre à utiliser LighTouch",
    Setting: "Paramètres",
    Status: "Aucun appareil Bluetooth connecté",
    Back: "Retour",
    Reader: "Lecteur d'écran",
    SizeText: "Taille du texte",
    Theme: "Thème sombre",
    PresMode: "Mode Présentation",
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
    Documentation: "Documentation",
    title_keybind: "LighTouch® – Assignation des touches",
    title_setting: "LighTouch® – Réglages",
    swipe_right: "Balayage droit",
    swipe_left: "Balayage gauche",
    esc_to_quit: "Appuyez sur Échap pour quitter cet écran.",
    onboarding_step_swipe_right:
      "Faites un geste vers la droite (swipe droit) pour continuer.",
    onboarding_step_swipe_left:
      "Faites un geste vers la gauche (swipe gauche).",
    onboarding_step_move_cursor:
      "Déplacez votre main pour déplacer le curseur vers le centre du cadre.",
    onboarding_step_click_target:
      "Cliquez sur la cible à l'écran pour valider.",
    onboarding_step_end: "Félicitations, vous avez terminé le tutoriel !",
    onboarding_finish: "Retourner à l'écran principal",
    onboarding_restart: "Redémarrer",
    DominantHand: "Main dominante",
    left: "Gauche",
    right: "Droite",
    calibration_cancel: "Appuyez sur Échap pour annuler",
  },
};

window.translations = translations;

function applyTranslations() {
  lang = localStorage.getItem("preferredLang") || "fr";
  console.log("Apply : ", lang);
  const t = translations[lang];
  if (!t) return console.warn(`Unknow Language : ${lang}`);

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (t[key]) el.textContent = t[key];
    else console.warn(`Missing key : "${key}" for the langage ${lang}`);
  });
}

// This one is for the automatic reader, when the user will focus on an element
// with tab, the voice will read the text (work with both lang)

document.querySelectorAll("[data-i18n]").forEach((el) => {
  if (el.id === "text-size-slider" || el.htmlFor === "text-size-slider") return;

  const inputElement =
    el.tagName === "INPUT" && el.type === "checkbox"
      ? el
      : el.querySelector('input[type="checkbox"]');

  if (inputElement) {
    inputElement.addEventListener("change", () => speakFocusedElementText(el));
  } else {
    el.addEventListener("focus", () => speakFocusedElementText(el));
  }
});

function speakFocusedElementText(element) {
  if (localStorage.getItem("Reader") !== "true") return;

  const lang = localStorage.getItem("preferredLang") || "fr";
  const key = element.getAttribute("data-i18n");

  if (!key || !translations[lang] || !translations[lang][key]) return;

  let textToSpeak = translations[lang][key];

  // Check if it's a switch (checkbox)
  const inputElement =
    element.tagName === "INPUT" && element.type === "checkbox"
      ? element
      : element.querySelector('input[type="checkbox"]');

  if (inputElement) {
    const isChecked = inputElement.checked;
    const state = isChecked
      ? translations[lang]["on"]
      : translations[lang]["off"];
    textToSpeak += ` ${state}`;
  }

  const msg = new SpeechSynthesisUtterance(textToSpeak);
  msg.lang = lang === "fr" ? "fr-FR" : "en-US";
  speechSynthesis.speak(msg);
}

window.addEventListener("DOMContentLoaded", applyTranslations);
