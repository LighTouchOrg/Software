#include "KeyBindingsWindow.h"
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QFormLayout>
#include <QGroupBox>
#include <QMessageBox>
#include <QKeySequence>
#include <QDebug>

// KeyBindingEdit Implementation
KeyBindingEdit::KeyBindingEdit(QWidget* parent)
    : QLineEdit(parent)
    , capturing(false)
{
    setReadOnly(true);
    setPlaceholderText("Cliquez et appuyez sur une touche...");
    setAlignment(Qt::AlignCenter);
    setMinimumWidth(200);
}

void KeyBindingEdit::keyPressEvent(QKeyEvent* event) {
    if (!capturing) {
        QLineEdit::keyPressEvent(event);
        return;
    }
    
    // Ignore modifier-only keys
    if (event->key() == Qt::Key_Control ||
        event->key() == Qt::Key_Shift ||
        event->key() == Qt::Key_Alt ||
        event->key() == Qt::Key_Meta) {
        return;
    }
    
    // Get key sequence
    int key = event->key();
    Qt::KeyboardModifiers modifiers = event->modifiers();
    
    // Remove the modifier flags that we don't want to record
    modifiers &= ~Qt::KeypadModifier;
    
    QString keyText = QKeySequence(modifiers | key).toString();
    
    setText(keyText);
    emit keyBound(keyText);
    clearFocus();
}

void KeyBindingEdit::focusInEvent(QFocusEvent* event) {
    capturing = true;
    setStyleSheet("QLineEdit { border: 2px solid #4a90e2; background-color: #e8f4ff; }");
    setText("");
    setPlaceholderText("Appuyez sur une touche...");
    QLineEdit::focusInEvent(event);
}

void KeyBindingEdit::focusOutEvent(QFocusEvent* event) {
    capturing = false;
    setStyleSheet("");
    if (text().isEmpty()) {
        setPlaceholderText("Cliquez et appuyez sur une touche...");
    }
    QLineEdit::focusOutEvent(event);
}

// KeyBindingsWindow Implementation
KeyBindingsWindow::KeyBindingsWindow(Settings* settings, QWidget* parent)
    : QWidget(parent)
    , settings(settings)
{
    setupUI();
    loadBindings();
    
    setWindowTitle("Assignation des touches - LighTouch");
    setAttribute(Qt::WA_DeleteOnClose, false);
    resize(600, 400);
}

KeyBindingsWindow::~KeyBindingsWindow() {
}

void KeyBindingsWindow::setupUI() {
    QVBoxLayout* mainLayout = new QVBoxLayout(this);
    mainLayout->setSpacing(20);
    mainLayout->setContentsMargins(30, 30, 30, 30);
    
    // Title
    QLabel* titleLabel = new QLabel("Configuration des Raccourcis Clavier", this);
    QFont titleFont = titleLabel->font();
    titleFont.setPointSize(20);
    titleFont.setBold(true);
    titleLabel->setFont(titleFont);
    mainLayout->addWidget(titleLabel);
    
    // Instructions
    QLabel* instructionLabel = new QLabel(
        "Cliquez sur un champ puis appuyez sur la touche souhaitée.\n"
        "Vous pouvez utiliser des combinaisons avec Ctrl, Shift, Alt.",
        this
    );
    instructionLabel->setWordWrap(true);
    instructionLabel->setStyleSheet("QLabel { color: #666; font-size: 12px; }");
    mainLayout->addWidget(instructionLabel);
    
    // Key bindings group
    QGroupBox* bindingsGroup = new QGroupBox("Raccourcis", this);
    QFormLayout* formLayout = new QFormLayout(bindingsGroup);
    formLayout->setSpacing(15);
    formLayout->setLabelAlignment(Qt::AlignRight | Qt::AlignVCenter);
    
    // Swipe Left
    swipeLeftEdit = new KeyBindingEdit(this);
    connect(swipeLeftEdit, &KeyBindingEdit::keyBound,
            this, &KeyBindingsWindow::onSwipeLeftKeyBound);
    formLayout->addRow("Balayage Gauche:", swipeLeftEdit);
    bindings["swipe_left"] = swipeLeftEdit;
    
    // Swipe Right
    swipeRightEdit = new KeyBindingEdit(this);
    connect(swipeRightEdit, &KeyBindingEdit::keyBound,
            this, &KeyBindingsWindow::onSwipeRightKeyBound);
    formLayout->addRow("Balayage Droit:", swipeRightEdit);
    bindings["swipe_right"] = swipeRightEdit;
    
    // Click
    clickEdit = new KeyBindingEdit(this);
    connect(clickEdit, &KeyBindingEdit::keyBound,
            this, &KeyBindingsWindow::onClickKeyBound);
    formLayout->addRow("Clic:", clickEdit);
    bindings["click"] = clickEdit;
    
    mainLayout->addWidget(bindingsGroup);
    
    // Conflict warning label
    conflictLabel = new QLabel(this);
    conflictLabel->setWordWrap(true);
    conflictLabel->setStyleSheet("QLabel { color: #d32f2f; font-weight: bold; padding: 10px; background-color: #ffebee; border-radius: 5px; }");
    conflictLabel->hide();
    mainLayout->addWidget(conflictLabel);
    
    mainLayout->addStretch();
    
    // Buttons
    QHBoxLayout* buttonLayout = new QHBoxLayout();
    
    resetButton = new QPushButton("Réinitialiser par défaut", this);
    connect(resetButton, &QPushButton::clicked, this, &KeyBindingsWindow::onResetDefaults);
    buttonLayout->addWidget(resetButton);
    
    buttonLayout->addStretch();
    
    closeButton = new QPushButton("Fermer", this);
    closeButton->setMinimumWidth(100);
    connect(closeButton, &QPushButton::clicked, this, &QWidget::close);
    buttonLayout->addWidget(closeButton);
    
    mainLayout->addLayout(buttonLayout);
    
    // Styling
    setStyleSheet(R"(
        QWidget {
            background-color: #ffffff;
            color: #000000;
        }
        QGroupBox {
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            margin-top: 10px;
            padding: 15px;
            font-weight: bold;
        }
        QGroupBox::title {
            subcontrol-origin: margin;
            left: 10px;
            padding: 0 5px;
        }
        QLineEdit {
            padding: 10px;
            border: 2px solid #cccccc;
            border-radius: 5px;
            background-color: #f9f9f9;
            font-size: 14px;
        }
        QLineEdit:focus {
            border-color: #4a90e2;
        }
        QPushButton {
            padding: 10px 20px;
            border: 2px solid #cccccc;
            border-radius: 5px;
            background-color: #f0f0f0;
            font-size: 14px;
        }
        QPushButton:hover {
            background-color: #e0e0e0;
            border-color: #999999;
        }
        QPushButton:pressed {
            background-color: #d0d0d0;
        }
    )");
}

void KeyBindingsWindow::loadBindings() {
    swipeLeftEdit->setText(settings->getKeybindSwipeLeft());
    swipeRightEdit->setText(settings->getKeybindSwipeRight());
    clickEdit->setText(settings->getKeybindClick());
}

bool KeyBindingsWindow::isKeyConflict(const QString& key, KeyBindingEdit* exclude) {
    for (auto it = bindings.begin(); it != bindings.end(); ++it) {
        KeyBindingEdit* edit = it.value();
        if (edit != exclude && edit->text() == key && !key.isEmpty()) {
            return true;
        }
    }
    return false;
}

void KeyBindingsWindow::showConflictWarning(const QString& message) {
    conflictLabel->setText("⚠️ " + message);
    conflictLabel->show();
}

void KeyBindingsWindow::clearConflictWarning() {
    conflictLabel->hide();
}

void KeyBindingsWindow::onSwipeLeftKeyBound(const QString& key) {
    if (key.isEmpty()) return;
    
    if (isKeyConflict(key, swipeLeftEdit)) {
        showConflictWarning("Cette touche est déjà utilisée pour un autre raccourci !");
        swipeLeftEdit->setStyleSheet("QLineEdit { border: 2px solid #d32f2f; background-color: #ffebee; }");
    } else {
        settings->setKeybindSwipeLeft(key);
        swipeLeftEdit->setStyleSheet("");
        clearConflictWarning();
        qDebug() << "Swipe Left bound to:" << key;
    }
}

void KeyBindingsWindow::onSwipeRightKeyBound(const QString& key) {
    if (key.isEmpty()) return;
    
    if (isKeyConflict(key, swipeRightEdit)) {
        showConflictWarning("Cette touche est déjà utilisée pour un autre raccourci !");
        swipeRightEdit->setStyleSheet("QLineEdit { border: 2px solid #d32f2f; background-color: #ffebee; }");
    } else {
        settings->setKeybindSwipeRight(key);
        swipeRightEdit->setStyleSheet("");
        clearConflictWarning();
        qDebug() << "Swipe Right bound to:" << key;
    }
}

void KeyBindingsWindow::onClickKeyBound(const QString& key) {
    if (key.isEmpty()) return;
    
    if (isKeyConflict(key, clickEdit)) {
        showConflictWarning("Cette touche est déjà utilisée pour un autre raccourci !");
        clickEdit->setStyleSheet("QLineEdit { border: 2px solid #d32f2f; background-color: #ffebee; }");
    } else {
        settings->setKeybindClick(key);
        clickEdit->setStyleSheet("");
        clearConflictWarning();
        qDebug() << "Click bound to:" << key;
    }
}

void KeyBindingsWindow::onResetDefaults() {
    QMessageBox::StandardButton reply = QMessageBox::question(
        this,
        "Réinitialiser",
        "Voulez-vous vraiment réinitialiser tous les raccourcis aux valeurs par défaut ?",
        QMessageBox::Yes | QMessageBox::No
    );
    
    if (reply == QMessageBox::Yes) {
        settings->setKeybindSwipeLeft("Left");
        settings->setKeybindSwipeRight("Right");
        settings->setKeybindClick("Return");
        
        loadBindings();
        clearConflictWarning();
        
        QMessageBox::information(this, "Réinitialisé", "Les raccourcis ont été réinitialisés aux valeurs par défaut.");
    }
}
