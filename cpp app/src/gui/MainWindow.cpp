#include "MainWindow.h"
#include "ToastWidget.h"
#include "KeyBindingsWindow.h"
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QPushButton>
#include <QLabel>
#include <QFrame>
#include <QPixmap>
#include <QKeyEvent>
#include <QDebug>
#include <QApplication>

MainWindow::MainWindow(QWidget* parent)
    : QMainWindow(parent)
    , deviceController(new DeviceController(this))
    , calibrationWindow(nullptr)
    , settingsWindow(nullptr)
    , onboardingWindow(nullptr)
    , keyBindingsWindow(nullptr)
    , isDarkMode(false)
    , currentLanguage("fr")
{
    // Initialize status messages
    statusMessages["fr"]["calibration_done"] = "Calibration terminée.";
    statusMessages["fr"]["calibration_failed"] = "Calibration échouée. Veuillez réessayer.";
    statusMessages["fr"]["calibration_interrupted"] = "Calibration interrompue.";
    statusMessages["fr"]["device_connected"] = "Votre appareil LighTouch est connecté.";
    statusMessages["fr"]["device_not_connected"] = "Aucun appareil Bluetooth connecté.";
    statusMessages["fr"]["disabled"] = "Les actions sont désactivées. Appuyez sur la barre d'espace pour les réactiver.";
    
    statusMessages["en"]["calibration_done"] = "Calibration finished.";
    statusMessages["en"]["calibration_failed"] = "Calibration failed. Please try again.";
    statusMessages["en"]["calibration_interrupted"] = "Calibration interrupted.";
    statusMessages["en"]["device_connected"] = "Your LighTouch device is connected.";
    statusMessages["en"]["device_not_connected"] = "No Bluetooth device connected.";
    statusMessages["en"]["disabled"] = "Actions are disabled. Press the spacebar to re-enable them.";
    
    // Load settings
    Settings settings;
    isDarkMode = settings.isDarkMode();
    currentLanguage = settings.getLanguage();
    
    setupUI();
    applyTheme();
    
    // Initialize Toast Manager
    ToastManager::instance().setParentWidget(this);
    
    // Connect DeviceController signals
    connect(deviceController, &DeviceController::deviceConnected,
            this, &MainWindow::onDeviceConnected);
    connect(deviceController, &DeviceController::deviceDisconnected,
            this, &MainWindow::onDeviceDisconnected);
    connect(deviceController, &DeviceController::deviceStatusChanged,
            this, &MainWindow::updateDeviceStatus);
    
    // Check if first run
    if (settings.isFirstRun()) {
        settings.setFirstRun(false);
        // Show onboarding (will be implemented later)
    }
    
    // Update initial status
    updateDeviceStatus(deviceController->getDeviceStatus());
    updateEnabledStatusDisplay();
}

MainWindow::~MainWindow() {
    if (calibrationWindow) delete calibrationWindow;
    if (settingsWindow) delete settingsWindow;
    if (onboardingWindow) delete onboardingWindow;
    if (keyBindingsWindow) delete keyBindingsWindow;
}

void MainWindow::setupUI() {
    setWindowTitle("LighTouch");
    setMinimumSize(800, 600);
    resize(1150, 875);
    
    // Widget central avec layout vertical CENTRÉ comme Electron
    QWidget* centralWidget = new QWidget(this);
    centralWidget->setObjectName("centralWidget");
    QVBoxLayout* mainLayout = new QVBoxLayout(centralWidget);
    mainLayout->setAlignment(Qt::AlignCenter);
    mainLayout->setSpacing(20);
    mainLayout->setContentsMargins(40, 60, 40, 40);
    
    // Logo LighTouch (80x80)
    logoLabel = new QLabel(this);
    logoLabel->setFixedSize(80, 80);
    logoLabel->setAlignment(Qt::AlignCenter);
    logoLabel->setScaledContents(true);
    QPixmap logo(":/img/lightouch-logo-cropped.png");
    if (!logo.isNull()) {
        logoLabel->setPixmap(logo);
    } else {
        logoLabel->setText("🎯"); // Fallback emoji
        QFont logoFont = logoLabel->font();
        logoFont.setPointSize(48);
        logoLabel->setFont(logoFont);
    }
    mainLayout->addWidget(logoLabel, 0, Qt::AlignCenter);
    
    // Titre "LighTouch" avec effet outline
    titleLabel = new QLabel("LighTouch", this);
    titleLabel->setObjectName("titleLabel");
    titleLabel->setAlignment(Qt::AlignCenter);
    QFont titleFont("League Spartan", 60, QFont::Bold);
    titleLabel->setFont(titleFont);
    mainLayout->addWidget(titleLabel, 0, Qt::AlignCenter);
    
    mainLayout->addSpacing(20);
    
    // GROS BOUTONS (Calibrate + Onboarding) - comme dans Electron
    calibrateButton = new QPushButton(currentLanguage == "fr" ? "Calibration" : "Calibrate", this);
    calibrateButton->setObjectName("calibrateButton");
    calibrateButton->setMinimumSize(400, 60);
    calibrateButton->setMaximumWidth(500);
    QFont buttonFont("League Spartan", 18, QFont::Bold);
    calibrateButton->setFont(buttonFont);
    connect(calibrateButton, &QPushButton::clicked, this, &MainWindow::onCalibrateClicked);
    mainLayout->addWidget(calibrateButton, 0, Qt::AlignCenter);
    
    tutorialButton = new QPushButton(currentLanguage == "fr" ? "Tutoriel" : "Onboarding", this);
    tutorialButton->setObjectName("onboardingButton");
    tutorialButton->setMinimumSize(400, 60);
    tutorialButton->setMaximumWidth(500);
    tutorialButton->setFont(buttonFont);
    connect(tutorialButton, &QPushButton::clicked, this, &MainWindow::onTutorialClicked);
    mainLayout->addWidget(tutorialButton, 0, Qt::AlignCenter);
    
    mainLayout->addSpacing(10);
    
    // PETITS BOUTONS (Settings + Key Bindings) - côte à côte comme Electron
    QHBoxLayout* smallButtonsLayout = new QHBoxLayout();
    smallButtonsLayout->setSpacing(15);
    smallButtonsLayout->setAlignment(Qt::AlignCenter);
    
    settingsButton = new QPushButton(currentLanguage == "fr" ? "Paramètres" : "Settings", this);
    settingsButton->setObjectName("settingsButton");
    settingsButton->setMinimumSize(190, 45);
    settingsButton->setMaximumSize(250, 45);
    QFont smallButtonFont("League Spartan", 14, QFont::Bold);
    settingsButton->setFont(smallButtonFont);
    connect(settingsButton, &QPushButton::clicked, this, &MainWindow::onSettingsClicked);
    smallButtonsLayout->addWidget(settingsButton);
    
    keyBindingButton = new QPushButton(currentLanguage == "fr" ? "Raccourcis" : "Key Bindings", this);
    keyBindingButton->setObjectName("keybindButton");
    keyBindingButton->setMinimumSize(190, 45);
    keyBindingButton->setMaximumSize(250, 45);
    keyBindingButton->setFont(smallButtonFont);
    connect(keyBindingButton, &QPushButton::clicked, this, &MainWindow::onKeyBindingClicked);
    smallButtonsLayout->addWidget(keyBindingButton);
    
    mainLayout->addLayout(smallButtonsLayout);
    
    mainLayout->addSpacing(20);
    
    // Device Status Box - centré avec frame comme Electron
    QFrame* statusFrame = new QFrame(this);
    statusFrame->setObjectName("statusFrame");
    statusFrame->setMaximumWidth(480);
    QVBoxLayout* statusLayout = new QVBoxLayout(statusFrame);
    statusLayout->setContentsMargins(12, 12, 12, 12);
    
    deviceStatusLabel = new QLabel(this);
    deviceStatusLabel->setObjectName("deviceStatusLabel");
    deviceStatusLabel->setAlignment(Qt::AlignCenter);
    deviceStatusLabel->setWordWrap(true);
    QFont statusFont("League Spartan", 18, QFont::Bold);
    deviceStatusLabel->setFont(statusFont);
    statusLayout->addWidget(deviceStatusLabel);
    
    mainLayout->addWidget(statusFrame, 0, Qt::AlignCenter);
    
    // Enabled Status (en dessous)
    enabledStatusLabel = new QLabel(this);
    enabledStatusLabel->setObjectName("enabledStatusLabel");
    enabledStatusLabel->setAlignment(Qt::AlignCenter);
    enabledStatusLabel->setWordWrap(true);
    QFont enabledFont("League Spartan", 14, QFont::Bold);
    enabledStatusLabel->setFont(enabledFont);
    mainLayout->addWidget(enabledStatusLabel, 0, Qt::AlignCenter);
    
    // Push vers le bas
    mainLayout->addStretch();
    
    // Boutons Theme/Lang en haut à droite (position absolue)
    QWidget* topRightWidget = new QWidget(this);
    topRightWidget->setGeometry(width() - 180, 20, 160, 40);
    QHBoxLayout* topRightLayout = new QHBoxLayout(topRightWidget);
    topRightLayout->setSpacing(10);
    topRightLayout->setContentsMargins(0, 0, 0, 0);
    
    themeToggleButton = new QPushButton("🌙/☀️", topRightWidget);
    themeToggleButton->setObjectName("themeToggleButton");
    themeToggleButton->setFixedSize(40, 40);
    connect(themeToggleButton, &QPushButton::clicked, this, &MainWindow::toggleTheme);
    topRightLayout->addWidget(themeToggleButton);
    
    langToggleButton = new QPushButton("FR/EN", topRightWidget);
    langToggleButton->setObjectName("langToggleButton");
    langToggleButton->setFixedSize(60, 40);
    connect(langToggleButton, &QPushButton::clicked, this, &MainWindow::toggleLanguage);
    topRightLayout->addWidget(langToggleButton);
    
    setCentralWidget(centralWidget);
}

void MainWindow::applyTheme() {
    QString styleSheet;
    
    if (isDarkMode) {
        // Mode sombre avec design Electron exact
        styleSheet = R"(
            QMainWindow {
                background: qradialgradient(cx:0.5, cy:0.5, radius:0.8,
                    fx:0.5, fy:0.5,
                    stop:0 #2c2535,
                    stop:0.8 #1f1b24);
            }
            QWidget#centralWidget {
                background: transparent;
            }
            QLabel#titleLabel {
                color: #e0e0e0;
                font-size: 60px;
                font-weight: bold;
                font-family: 'League Spartan', 'Segoe UI', sans-serif;
            }
            QLabel {
                color: #e0e0e0;
                font-family: 'League Spartan', 'Segoe UI', sans-serif;
                font-weight: bold;
            }
            QFrame#statusFrame {
                background-color: rgba(31, 27, 36, 0.8);
                border: 2px solid #2a9d8f;
                border-radius: 8px;
                padding: 12px;
            }
            QLabel#deviceStatusLabel {
                background-color: transparent;
                border: none;
                font-size: 18px;
                color: #9a3412;
            }
            QLabel#deviceStatusLabel[connected="true"] {
                color: #2a9d8f;
            }
            QLabel#deviceStatusLabel[interrupted="true"] {
                color: #191970;
            }
            /* GROS BOUTONS (Calibrate et Onboarding) */
            QPushButton#calibrateButton,
            QPushButton#onboardingButton {
                background-color: #301d55;
                color: #e0e0e0;
                border: 2px solid #8b5cf6;
                border-radius: 12px;
                padding: 15px 30px;
                font-size: 18px;
                font-weight: bold;
                font-family: 'League Spartan', 'Segoe UI', sans-serif;
                min-height: 60px;
            }
            QPushButton#calibrateButton:hover,
            QPushButton#onboardingButton:hover {
                background-color: #8b5cf6;
                border-color: #8b5cf6;
            }
            QPushButton#calibrateButton:pressed,
            QPushButton#onboardingButton:pressed {
                background-color: #1d1136;
            }
            QPushButton#calibrateButton:disabled,
            QPushButton#onboardingButton:disabled {
                background-color: #4a4a4a;
                color: #888888;
                border-color: #666666;
            }
            /* PETITS BOUTONS (Settings et KeyBindings) */
            QPushButton#settingsButton,
            QPushButton#keybindButton {
                background-color: #301d55;
                color: #e0e0e0;
                border: 2px solid rgba(138, 92, 246, 0.5);
                border-radius: 8px;
                padding: 10px 20px;
                font-size: 14px;
                font-weight: bold;
                font-family: 'League Spartan', 'Segoe UI', sans-serif;
                min-height: 45px;
            }
            QPushButton#settingsButton:hover,
            QPushButton#keybindButton:hover {
                background-color: #8b5cf6;
                border-color: #8b5cf6;
            }
            QPushButton#settingsButton:pressed,
            QPushButton#keybindButton:pressed {
                background-color: #1d1136;
            }
            QPushButton#themeToggleButton,
            QPushButton#langToggleButton {
                min-height: 40px;
                max-width: 80px;
                font-size: 16px;
            }
        )";
    } else {
        // Mode clair avec design Electron exact
        styleSheet = R"(
            QMainWindow {
                background: qradialgradient(cx:0.5, cy:0.5, radius:0.8,
                    fx:0.5, fy:0.5,
                    stop:0 #d8d2d2,
                    stop:0.8 #f3f3f3);
            }
            QWidget#centralWidget {
                background: transparent;
            }
            QLabel#titleLabel {
                color: transparent;
                -webkit-text-stroke: 1px #1d1136;
                font-size: 60px;
                font-weight: bold;
                font-family: 'League Spartan', 'Segoe UI', sans-serif;
            }
            QLabel {
                color: #1e1e1e;
                font-family: 'League Spartan', 'Segoe UI', sans-serif;
                font-weight: bold;
            }
            QFrame#statusFrame {
                background-color: rgba(243, 243, 243, 0.8);
                border: 2px solid #2a9d8f;
                border-radius: 8px;
                padding: 12px;
            }
            QLabel#deviceStatusLabel {
                background-color: transparent;
                border: none;
                font-size: 18px;
                color: #9a3412;
            }
            QLabel#deviceStatusLabel[connected="true"] {
                color: #2a9d8f;
            }
            QLabel#deviceStatusLabel[interrupted="true"] {
                color: #191970;
            }
            /* GROS BOUTONS (Calibrate et Onboarding) */
            QPushButton#calibrateButton,
            QPushButton#onboardingButton {
                background-color: #1d1136;
                color: #e0e0e0;
                border: 2px solid #8b5cf6;
                border-radius: 12px;
                padding: 15px 30px;
                font-size: 18px;
                font-weight: bold;
                font-family: 'League Spartan', 'Segoe UI', sans-serif;
                min-height: 60px;
            }
            QPushButton#calibrateButton:hover,
            QPushButton#onboardingButton:hover {
                background-color: #301d55;
                border-color: #8b5cf6;
            }
            QPushButton#calibrateButton:pressed,
            QPushButton#onboardingButton:pressed {
                background-color: #1d1136;
            }
            QPushButton#calibrateButton:disabled,
            QPushButton#onboardingButton:disabled {
                background-color: #e8e8e8;
                color: #999999;
                border-color: #cccccc;
            }
            /* PETITS BOUTONS (Settings et KeyBindings) */
            QPushButton#settingsButton,
            QPushButton#keybindButton {
                background-color: #1d1136;
                color: #e0e0e0;
                border: 2px solid rgba(138, 92, 246, 0.5);
                border-radius: 8px;
                padding: 10px 20px;
                font-size: 14px;
                font-weight: bold;
                font-family: 'League Spartan', 'Segoe UI', sans-serif;
                min-height: 45px;
            }
            QPushButton#settingsButton:hover,
            QPushButton#keybindButton:hover {
                background-color: #301d55;
                border-color: #8b5cf6;
            }
            QPushButton#settingsButton:pressed,
            QPushButton#keybindButton:pressed {
                background-color: #1d1136;
            }
            QPushButton#themeToggleButton,
            QPushButton#langToggleButton {
                background-color: #301d55;
                color: #e0e0e0;
                border: 1px solid rgba(138, 92, 246, 0.3);
                border-radius: 6px;
                padding: 5px 10px;
                font-size: 14px;
                min-height: 40px;
                max-width: 80px;
            }
            QPushButton#themeToggleButton:hover,
            QPushButton#langToggleButton:hover {
                background-color: #8b5cf6;
            }
        )";
    }
    
    setStyleSheet(styleSheet);
    
    // Update device status color
    updateDeviceStatus(deviceController->getDeviceStatus());
}

void MainWindow::updateTranslations() {
    calibrateButton->setText(currentLanguage == "fr" ? "Calibrer" : "Calibrate");
    settingsButton->setText(currentLanguage == "fr" ? "Paramètres" : "Settings");
    keyBindingButton->setText(currentLanguage == "fr" ? "Raccourcis clavier" : "Key Bindings");
    tutorialButton->setText(currentLanguage == "fr" ? "Démarrer le tutoriel" : "Start Tutorial");
    
    // Update status messages
    updateDeviceStatus(deviceController->getDeviceStatus());
    
    if (!deviceController->areActionsEnabled()) {
        enabledStatusLabel->setText(getStatusMessage("disabled"));
    }
}

QString MainWindow::getStatusMessage(const QString& statusKey) {
    if (statusMessages.contains(currentLanguage) && statusMessages[currentLanguage].contains(statusKey)) {
        return statusMessages[currentLanguage][statusKey];
    }
    return statusMessages["fr"][statusKey];
}

void MainWindow::onCalibrateClicked() {
    if (calibrationWindow) {
        delete calibrationWindow;
    }
    
    calibrateButton->setEnabled(false);
    
    calibrationWindow = new CalibrationWindow(deviceController, this);
    calibrationWindow->showFullScreen();
    
    connect(calibrationWindow, &CalibrationWindow::closed, this, [this]() {
        calibrateButton->setEnabled(true);
        calibrationWindow = nullptr;
    });
}

void MainWindow::onSettingsClicked() {
    if (!settingsWindow) {
        settingsWindow = new SettingsWindow(deviceController, this);
    }
    settingsWindow->show();
    settingsWindow->raise();
    settingsWindow->activateWindow();
}

void MainWindow::onKeyBindingClicked() {
    if (!keyBindingsWindow) {
        Settings settings;
        keyBindingsWindow = new KeyBindingsWindow(&settings, this);
    }
    keyBindingsWindow->show();
    keyBindingsWindow->raise();
    keyBindingsWindow->activateWindow();
}

void MainWindow::onTutorialClicked() {
    if (!onboardingWindow) {
        onboardingWindow = new OnboardingWindow(deviceController, this);
    }
    onboardingWindow->showFullScreen();
    onboardingWindow->raise();
    onboardingWindow->activateWindow();
}

void MainWindow::updateDeviceStatus(const QString& status) {
    QString message = getStatusMessage(status);
    deviceStatusLabel->setText(message);
    
    // Update color based on status
    Settings settings;
    QColor color = settings.getDeviceStatusColor(isDarkMode);
    deviceStatusLabel->setStyleSheet(QString("color: %1;").arg(color.name()));
}

void MainWindow::onDeviceConnected() {
    qDebug() << "Main window: Device connected";
    ToastManager::instance().showToast(
        getStatusMessage("device_connected"),
        ToastWidget::Success
    );
}

void MainWindow::onDeviceDisconnected() {
    qDebug() << "Main window: Device disconnected";
    ToastManager::instance().showToast(
        getStatusMessage("device_not_connected"),
        ToastWidget::Warning
    );
}

void MainWindow::toggleTheme() {
    isDarkMode = !isDarkMode;
    Settings settings;
    settings.setDarkMode(isDarkMode);
    applyTheme();
}

void MainWindow::toggleLanguage() {
    currentLanguage = (currentLanguage == "fr") ? "en" : "fr";
    Settings settings;
    settings.setLanguage(currentLanguage);
    updateTranslations();
}

void MainWindow::keyPressEvent(QKeyEvent* event) {
    if (event->key() == Qt::Key_Space) {
        // Toggle actions enabled/disabled
        bool enabled = !deviceController->areActionsEnabled();
        deviceController->enableActions(enabled);
        
        updateEnabledStatusDisplay();
        
        QString message = enabled ? 
            (currentLanguage == "fr" ? "Actions réactivées" : "Actions enabled") :
            (currentLanguage == "fr" ? "Actions désactivées" : "Actions disabled");
        
        ToastManager::instance().showToast(
            message,
            enabled ? ToastWidget::Success : ToastWidget::Warning,
            2000
        );
    }
    
    QMainWindow::keyPressEvent(event);
}

void MainWindow::updateEnabledStatusDisplay() {
    if (!deviceController->areActionsEnabled()) {
        enabledStatusLabel->setText(getStatusMessage("disabled"));
        enabledStatusLabel->setStyleSheet("QLabel { color: #ff9800; font-weight: bold; }");
    } else {
        enabledStatusLabel->clear();
        enabledStatusLabel->setStyleSheet("");
    }
}
