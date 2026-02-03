const textSizeSelector = document.getElementById("text-size-slider");
const themeToggle = document.getElementById("theme-toggle");
const readerToggle = document.getElementById("reader-toggle");
const langSelector = document.getElementById("lang-selector");
const presToggle = document.getElementById("presentation-toggle");
const navToggle = document.getElementById("nav-toggle");
const handSelector = document.getElementById("hand-selector");
const videoStreamToggle = document.getElementById("video-stream-toggle");
const hintsToggle = document.getElementById("hints-toggle");

let readerMode = false;

// Text size handler
if (textSizeSelector) {
  textSizeSelector.addEventListener("input", () => {
    const sizes = {
      1: "14px",
      2: "16px",
      3: "20px",
    };
    const labels = {
      1: "text_1",
      2: "text_2",
      3: "text_3",
    };

    const selectedSize = sizes[textSizeSelector.value];
    document.body.style.fontSize = selectedSize;
    document.body.classList.remove("text-small", "text-medium", "text-large");
    switch (selectedSize) {
      case "14px":
        document.body.classList.add("text-small");
        break;
      case "16px":
        document.body.classList.add("text-medium");
        break;
      case "20px":
        document.body.classList.add("text-large");
        break;
    }

    localStorage.setItem("preferredFontSize", selectedSize);

    if (localStorage.getItem("Reader") === "true") {
      const lang = localStorage.getItem("preferredLang") || "fr";
      const translations = {
        fr: {
          text_1: "Petite taille de texte",
          text_2: "Moyenne taille de texte",
          text_3: "Grande taille de texte",
        },
        en: {
          text_1: "small text size",
          text_2: "Medium text size",
          text_3: "Big text size",
        },
      };
      const key = labels[textSizeSelector.value];
      const text = translations[lang][key];
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = lang === "fr" ? "fr-FR" : "en-US";
      speechSynthesis.speak(msg);
    }
  });
}

// Dark / Light mode handler
if (themeToggle) {
  themeToggle.addEventListener("change", () => {
    document.body.classList.toggle("dark-mode", themeToggle.checked);
    themeToggle.checked
      ? localStorage.setItem("preferredTheme", "Dark")
      : localStorage.setItem("preferredTheme", "Light"); // Ternary use for set the localstorage of the theme by either 'Light' or 'Dark'
  });
}

// Reader
if (readerToggle) {
  readerToggle.addEventListener("change", () => {
    readerMode = readerToggle.checked;
    localStorage.setItem("Reader", readerToggle.checked);
  });
}

// Langage
if (langSelector) {
  langSelector.addEventListener("change", () => {
    localStorage.setItem("preferredLang", langSelector.value);
    window.location.reload();

    if (localStorage.getItem("Reader") === "true") {
      const translations = {
        fr: { fr: " language Français", en: "language Anglais" },
        en: { fr: "French language", en: "English language" },
      };
      const lang = langSelector.value;
      const currentLang = localStorage.getItem("preferredLang") || "fr";
      const text = translations[currentLang][lang];
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = lang === "fr" ? "fr-FR" : "en-US";
      speechSynthesis.speak(msg);
    }
  });
}

// Presentation Mode
if (presToggle) {
  presToggle.addEventListener("change", () => {
    if (presToggle.checked) {
      navToggle.checked = false;
      localStorage.setItem("NavigationMode", "false");
    } else {
      navToggle.checked = true;
      localStorage.setItem("NavigationMode", "true");
    }
    localStorage.setItem(
      "PresentationMode",
      presToggle.checked ? "true" : "false"
    );
  });
}

// Navigation Mode
if (navToggle) {
  navToggle.addEventListener("change", () => {
    if (navToggle.checked) {
      presToggle.checked = false;
      localStorage.setItem("PresentationMode", "false");
      localStorage.setItem("NavigationMode", "true");
    } else {
      presToggle.checked = true;
      localStorage.setItem("PresentationMode", "true");
      localStorage.setItem("NavigationMode", "false");
    }
  });
}

// Main hand (dominant hand)
if (handSelector) {
  const storedHand = localStorage.getItem("dominantHand");
  if (!storedHand) {
    handSelector.value = "right";
    localStorage.setItem("dominantHand", "right");
    if (window.electronAPI && window.electronAPI.sendToPython) {
      window.electronAPI.sendToPython("MAIN_HAND_RIGHT");
    }
  } else {
    handSelector.value = storedHand;
    if (window.electronAPI && window.electronAPI.sendToPython) {
      window.electronAPI.sendToPython(
        storedHand === "left" ? "MAIN_HAND_LEFT" : "MAIN_HAND_RIGHT"
      );
    }
  }
  handSelector.addEventListener("change", () => {
    localStorage.setItem("dominantHand", handSelector.value);
    if (window.electronAPI && window.electronAPI.sendToPython) {
      window.electronAPI.sendToPython(
        handSelector.value === "left" ? "MAIN_HAND_LEFT" : "MAIN_HAND_RIGHT"
      );
    }
    if (localStorage.getItem("Reader") === "true") {
      const translations = {
        fr: { left: "main gauche", right: "main droite" },
        en: { left: "left hand", right: "right hand" },
      };
      const lang = localStorage.getItem("preferredLang") || "fr";
      const text = translations[lang][handSelector.value];
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = lang === "fr" ? "fr-FR" : "en-US";
      speechSynthesis.speak(msg);
    }
  });
}

// Video Stream toggle handler
if (videoStreamToggle) {
  // Toujours désactivé par défaut (ne pas restaurer l'état)
  videoStreamToggle.checked = false;

  videoStreamToggle.addEventListener("change", () => {
    const enabled = videoStreamToggle.checked;
    console.log("[VideoStream] Toggle changed:", enabled);
    console.log("[VideoStream] electronAPI:", window.electronAPI);

    if (window.electronAPI) {
      console.log("[VideoStream] Available methods:", Object.keys(window.electronAPI));
      if (enabled) {
        if (window.electronAPI.openVideoStream) {
          console.log("[VideoStream] Calling openVideoStream()...");
          window.electronAPI.openVideoStream();
        } else {
          console.error("[VideoStream] openVideoStream not available");
        }
      } else {
        if (window.electronAPI.closeVideoStream) {
          console.log("[VideoStream] Calling closeVideoStream()...");
          window.electronAPI.closeVideoStream();
        } else {
          console.error("[VideoStream] closeVideoStream not available");
        }
      }
    } else {
      console.error("[VideoStream] electronAPI not available");
    }
  });
}

// Hints toggle handler
if (hintsToggle) {
  // Restore state from localStorage (default to true/enabled)
  const hintsEnabled = localStorage.getItem("hintsEnabled") !== "false";
  hintsToggle.checked = hintsEnabled;

  hintsToggle.addEventListener("change", () => {
    const enabled = hintsToggle.checked;
    localStorage.setItem("hintsEnabled", enabled);
    console.log("[Hints] Toggle changed:", enabled);

    if (window.electronAPI && window.electronAPI.setHintsEnabled) {
      console.log("[Hints] Calling setHintsEnabled()...");
      window.electronAPI.setHintsEnabled(enabled);
    } else {
      console.error("[Hints] setHintsEnabled not available on electronAPI");
    }
  });
}

// Fermer l'aperçu caméra quand on quitte les settings
document.addEventListener("DOMContentLoaded", () => {
  const backButton = document.querySelector('a[href="../index.html"]');
  if (backButton) {
    backButton.addEventListener("click", (e) => {
      // Fermer la fenêtre vidéo si elle est ouverte
      if (window.electronAPI && window.electronAPI.closeVideoStream) {
        console.log("[VideoStream] Closing video stream on settings exit...");
        window.electronAPI.closeVideoStream();
      }
    });
  }
});
