#ifndef SETTINGSWINDOW_H
#define SETTINGSWINDOW_H

#include <QWidget>
#include <QComboBox>
#include <QCheckBox>
#include <QPushButton>
#include <QLabel>
#include "DeviceController.h"

class SettingsWindow : public QWidget {
    Q_OBJECT

public:
    explicit SettingsWindow(DeviceController* controller, QWidget* parent = nullptr);
    ~SettingsWindow();

private slots:
    void onDominantHandChanged(int index);
    void onLanguageChanged(int index);
    void onThemeChanged(int index);
    void onTextSizeChanged(int index);
    void onScreenReaderToggled(bool checked);
    void onPresentationModeToggled(bool checked);

private:
    void setupUI();
    void loadSettings();
    
    DeviceController* deviceController;
    
    QComboBox* dominantHandCombo;
    QComboBox* languageCombo;
    QComboBox* themeCombo;
    QComboBox* textSizeCombo;
    QCheckBox* screenReaderCheckbox;
    QCheckBox* presentationModeCheckbox;
    
    QLabel* titleLabel;
};

#endif // SETTINGSWINDOW_H
