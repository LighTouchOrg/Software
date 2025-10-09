#ifndef SETTINGS_H
#define SETTINGS_H

#include <QString>
#include <QSettings>
#include <QLocale>

class Settings {
public:
    Settings();
    ~Settings();
    
    // Language settings
    QString getLanguage() const;
    void setLanguage(const QString& lang);
    
    // Device status
    QString getDeviceStatusString() const;
    void setDeviceStatusString(const QString& status);
    
    QColor getDeviceStatusColor(bool isDarkMode) const;
    void setDeviceStatusColor(const QColor& lightColor, const QColor& darkColor);
    
    // Dominant hand
    QString getDominantHand() const;
    void setDominantHand(const QString& hand); // "left" or "right"
    
    // Theme
    bool isDarkMode() const;
    void setDarkMode(bool dark);
    
    // Actions enabled/disabled
    bool areActionsEnabled() const;
    void setActionsEnabled(bool enabled);
    
    // First run / onboarding
    bool isFirstRun() const;
    void setFirstRun(bool firstRun);
    
    // Keybindings
    QString getKeybindSwipeLeft() const;
    void setKeybindSwipeLeft(const QString& key);
    
    QString getKeybindSwipeRight() const;
    void setKeybindSwipeRight(const QString& key);
    
    QString getKeybindClick() const;
    void setKeybindClick(const QString& key);
    
    // Screen Reader
    bool isScreenReaderEnabled() const;
    void setScreenReaderEnabled(bool enabled);
    
    // Text Size
    enum TextSize { Small = 14, Medium = 16, Large = 20 };
    int getTextSize() const;
    void setTextSize(int size);
    
    // Mode Presentation
    bool isPresentationMode() const;
    void setPresentationMode(bool enabled);
    
private:
    QSettings* settings;
};

#endif // SETTINGS_H
