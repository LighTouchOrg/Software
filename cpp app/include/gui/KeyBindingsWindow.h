#ifndef KEYBINDINGSWINDOW_H
#define KEYBINDINGSWINDOW_H

#include <QWidget>
#include <QLineEdit>
#include <QPushButton>
#include <QLabel>
#include <QKeyEvent>
#include <QMap>
#include "Settings.h"

/**
 * @brief Custom QLineEdit that captures key presses for binding
 */
class KeyBindingEdit : public QLineEdit {
    Q_OBJECT

public:
    explicit KeyBindingEdit(QWidget* parent = nullptr);

protected:
    void keyPressEvent(QKeyEvent* event) override;
    void focusInEvent(QFocusEvent* event) override;
    void focusOutEvent(QFocusEvent* event) override;

signals:
    void keyBound(const QString& key);

private:
    bool capturing;
};

/**
 * @brief Window for configuring keyboard shortcuts
 */
class KeyBindingsWindow : public QWidget {
    Q_OBJECT

public:
    explicit KeyBindingsWindow(Settings* settings, QWidget* parent = nullptr);
    ~KeyBindingsWindow();

private slots:
    void onSwipeLeftKeyBound(const QString& key);
    void onSwipeRightKeyBound(const QString& key);
    void onClickKeyBound(const QString& key);
    void onResetDefaults();

private:
    void setupUI();
    void loadBindings();
    bool isKeyConflict(const QString& key, KeyBindingEdit* exclude);
    void showConflictWarning(const QString& message);
    void clearConflictWarning();
    
    Settings* settings;
    
    KeyBindingEdit* swipeLeftEdit;
    KeyBindingEdit* swipeRightEdit;
    KeyBindingEdit* clickEdit;
    
    QLabel* conflictLabel;
    QPushButton* resetButton;
    QPushButton* closeButton;
    
    QMap<QString, KeyBindingEdit*> bindings;
};

#endif // KEYBINDINGSWINDOW_H
