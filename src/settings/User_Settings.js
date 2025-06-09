window.addEventListener('DOMContentLoaded', () => {
    const savedFontSize = localStorage.getItem('preferredFontSize');
    const savedTheme = localStorage.getItem('preferredTheme');
    const savedLang = localStorage.getItem('preferredLang');

    if (savedFontSize) {
      document.body.style.fontSize = savedFontSize;
    }

    const textSizeSelector = document.getElementById('text-size-slider');
    const toggleThemeSelector = document.getElementById('theme-toggle');
    const inputLang = document.getElementById('lang-selector');

    applyTranslations(savedLang);

    if (savedTheme && toggleThemeSelector) {
        toggleThemeSelector.checked = savedTheme === 'Dark';
      }

    if (savedTheme) {
        document.body.classList.toggle('dark-mode', savedTheme === 'Dark');
    }

    if (textSizeSelector && savedFontSize) {
      const reverseSizes = {
        '14px': '1',
        '16px': '2',
        '20px': '3'
      };
      textSizeSelector.value = reverseSizes[savedFontSize];
    }

    if (inputLang && savedLang) {
      inputLang.value = savedLang;
    }

});
