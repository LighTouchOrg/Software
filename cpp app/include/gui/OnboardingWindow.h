#ifndef ONBOARDINGWINDOW_H
#define ONBOARDINGWINDOW_H

#include <QWidget>
#include <QPushButton>
#include <QLabel>
#include "DeviceController.h"

class OnboardingWindow : public QWidget {
    Q_OBJECT

public:
    explicit OnboardingWindow(DeviceController* controller, QWidget* parent = nullptr);
    ~OnboardingWindow();

signals:
    void finished();

private slots:
    void onNextClicked();
    void onSkipClicked();
    void onLeftHandClicked();
    void onRightHandClicked();

private:
    void setupUI();
    void showPage(int page);
    
    DeviceController* deviceController;
    int currentPage;
    
    QLabel* titleLabel;
    QLabel* contentLabel;
    QPushButton* nextButton;
    QPushButton* skipButton;
    QPushButton* leftHandButton;
    QPushButton* rightHandButton;
};

#endif // ONBOARDINGWINDOW_H
