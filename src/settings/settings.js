const textSizeSelector = document.getElementById('text-size-slider');
const themeToggle = document.getElementById('theme-toggle');
const readerToggle = document.getElementById('reader-toggle');
const langToggle = document.getElementById('lang-selector');
const presToggle = document.getElementById('presentation-toggle');
const navToggle = document.getElementById('nav-toggle');

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
  document.body.classList.remove('text-small', 'text-medium', 'text-large');
  switch(selectedSize) {
    case '14px':
      document.body.classList.add('text-small');
      break;
    case '16px':
      document.body.classList.add('text-medium');
      break;
    case '20px':
      document.body.classList.add('text-large');
      break;
  }

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
  localStorage.setItem('Reader', readerToggle.checked);
});


// Langage
langToggle.addEventListener('change', () => {
  localStorage.setItem('preferredLang', langToggle.value);
  window.location.reload();
});

// Presentation Mode
if (presToggle) {
  presToggle.addEventListener('change', () => {
    if (presToggle.checked) {
      navToggle.checked = false;
      localStorage.setItem('NavigationMode', 'false');
    }
    localStorage.setItem('PresentationMode', presToggle.checked ? 'true' : 'false');
  });
}

// Navigation Mode
if (navToggle) {
  navToggle.addEventListener('change', () => {
    if (navToggle.checked) {
      presToggle.checked = false;
      localStorage.setItem('PresentationMode', 'false');
    }
    localStorage.setItem('NavigationMode', navToggle.checked ? 'true' : 'false');
  });
}
