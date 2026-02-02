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
    onboarding_step_move_cursor_1:
      "Move your hand to move the cursor to the target.",
    onboarding_step_move_cursor_2:
      "Now move the cursor to this new target.",
    onboarding_step_move_cursor_3:
      "One more! Move the cursor to the center.",
    onboarding_step_swipe_right: "Swipe right to continue.",
    onboarding_step_swipe_left: "Swipe left to continue.",
    onboarding_step_click_target:
      "Click on the target on the screen to validate.",
    onboarding_step_hold_click_target:
      "Drag the orange square to the green zone.",
    onboarding_step_end: "Congratulations, you have completed the tutorial!",
    onboarding_finish: "Back to the main page",
    onboarding_restart: "Restart",
    DominantHand: "Dominant hand",
    left: "Left",
    right: "Right",
    VideoStream: "Camera preview",
    OpenVideoStream: "Open",
    calibration_cancel: "Press ESC to cancel",
    wifi_title: "WiFi QR Code Generator",
    wifi_detecting: "Detecting WiFi...",
    wifi_available_networks: "Available WiFi Networks",
    wifi_select_network: "Select a network",
    wifi_choose_network: "-- Choose a network --",
    wifi_ssid: "Network Name (SSID)",
    wifi_security: "Security",
    wifi_password: "WiFi Password",
    wifi_password_placeholder: "Enter password",
    wifi_refresh: "Refresh",
    wifi_generate: "Generate QR Code",
    wifi_scan_qr: "Scan this QR Code",
    wifi_back: "Back",
    wifi_networks_found: "WiFi network(s) found",
    wifi_detected_auto_password: "WiFi detected successfully! Password retrieved automatically.",
    wifi_detected: "WiFi detected!",
    wifi_enter_password_manual: "Please enter the password manually.",
    wifi_refreshing: "Refreshing...",
    wifi_enter_password_error: "Please enter the WiFi password",
    wifi_generating: "Generating...",
    wifi_qr_generated_success: "QR Code generated successfully!",
    wifi_qr_generated_error: "Error generating QR Code",
    wifi_error: "Error:",
  },
  fr: {
    Calibration: "Calibrer la caméra",
    calibration_in_progress: "Calibration en cours",
    Onboarding: "Tutoriel",
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
    onboarding_step_move_cursor_1:
      "Déplacez votre main pour déplacer le curseur vers la cible.",
    onboarding_step_move_cursor_2:
      "Maintenant, déplacez le curseur vers cette nouvelle cible.",
    onboarding_step_move_cursor_3:
      "Encore une ! Déplacez le curseur vers le centre.",
    onboarding_step_swipe_right:
      "Faites un geste vers la droite (swipe droit) pour continuer.",
    onboarding_step_swipe_left:
      "Faites un geste vers la gauche (swipe gauche).",
    onboarding_step_click_target:
      "Cliquez sur la cible à l'écran pour valider.",
    onboarding_step_hold_click_target:
      "Glissez le carré orange vers la zone verte.",
    onboarding_step_end: "Félicitations, vous avez terminé le tutoriel !",
    onboarding_finish: "Retourner à l'écran principal",
    onboarding_restart: "Redémarrer",
    DominantHand: "Main dominante",
    left: "Gauche",
    right: "Droite",
    VideoStream: "Apercu camera",
    OpenVideoStream: "Ouvrir",
    calibration_cancel: "Appuyez sur Échap pour annuler",
    wifi_title: "Générateur QR Code WiFi",
    wifi_detecting: "Détection du WiFi en cours...",
    wifi_available_networks: "Réseaux WiFi disponibles",
    wifi_select_network: "Sélectionner un réseau",
    wifi_choose_network: "-- Choisir un réseau --",
    wifi_ssid: "Nom du réseau (SSID)",
    wifi_security: "Sécurité",
    wifi_password: "Mot de passe WiFi",
    wifi_password_placeholder: "Entrez le mot de passe",
    wifi_refresh: "Actualiser",
    wifi_generate: "Générer QR Code",
    wifi_scan_qr: "Scannez ce QR Code",
    wifi_back: "Retour",
    wifi_networks_found: "réseau(x) WiFi trouvé(s)",
    wifi_detected_auto_password: "WiFi détecté avec succès ! Mot de passe récupéré automatiquement.",
    wifi_detected: "WiFi détecté !",
    wifi_enter_password_manual: "Veuillez entrer le mot de passe manuellement.",
    wifi_refreshing: "Actualisation...",
    wifi_enter_password_error: "Veuillez entrer le mot de passe WiFi",
    wifi_generating: "Génération...",
    wifi_qr_generated_success: "QR Code généré avec succès !",
    wifi_qr_generated_error: "Erreur lors de la génération du QR Code",
    wifi_error: "Erreur :",
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

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (t[key]) el.placeholder = t[key];
    else console.warn(`Missing placeholder key : "${key}" for the langage ${lang}`);
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
