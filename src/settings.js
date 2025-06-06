const settingsButton = document.getElementById('settings-button');
const settingsPanel = document.getElementById('settings-panel');
const textSizeSelector = document.getElementById('text-size');
const themeToggle = document.getElementById('theme-toggle');
const readerToggle = document.getElementById('reader-toggle');

let readerMode = false;

settingsButton.addEventListener('click', () => {
  settingsPanel.classList.toggle('hidden');
});

textSizeSelector.addEventListener('change', () => {
  document.body.style.fontSize = {
    small: '14px',
    medium: '16px',
    large: '20px'
  }[textSizeSelector.value];
});

themeToggle.addEventListener('change', () => {
  document.body.classList.toggle('dark-mode', themeToggle.value === 'dark');
});

readerToggle.addEventListener('change', () => {
  readerMode = readerToggle.checked;
});

// Fonction pour lire à haute voix
function lireTexte(texte) {
  if (!readerMode) return;
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(texte);
  utterance.lang = 'fr-FR';
  synth.speak(utterance);
}

// Exemple d'usage :
document.getElementById('calibrate-button').addEventListener('click', () => {
  lireTexte('Calibrer la caméra');
});
