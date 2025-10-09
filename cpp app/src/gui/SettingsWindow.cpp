#include "SettingsWindow.h"
#include "Settings.h"
#include "ToastWidget.h"
#include "ScreenReader.h"
#include <QApplication>
#include <QVBoxLayout>
#include <QFormLayout>
#include <QLabel>
#include <QComboBox>
#include <QCheckBox>
#include <QGroupBox>

SettingsWindow::SettingsWindow(DeviceController* controller, QWidget* parent)
    : QWidget(parent)
    , deviceController(controller)
{
    setupUI();
    loadSettings();
    
    setWindowTitle("Settings - LighTouch");
    setAttribute(Qt::WA_DeleteOnClose, false);
    resize(500, 400);
}

SettingsWindow::~SettingsWindow() {
}

void SettingsWindow::setupUI() {
    QVBoxLayout* mainLayout = new QVBoxLayout(this);
    mainLayout->setSpacing(20);
    mainLayout->setContentsMargins(30, 30, 30, 30);
    
    // Title
    titleLabel = new QLabel("Paramètres", this);
    QFont titleFont = titleLabel->font();
    titleFont.setPointSize(24);
    titleFont.setBold(true);
    titleLabel->setFont(titleFont);
    mainLayout->addWidget(titleLabel);
    
    // Settings form
    QFormLayout* formLayout = new QFormLayout();
    formLayout->setSpacing(15);
    
    // Dominant hand
    QLabel* handLabel = new QLabel("Main dominante:", this);
    dominantHandCombo = new QComboBox(this);
    dominantHandCombo->addItem("Droite", "right");
    dominantHandCombo->addItem("Gauche", "left");
    connect(dominantHandCombo, QOverload<int>::of(&QComboBox::currentIndexChanged),
            this, &SettingsWindow::onDominantHandChanged);
    formLayout->addRow(handLabel, dominantHandCombo);
    
    // Language
    QLabel* langLabel = new QLabel("Langue:", this);
    languageCombo = new QComboBox(this);
    languageCombo->addItem("Français", "fr");
    languageCombo->addItem("English", "en");
    connect(languageCombo, QOverload<int>::of(&QComboBox::currentIndexChanged),
            this, &SettingsWindow::onLanguageChanged);
    formLayout->addRow(langLabel, languageCombo);
    
    // Theme
    QLabel* themeLabel = new QLabel("Thème:", this);
    themeCombo = new QComboBox(this);
    themeCombo->addItem("Clair", "light");
    themeCombo->addItem("Sombre", "dark");
    connect(themeCombo, QOverload<int>::of(&QComboBox::currentIndexChanged),
            this, &SettingsWindow::onThemeChanged);
    formLayout->addRow(themeLabel, themeCombo);
    
    // Text Size
    QLabel* textSizeLabel = new QLabel("Taille du texte:", this);
    textSizeCombo = new QComboBox(this);
    textSizeCombo->addItem("Petite", Settings::Small);
    textSizeCombo->addItem("Moyenne", Settings::Medium);
    textSizeCombo->addItem("Grande", Settings::Large);
    connect(textSizeCombo, QOverload<int>::of(&QComboBox::currentIndexChanged),
            this, &SettingsWindow::onTextSizeChanged);
    formLayout->addRow(textSizeLabel, textSizeCombo);
    
    mainLayout->addLayout(formLayout);
    
    // Accessibility group
    QGroupBox* accessGroup = new QGroupBox("Accessibilité", this);
    QVBoxLayout* accessLayout = new QVBoxLayout(accessGroup);
    
    // Screen Reader
    screenReaderCheckbox = new QCheckBox("Activer le lecteur d'écran", this);
    connect(screenReaderCheckbox, &QCheckBox::toggled,
            this, &SettingsWindow::onScreenReaderToggled);
    accessLayout->addWidget(screenReaderCheckbox);
    
    mainLayout->addWidget(accessGroup);
    
    // Mode group
    QGroupBox* modeGroup = new QGroupBox("Modes", this);
    QVBoxLayout* modeLayout = new QVBoxLayout(modeGroup);
    
    // Presentation Mode
    presentationModeCheckbox = new QCheckBox("Mode Présentation", this);
    presentationModeCheckbox->setToolTip("Optimise les gestes pour les présentations");
    connect(presentationModeCheckbox, &QCheckBox::toggled,
            this, &SettingsWindow::onPresentationModeToggled);
    modeLayout->addWidget(presentationModeCheckbox);
    
    mainLayout->addWidget(modeGroup);
    
    mainLayout->addStretch();
    
    // Apply stylesheet
    setStyleSheet(R"(
        QWidget {
            background-color: #ffffff;
            color: #000000;
        }
        QLabel {
            font-size: 14px;
        }
        QComboBox {
            padding: 8px;
            border: 2px solid #cccccc;
            border-radius: 5px;
            background-color: #f9f9f9;
            min-width: 200px;
        }
        QComboBox:hover {
            border-color: #999999;
        }
        QComboBox::drop-down {
            border: none;
        }
    )");
}

void SettingsWindow::loadSettings() {
    Settings settings;
    
    // Load dominant hand
    QString hand = settings.getDominantHand();
    int handIndex = dominantHandCombo->findData(hand);
    if (handIndex >= 0) {
        dominantHandCombo->setCurrentIndex(handIndex);
    }
    
    // Load language
    QString lang = settings.getLanguage();
    int langIndex = languageCombo->findData(lang);
    if (langIndex >= 0) {
        languageCombo->setCurrentIndex(langIndex);
    }
    
    // Load theme
    bool darkMode = settings.isDarkMode();
    themeCombo->setCurrentIndex(darkMode ? 1 : 0);
    
    // Load text size
    int textSize = settings.getTextSize();
    int sizeIndex = 1; // Default to Medium
    if (textSize == Settings::Small) sizeIndex = 0;
    else if (textSize == Settings::Large) sizeIndex = 2;
    textSizeCombo->setCurrentIndex(sizeIndex);
    
    // Load screen reader
    screenReaderCheckbox->setChecked(settings.isScreenReaderEnabled());
    
    // Load presentation mode
    presentationModeCheckbox->setChecked(settings.isPresentationMode());
}

void SettingsWindow::onDominantHandChanged(int index) {
    QString hand = dominantHandCombo->itemData(index).toString();
    deviceController->setDominantHand(hand);
    qDebug() << "Dominant hand changed to:" << hand;
}

void SettingsWindow::onLanguageChanged(int index) {
    QString lang = languageCombo->itemData(index).toString();
    Settings settings;
    settings.setLanguage(lang);
    
    // Update UI texts
    titleLabel->setText(lang == "fr" ? "Paramètres" : "Settings");
    
    qDebug() << "Language changed to:" << lang;
}

void SettingsWindow::onThemeChanged(int index) {
    bool darkMode = (index == 1);
    Settings settings;
    settings.setDarkMode(darkMode);
    
    ToastManager::instance().showToast(
        darkMode ? "Thème sombre activé" : "Thème clair activé",
        ToastWidget::Info,
        2000
    );
    
    qDebug() << "Theme changed to:" << (darkMode ? "dark" : "light");
}

void SettingsWindow::onTextSizeChanged(int index) {
    int size = textSizeCombo->itemData(index).toInt();
    Settings settings;
    settings.setTextSize(size);
    
    // Apply globally (requires app restart for full effect)
    QFont appFont = QApplication::font();
    appFont.setPointSize(size);
    QApplication::setFont(appFont);
    
    ToastManager::instance().showToast(
        "Taille de texte modifiée",
        ToastWidget::Success,
        2000
    );
    
    qDebug() << "Text size changed to:" << size;
}

void SettingsWindow::onScreenReaderToggled(bool checked) {
    Settings settings;
    settings.setScreenReaderEnabled(checked);
    
    // Enable/disable screen reader
    ScreenReader::instance().setEnabled(checked);
    
    ToastManager::instance().showToast(
        checked ? "Lecteur d'écran activé" : "Lecteur d'écran désactivé",
        ToastWidget::Info,
        2000
    );
    
    if (checked) {
        ScreenReader::instance().speak("Lecteur d'écran activé. Les messages seront lus à haute voix.");
    }
    
    qDebug() << "Screen reader:" << (checked ? "enabled" : "disabled");
}

void SettingsWindow::onPresentationModeToggled(bool checked) {
    Settings settings;
    settings.setPresentationMode(checked);
    
    deviceController->setPresentationMode(checked);
    
    ToastManager::instance().showToast(
        checked ? "Mode Présentation activé" : "Mode Présentation désactivé",
        ToastWidget::Success,
        2000
    );
    
    qDebug() << "Presentation mode:" << (checked ? "enabled" : "disabled");
}
