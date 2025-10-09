#include "ToastWidget.h"
#include <QVBoxLayout>
#include <QGraphicsOpacityEffect>
#include <QApplication>
#include <QScreen>
#include <QDebug>

ToastWidget::ToastWidget(QWidget* parent)
    : QWidget(parent)
    , isDisplaying(false)
{
    setupUI();
    
    // Setup animations
    fadeInAnimation = new QPropertyAnimation(this, "windowOpacity", this);
    fadeInAnimation->setDuration(300);
    fadeInAnimation->setStartValue(0.0);
    fadeInAnimation->setEndValue(1.0);
    
    fadeOutAnimation = new QPropertyAnimation(this, "windowOpacity", this);
    fadeOutAnimation->setDuration(300);
    fadeOutAnimation->setStartValue(1.0);
    fadeOutAnimation->setEndValue(0.0);
    connect(fadeOutAnimation, &QPropertyAnimation::finished,
            this, &ToastWidget::onFadeOutFinished);
    
    // Display timer
    displayTimer = new QTimer(this);
    displayTimer->setSingleShot(true);
    connect(displayTimer, &QTimer::timeout, this, &ToastWidget::fadeOut);
    
    setWindowFlags(Qt::ToolTip | Qt::FramelessWindowHint | Qt::WindowStaysOnTopHint);
    setAttribute(Qt::WA_TranslucentBackground);
    setAttribute(Qt::WA_ShowWithoutActivating);
}

ToastWidget::~ToastWidget() {
}

void ToastWidget::setupUI() {
    QVBoxLayout* layout = new QVBoxLayout(this);
    layout->setContentsMargins(20, 15, 20, 15);
    
    messageLabel = new QLabel(this);
    messageLabel->setWordWrap(true);
    messageLabel->setAlignment(Qt::AlignCenter);
    
    QFont font = messageLabel->font();
    font.setPointSize(12);
    font.setBold(true);
    messageLabel->setFont(font);
    
    layout->addWidget(messageLabel);
    
    setMinimumWidth(250);
    setMaximumWidth(500);
}

void ToastWidget::applyStyle(ToastType type) {
    QString bgColor, textColor, borderColor;
    
    switch (type) {
        case Success:
            bgColor = "#4caf50";
            textColor = "#ffffff";
            borderColor = "#388e3c";
            break;
        case Warning:
            bgColor = "#ff9800";
            textColor = "#ffffff";
            borderColor = "#f57c00";
            break;
        case Error:
            bgColor = "#f44336";
            textColor = "#ffffff";
            borderColor = "#d32f2f";
            break;
        case Info:
        default:
            bgColor = "#2196f3";
            textColor = "#ffffff";
            borderColor = "#1976d2";
            break;
    }
    
    setStyleSheet(QString(R"(
        ToastWidget {
            background-color: %1;
            border: 2px solid %2;
            border-radius: 8px;
        }
        QLabel {
            color: %3;
            background: transparent;
        }
    )").arg(bgColor, borderColor, textColor));
}

void ToastWidget::showToast(const QString& message, ToastType type, int duration) {
    if (isDisplaying) {
        queueToast(message, type, duration);
        return;
    }
    
    isDisplaying = true;
    messageLabel->setText(message);
    applyStyle(type);
    
    // Adjust size to content
    adjustSize();
    
    // Position at bottom center of parent
    if (parentWidget()) {
        QRect parentRect = parentWidget()->geometry();
        int x = parentRect.center().x() - width() / 2;
        int y = parentRect.bottom() - height() - 50;
        move(x, y);
    } else {
        // Center on screen
        QScreen* screen = QApplication::primaryScreen();
        QRect screenGeometry = screen->geometry();
        int x = (screenGeometry.width() - width()) / 2;
        int y = screenGeometry.height() - height() - 50;
        move(x, y);
    }
    
    // Start animation
    startAnimation();
    displayTimer->start(duration);
}

void ToastWidget::queueToast(const QString& message, ToastType type, int duration) {
    ToastMessage toast;
    toast.text = message;
    toast.type = type;
    toast.duration = duration;
    messageQueue.enqueue(toast);
}

void ToastWidget::startAnimation() {
    setWindowOpacity(0.0);
    show();
    fadeInAnimation->start();
}

void ToastWidget::fadeOut() {
    fadeOutAnimation->start();
}

void ToastWidget::onFadeOutFinished() {
    hide();
    isDisplaying = false;
    
    // Process queue
    if (!messageQueue.isEmpty()) {
        QTimer::singleShot(100, this, &ToastWidget::processQueue);
    }
}

void ToastWidget::processQueue() {
    if (!messageQueue.isEmpty()) {
        ToastMessage toast = messageQueue.dequeue();
        showToast(toast.text, toast.type, toast.duration);
    }
}

// ToastManager Implementation
ToastManager& ToastManager::instance() {
    static ToastManager instance;
    return instance;
}

void ToastManager::setParentWidget(QWidget* parent) {
    if (!toastWidget) {
        toastWidget = new ToastWidget(parent);
    }
}

void ToastManager::showToast(const QString& message, ToastWidget::ToastType type, int duration) {
    if (toastWidget) {
        toastWidget->showToast(message, type, duration);
    } else {
        qWarning() << "ToastManager: No parent widget set. Call setParentWidget() first.";
    }
}
