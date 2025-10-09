#include "Settings.h"
#include <QColor>

Settings::Settings() {
    settings = new QSettings("LighTouch", "LighTouch");
}

Settings::~Settings() {
    delete settings;
}

QString Settings::getLanguage() const {
    return settings->value("language", "fr").toString();
}

void Settings::setLanguage(const QString& lang) {
    settings->setValue("language", lang);
}

QString Settings::getDeviceStatusString() const {
    return settings->value("deviceStatusString", "device_not_connected").toString();
}

void Settings::setDeviceStatusString(const QString& status) {
    settings->setValue("deviceStatusString", status);
}

QColor Settings::getDeviceStatusColor(bool isDarkMode) const {
    if (isDarkMode) {
        return QColor(settings->value("deviceStatusColorDark", "#c81927").toString());
    } else {
        return QColor(settings->value("deviceStatusColorLight", "#9a3412").toString());
    }
}

void Settings::setDeviceStatusColor(const QColor& lightColor, const QColor& darkColor) {
    settings->setValue("deviceStatusColorLight", lightColor.name());
    settings->setValue("deviceStatusColorDark", darkColor.name());
}

QString Settings::getDominantHand() const {
    return settings->value("dominantHand", "right").toString();
}

void Settings::setDominantHand(const QString& hand) {
    settings->setValue("dominantHand", hand);
}

bool Settings::isDarkMode() const {
    return settings->value("darkMode", false).toBool();
}

void Settings::setDarkMode(bool dark) {
    settings->setValue("darkMode", dark);
}

bool Settings::areActionsEnabled() const {
    return settings->value("actionsEnabled", true).toBool();
}

void Settings::setActionsEnabled(bool enabled) {
    settings->setValue("actionsEnabled", enabled);
}

bool Settings::isFirstRun() const {
    return settings->value("firstRun", true).toBool();
}

void Settings::setFirstRun(bool firstRun) {
    settings->setValue("firstRun", firstRun);
}

// Keybindings
QString Settings::getKeybindSwipeLeft() const {
    return settings->value("keybindings/swipe_left", "Left").toString();
}

void Settings::setKeybindSwipeLeft(const QString& key) {
    settings->setValue("keybindings/swipe_left", key);
}

QString Settings::getKeybindSwipeRight() const {
    return settings->value("keybindings/swipe_right", "Right").toString();
}

void Settings::setKeybindSwipeRight(const QString& key) {
    settings->setValue("keybindings/swipe_right", key);
}

QString Settings::getKeybindClick() const {
    return settings->value("keybindings/click", "Return").toString();
}

void Settings::setKeybindClick(const QString& key) {
    settings->setValue("keybindings/click", key);
}

// Screen Reader
bool Settings::isScreenReaderEnabled() const {
    return settings->value("accessibility/screen_reader", false).toBool();
}

void Settings::setScreenReaderEnabled(bool enabled) {
    settings->setValue("accessibility/screen_reader", enabled);
}

// Text Size
int Settings::getTextSize() const {
    return settings->value("ui/text_size", Medium).toInt();
}

void Settings::setTextSize(int size) {
    settings->setValue("ui/text_size", size);
}

// Mode Presentation
bool Settings::isPresentationMode() const {
    return settings->value("mode/presentation", false).toBool();
}

void Settings::setPresentationMode(bool enabled) {
    settings->setValue("mode/presentation", enabled);
}
