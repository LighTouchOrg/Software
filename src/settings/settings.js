const textSizeSelector = document.getElementById('text-size-slider');
const themeToggle = document.getElementById('theme-toggle');
const readerToggle = document.getElementById('reader-toggle');
const langToggle = document.getElementById('lang-selector');

let readerMode = false;

// Text size handler
textSizeSelector.addEventListener('input', () => {
  const sizes = {
    1: '14px',
    2: '16px',
    3: '20px'
  };

  const selectedSize = sizes[textSizeSelector.value];
  document.body.style.fontSize = selectedSize;

  localStorage.setItem('preferredFontSize', selectedSize); // Using localstorage to save the preference of the user
});

// Dark / Light mode handler
themeToggle.addEventListener('change', () => {
  document.body.classList.toggle('dark-mode', themeToggle.checked);
  themeToggle.checked ? localStorage.setItem('preferredTheme', "Dark") : localStorage.setItem('preferredTheme', "Light"); // Ternary use for set the localstorage of the theme by either 'Light' or 'Dark'
});

// Reader
readerToggle.addEventListener('change', () => {
  readerMode = readerToggle.checked;
  console.log("Mode liseuse numérique :", readerMode);
});

langToggle.addEventListener('change', () => {
  localStorage.setItem('preferredLang', langToggle.value);
  window.location.reload();
  console.log("Langage changed for : ", langToggle.value);
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
