class Settings {
    constructor() {
        this.settings = {
            name: 'Settings',
            theme: 'light',
            notifications: true,
            logs: true,
        };
    }

    // Methods to get and set settings

    setTheme(theme) {
        this.settings.theme = theme;
    }

    setNotifications(enabled) {
        this.settings.notifications = enabled;
    }

    setLogs(enabled) {
        this.settings.logs = enabled;
    }

    getSettings() {
        return this.settings;
    }

    // Lightouch methods

    startCalibration() {};
    stopCalibration() {};
}

module.exports = Settings;
