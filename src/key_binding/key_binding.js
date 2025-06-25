window.addEventListener('DOMContentLoaded', () => {
    const RightSwipe = document.getElementById('right_swipe');
    const LeftSwipe = document.getElementById('left_swipe');

    const lang = localStorage.getItem('preferredLang') || 'en';

    if (RightSwipe) {
        RightSwipe.textContent = getTranslatedKey('Swipe_Right_Key', 'ArrowRight', lang);
    }
    if (LeftSwipe) {
        LeftSwipe.textContent = getTranslatedKey('Swipe_Left_Key', 'ArrowLeft', lang);
    }

    addKeybindListener(RightSwipe, 'Swipe_Right_Key', lang, ['Swipe_Left_Key']);
    addKeybindListener(LeftSwipe, 'Swipe_Left_Key', lang, ['Swipe_Right_Key']);
});

const keyTranslations = {
    "ArrowLeft": "Flèche gauche",
    "ArrowRight": "Flèche droite",
    "ArrowUp": "Flèche haut",
    "ArrowDown": "Flèche bas",
    "Space": "Espace"
};

function getTranslatedKey(storageKey, defaultKey, lang = 'en') {
    const storedKey = localStorage.getItem(storageKey) || defaultKey;
    return lang === 'fr' ? (keyTranslations[storedKey] || storedKey) : storedKey;
}

function isKeyUsedElsewhere(key, otherKeys) {
    return otherKeys.some(k => localStorage.getItem(k) === key);
}

function addKeybindListener(element, storageKey, lang, otherKeys = []) {
    if (!element) return;

    element.addEventListener('keydown', (event) => {
        event.preventDefault();
        const rawKey = event.key;
        const key = getDisplayKey(rawKey);

        if (isKeyUsedElsewhere(key, otherKeys)) {
            element.classList.add('key-conflict');
            if (lang == 'en')
                showToast(`Key "${key}" already used for another key.`);
            else
                showToast(`La touche "${key}" est deja utilisee pour une autre action.`);
            return;
        } else {
            element.classList.remove('key-conflict');
        }

        const translated = lang === 'fr' ? (keyTranslations[key] || key) : key;
        element.textContent = translated;

        localStorage.setItem(storageKey, key);
        console.log(`${storageKey}:`, key);
    });

    element.addEventListener('click', () => {
        element.focus();
    });
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.getElementById('toast-container').appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function getDisplayKey(key) {
    if (key === ' ') return 'Space';
    return key;
}
