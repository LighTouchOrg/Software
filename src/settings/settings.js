const textSizeSelector = document.getElementById('text-size-slider');
const themeToggle = document.getElementById('theme-toggle');
const readerToggle = document.getElementById('reader-toggle');

let readerMode = false;

// Gestion de la taille du texte
textSizeSelector.addEventListener('input', () => {
  const sizes = {
    1: '14px',
    2: '16px',
    3: '20px'
  };
  document.body.style.fontSize = sizes[textSizeSelector.value];
});

// Gestion du thème sombre / clair
themeToggle.addEventListener('change', () => {
  document.body.classList.toggle('dark-mode', themeToggle.checked);
  console.log("Theme changed")
});

// Gestion du mode liseuse numérique
readerToggle.addEventListener('change', () => {
  readerMode = readerToggle.checked;
  console.log("Mode liseuse numérique :", readerMode);
});

// Fonction pour lire du texte à haute voix si mode liseuse activé
// liseuse.addEventListener('click', () => {
//   console.log(window.speechSynthesis.getVoices());
//   lireTexte("Quoicoubeh");
// });

// function lireTexte(texte) {
//   if (!readerMode) return;
//   console.log("Read");
//   const synth = window.speechSynthesis;
//   const utterance = new SpeechSynthesisUtterance(texte);
//   utterance.lang = 'fr-FR';
//   synth.speak(utterance);
// }
