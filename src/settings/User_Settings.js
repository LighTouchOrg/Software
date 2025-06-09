window.addEventListener('DOMContentLoaded', () => {
    const savedFontSize = localStorage.getItem('preferredFontSize');
    const savedTheme = localStorage.getItem('preferedTheme');
    if (savedFontSize) {
      document.body.style.fontSize = savedFontSize;
    }

    const textSizeSelector = document.getElementById('text-size-slider');
    const toggleThemeSelector = document.getElementById('theme-toggle');

    console.log("Size text : ", savedFontSize);
    console.log("Theme toggle : ", savedTheme);

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
      console.log("Text size : ", textSizeSelector.value);
    }

});
