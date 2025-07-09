window.addEventListener("DOMContentLoaded", () => {
  const savedFontSize = localStorage.getItem("preferredFontSize");
  const savedTheme =
    localStorage.getItem("preferredTheme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "Dark"
      : "Light");
  const savedLang = localStorage.getItem("preferredLang");
  const savedReader = localStorage.getItem("Reader");
  const savedPres = localStorage.getItem("PresentationMode");
  const savedNav = localStorage.getItem("NavigationMode");
  const savedHand = localStorage.getItem("dominantHand");

  const textSizeSelector = document.getElementById("text-size-slider");
  const toggleThemeSelector = document.getElementById("theme-toggle");
  const inputLang = document.getElementById("lang-selector");
  const reader = document.getElementById("reader-toggle");
  const presToggle = document.getElementById("presentation-toggle");
  const navToggle = document.getElementById("nav-toggle");
  const handSelector = document.getElementById("hand-selector");

  if (savedFontSize) {
    document.body.style.fontSize = savedFontSize;
  }

  applyTranslations(savedLang);

  if (savedTheme) {
    document.body.classList.toggle("dark-mode", savedTheme === "Dark");
  }

  if (toggleThemeSelector) {
    toggleThemeSelector.checked = savedTheme === "Dark";
  }

  if (textSizeSelector && savedFontSize) {
    const reverseSizes = {
      "14px": "1",
      "16px": "2",
      "20px": "3",
    };
    textSizeSelector.value = reverseSizes[savedFontSize];
  }

  if (reader && savedReader) {
    reader.checked = savedReader === "true";
  }

  if (inputLang && savedLang) {
    inputLang.value = savedLang;
  }

  if (handSelector && savedHand) {
    handSelector.value = savedHand;
  }

  const presEnabled = savedPres === "true";
  const navEnabled = savedNav === "true";

  if (presToggle && navToggle) {
    if (!savedPres && !savedNav) {
      presToggle.checked = true;
      navToggle.checked = false;
      localStorage.setItem("PresentationMode", "true");
      localStorage.setItem("NavigationMode", "false");
    } else {
      presToggle.checked = presEnabled;
      navToggle.checked = navEnabled;

      if (!presEnabled && !navEnabled) {
        presToggle.checked = true;
        localStorage.setItem("PresentationMode", "true");
      }
    }
  }
});
