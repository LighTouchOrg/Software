#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <QPushButton>
#include <QLabel>
#include <QVBoxLayout>
#include <QHBoxLayout>
#include "DeviceController.h"
#include "CalibrationWindow.h"
#include "SettingsWindow.h"
#include "OnboardingWindow.h"

class MainWindow : public QMainWindow {
    Q_OBJECT

public:
    explicit MainWindow(QWidget* parent = nullptr);
    ~MainWindow();

protected:
    void keyPressEvent(QKeyEvent* event) override;

private slots:
    void onCalibrateClicked();
    void onSettingsClicked();
    void onKeyBindingClicked();
    void onTutorialClicked();
    void updateDeviceStatus(const QString& status);
    void onDeviceConnected();
    void onDeviceDisconnected();
    void toggleTheme();
    void toggleLanguage();
    void updateEnabledStatusDisplay();

private:
    void setupUI();
    void applyTheme();
    void updateTranslations();
    QString getStatusMessage(const QString& statusKey);
    
    // UI Components
    QPushButton* calibrateButton;
    QPushButton* settingsButton;
    QPushButton* keyBindingButton;
    QPushButton* tutorialButton;
    QPushButton* themeToggleButton;
    QPushButton* langToggleButton;
    QLabel* deviceStatusLabel;
    QLabel* enabledStatusLabel;
    QLabel* titleLabel;
    QLabel* logoLabel;
    
    // Controllers and Windows
    DeviceController* deviceController;
    CalibrationWindow* calibrationWindow;
    SettingsWindow* settingsWindow;
    OnboardingWindow* onboardingWindow;
    class KeyBindingsWindow* keyBindingsWindow;
    
    // State
    bool isDarkMode;
    QString currentLanguage;
    
    // Status messages for internationalization
    QMap<QString, QMap<QString, QString>> statusMessages;
};

#endif // MAINWINDOW_H
