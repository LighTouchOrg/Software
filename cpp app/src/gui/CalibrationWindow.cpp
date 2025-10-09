#include "CalibrationWindow.h"
#include <QVBoxLayout>
#include <QLabel>
#include <QKeyEvent>
#include <QCloseEvent>
#include <QTimer>
#include <QDebug>

CalibrationWindow::CalibrationWindow(DeviceController* controller, QWidget* parent)
    : QWidget(parent)
    , deviceController(controller)
    , calibrationActive(true)
{
    setupUI();
    
    // Connect signals
    connect(deviceController, &DeviceController::calibrationCompleted,
            this, &CalibrationWindow::handleCalibrationComplete);
    connect(deviceController, &DeviceController::bluetoothDataReceived,
            this, &CalibrationWindow::handleBluetoothData);
    
    // Start calibration
    deviceController->startCalibration();
    
    setWindowTitle("Calibration - LighTouch");
    setAttribute(Qt::WA_DeleteOnClose);
}

CalibrationWindow::~CalibrationWindow() {
    if (calibrationActive) {
        deviceController->stopCalibration();
    }
}

void CalibrationWindow::setupUI() {
    QVBoxLayout* layout = new QVBoxLayout(this);
    layout->setAlignment(Qt::AlignCenter);
    
    // Instruction label
    instructionLabel = new QLabel(this);
    instructionLabel->setText("Suivez les instructions sur votre appareil LighTouch\n\n"
                             "Appuyez sur Échap pour annuler");
    instructionLabel->setAlignment(Qt::AlignCenter);
    instructionLabel->setWordWrap(true);
    
    QFont font = instructionLabel->font();
    font.setPointSize(24);
    instructionLabel->setFont(font);
    
    layout->addWidget(instructionLabel);
    
    // Status label
    statusLabel = new QLabel(this);
    statusLabel->setAlignment(Qt::AlignCenter);
    QFont statusFont = statusLabel->font();
    statusFont.setPointSize(18);
    statusLabel->setFont(statusFont);
    
    layout->addWidget(statusLabel);
    
    // Apply dark background for calibration
    setStyleSheet(R"(
        QWidget {
            background-color: #000000;
        }
        QLabel {
            color: #ffffff;
        }
    )");
    
    setLayout(layout);
}

void CalibrationWindow::keyPressEvent(QKeyEvent* event) {
    if (event->key() == Qt::Key_Escape) {
        // Cancel calibration
        statusLabel->setText("Calibration annulée...");
        calibrationActive = false;
        deviceController->stopCalibration();
        close();
    }
    
    QWidget::keyPressEvent(event);
}

void CalibrationWindow::closeEvent(QCloseEvent* event) {
    if (calibrationActive) {
        deviceController->stopCalibration();
    }
    emit closed();
    event->accept();
}

void CalibrationWindow::handleCalibrationComplete() {
    statusLabel->setText("Calibration terminée !");
    calibrationActive = false;
    
    // Close window after a short delay
    QTimer::singleShot(1500, this, &CalibrationWindow::close);
}

void CalibrationWindow::handleBluetoothData(const QString& data) {
    qDebug() << "Calibration window received:" << data;
    
    if (data.contains("CLOSE_CALIBRATION_WINDOW")) {
        handleCalibrationComplete();
    }
}
