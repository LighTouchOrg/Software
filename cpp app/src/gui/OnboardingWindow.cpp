#include "OnboardingWindow.h"
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QPushButton>
#include <QLabel>

OnboardingWindow::OnboardingWindow(DeviceController* controller, QWidget* parent)
    : QWidget(parent)
    , deviceController(controller)
    , currentPage(0)
{
    setupUI();
    showPage(0);
    
    setWindowTitle("Bienvenue - LighTouch");
    setAttribute(Qt::WA_DeleteOnClose);
    resize(800, 600);
}

OnboardingWindow::~OnboardingWindow() {
}

void OnboardingWindow::setupUI() {
    QVBoxLayout* mainLayout = new QVBoxLayout(this);
    mainLayout->setAlignment(Qt::AlignCenter);
    mainLayout->setSpacing(30);
    mainLayout->setContentsMargins(50, 50, 50, 50);
    
    // Title
    titleLabel = new QLabel(this);
    QFont titleFont = titleLabel->font();
    titleFont.setPointSize(28);
    titleFont.setBold(true);
    titleLabel->setFont(titleFont);
    titleLabel->setAlignment(Qt::AlignCenter);
    mainLayout->addWidget(titleLabel);
    
    // Content
    contentLabel = new QLabel(this);
    QFont contentFont = contentLabel->font();
    contentFont.setPointSize(16);
    contentLabel->setFont(contentFont);
    contentLabel->setAlignment(Qt::AlignCenter);
    contentLabel->setWordWrap(true);
    mainLayout->addWidget(contentLabel);
    
    // Hand selection buttons (hidden by default)
    QHBoxLayout* handLayout = new QHBoxLayout();
    leftHandButton = new QPushButton("Main gauche", this);
    leftHandButton->setMinimumSize(150, 60);
    leftHandButton->setVisible(false);
    connect(leftHandButton, &QPushButton::clicked, this, &OnboardingWindow::onLeftHandClicked);
    handLayout->addWidget(leftHandButton);
    
    rightHandButton = new QPushButton("Main droite", this);
    rightHandButton->setMinimumSize(150, 60);
    rightHandButton->setVisible(false);
    connect(rightHandButton, &QPushButton::clicked, this, &OnboardingWindow::onRightHandClicked);
    handLayout->addWidget(rightHandButton);
    
    mainLayout->addLayout(handLayout);
    
    mainLayout->addStretch();
    
    // Navigation buttons
    QHBoxLayout* navLayout = new QHBoxLayout();
    
    skipButton = new QPushButton("Passer", this);
    skipButton->setMinimumSize(120, 40);
    connect(skipButton, &QPushButton::clicked, this, &OnboardingWindow::onSkipClicked);
    navLayout->addWidget(skipButton);
    
    navLayout->addStretch();
    
    nextButton = new QPushButton("Suivant", this);
    nextButton->setMinimumSize(120, 40);
    connect(nextButton, &QPushButton::clicked, this, &OnboardingWindow::onNextClicked);
    navLayout->addWidget(nextButton);
    
    mainLayout->addLayout(navLayout);
    
    setStyleSheet(R"(
        QWidget {
            background-color: #ffffff;
            color: #000000;
        }
        QPushButton {
            background-color: #f0f0f0;
            border: 2px solid #cccccc;
            border-radius: 8px;
            padding: 10px;
            font-size: 14px;
            font-weight: bold;
        }
        QPushButton:hover {
            background-color: #e0e0e0;
        }
        QPushButton:pressed {
            background-color: #d0d0d0;
        }
    )");
}

void OnboardingWindow::showPage(int page) {
    currentPage = page;
    
    // Hide hand buttons by default
    leftHandButton->setVisible(false);
    rightHandButton->setVisible(false);
    
    switch (page) {
        case 0:
            titleLabel->setText("Bienvenue sur LighTouch");
            contentLabel->setText("LighTouch est votre assistant de contrôle gestuel.\n\n"
                                 "Cet assistant vous guidera à travers la configuration initiale.");
            nextButton->setText("Suivant");
            break;
            
        case 1:
            titleLabel->setText("Sélectionnez votre main dominante");
            contentLabel->setText("Quelle main utilisez-vous principalement ?");
            leftHandButton->setVisible(true);
            rightHandButton->setVisible(true);
            nextButton->setVisible(false);
            break;
            
        case 2:
            titleLabel->setText("Configuration terminée");
            contentLabel->setText("Vous êtes prêt à utiliser LighTouch !\n\n"
                                 "N'oubliez pas de calibrer votre appareil pour une meilleure précision.");
            nextButton->setText("Terminer");
            skipButton->setVisible(false);
            break;
            
        default:
            emit finished();
            close();
            break;
    }
}

void OnboardingWindow::onNextClicked() {
    showPage(currentPage + 1);
}

void OnboardingWindow::onSkipClicked() {
    emit finished();
    close();
}

void OnboardingWindow::onLeftHandClicked() {
    deviceController->setDominantHand("left");
    showPage(currentPage + 1);
}

void OnboardingWindow::onRightHandClicked() {
    deviceController->setDominantHand("right");
    showPage(currentPage + 1);
}
