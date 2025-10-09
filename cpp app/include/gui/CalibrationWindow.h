#ifndef CALIBRATIONWINDOW_H
#define CALIBRATIONWINDOW_H

#include <QWidget>
#include <QLabel>
#include <QKeyEvent>
#include "DeviceController.h"

class CalibrationWindow : public QWidget {
    Q_OBJECT

public:
    explicit CalibrationWindow(DeviceController* controller, QWidget* parent = nullptr);
    ~CalibrationWindow();

signals:
    void closed();

protected:
    void keyPressEvent(QKeyEvent* event) override;
    void closeEvent(QCloseEvent* event) override;

private slots:
    void handleCalibrationComplete();
    void handleBluetoothData(const QString& data);

private:
    void setupUI();
    
    DeviceController* deviceController;
    QLabel* instructionLabel;
    QLabel* statusLabel;
    bool calibrationActive;
};

#endif // CALIBRATIONWINDOW_H
