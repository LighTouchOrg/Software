#ifndef TOASTWIDGET_H
#define TOASTWIDGET_H

#include <QWidget>
#include <QLabel>
#include <QTimer>
#include <QPropertyAnimation>
#include <QQueue>

/**
 * @brief Toast notification widget with fade in/out animations
 * Similar to Android-style toast messages
 */
class ToastWidget : public QWidget {
    Q_OBJECT

public:
    enum ToastType {
        Info,
        Success,
        Warning,
        Error
    };

    explicit ToastWidget(QWidget* parent = nullptr);
    ~ToastWidget();
    
    /**
     * @brief Show a toast message
     * @param message Text to display
     * @param type Type of toast (Info, Success, Warning, Error)
     * @param duration Duration in milliseconds (default 3000ms)
     */
    void showToast(const QString& message, ToastType type = Info, int duration = 3000);
    
    /**
     * @brief Queue a toast message (useful when multiple toasts at once)
     */
    void queueToast(const QString& message, ToastType type = Info, int duration = 3000);

private slots:
    void fadeOut();
    void onFadeOutFinished();
    void processQueue();

private:
    void setupUI();
    void applyStyle(ToastType type);
    void startAnimation();
    
    QLabel* messageLabel;
    QTimer* displayTimer;
    QPropertyAnimation* fadeInAnimation;
    QPropertyAnimation* fadeOutAnimation;
    
    struct ToastMessage {
        QString text;
        ToastType type;
        int duration;
    };
    
    QQueue<ToastMessage> messageQueue;
    bool isDisplaying;
};

/**
 * @brief Global Toast Manager - Singleton
 * Use this to show toasts from anywhere in the app
 */
class ToastManager {
public:
    static ToastManager& instance();
    
    void setParentWidget(QWidget* parent);
    void showToast(const QString& message, ToastWidget::ToastType type = ToastWidget::Info, int duration = 3000);
    
private:
    ToastManager() : toastWidget(nullptr) {}
    ToastWidget* toastWidget;
};

#endif // TOASTWIDGET_H
