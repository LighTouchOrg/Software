#include "DeviceController.h"
#include <QDebug>

DeviceController::DeviceController(QObject* parent)
    : QObject(parent)
    , bluetoothManager(new BluetoothManager(this))
    , settings(new Settings())
    , calibrating(false)
    , actionsEnabled(true)
    , presentationMode(false)
{
    // Connect Bluetooth signals
    connect(bluetoothManager, &BluetoothManager::connected,
            this, &DeviceController::handleBluetoothConnected);
    connect(bluetoothManager, &BluetoothManager::disconnected,
            this, &DeviceController::handleBluetoothDisconnected);
    connect(bluetoothManager, &BluetoothManager::dataReceived,
            this, &DeviceController::handleBluetoothData);
    connect(bluetoothManager, &BluetoothManager::errorOccurred,
            this, &DeviceController::handleBluetoothError);
    
    // Load settings
    actionsEnabled = settings->areActionsEnabled();
    
    // Start Bluetooth connection
    bluetoothManager->startConnection();
}

DeviceController::~DeviceController() {
    delete settings;
}

bool DeviceController::isDeviceConnected() const {
    return bluetoothManager->isConnected();
}

QString DeviceController::getDeviceStatus() const {
    return settings->getDeviceStatusString();
}

void DeviceController::startCalibration() {
    if (calibrating) {
        qWarning() << "Calibration already in progress";
        return;
    }
    
    calibrating = true;
    
    // Send calibration start message to Bluetooth device
    QString msg = MessageBuilder::buildMessage("screen", "start_calibration", "");
    sendBluetoothMessage(msg);
    
    emit calibrationStarted();
    qDebug() << "Calibration started";
}

void DeviceController::stopCalibration() {
    if (!calibrating) {
        return;
    }
    
    calibrating = false;
    
    // Send calibration stop message to Bluetooth device
    QString msg = MessageBuilder::buildMessage("screen", "stop_calibration", "");
    sendBluetoothMessage(msg);
    
    qDebug() << "Calibration stopped";
}

void DeviceController::completeCalibration() {
    if (!calibrating) {
        return;
    }
    
    calibrating = false;
    
    // Send calibration complete message
    QString msg = MessageBuilder::buildMessage("screen", "calibrate", true);
    sendBluetoothMessage(msg);
    
    settings->setDeviceStatusString("calibration_done");
    emit calibrationCompleted();
    emit deviceStatusChanged("calibration_done");
    
    qDebug() << "Calibration completed";
}

bool DeviceController::isCalibrating() const {
    return calibrating;
}

void DeviceController::setDominantHand(const QString& hand) {
    settings->setDominantHand(hand);
    
    // Send to Bluetooth device
    QString msg = MessageBuilder::buildMessage("settings", "set_dominant_hand", hand);
    sendBluetoothMessage(msg);
    
    qDebug() << "Dominant hand set to:" << hand;
}

QString DeviceController::getDominantHand() const {
    return settings->getDominantHand();
}

void DeviceController::enableActions(bool enabled) {
    actionsEnabled = enabled;
    settings->setActionsEnabled(enabled);
    qDebug() << "Actions" << (enabled ? "enabled" : "disabled");
}

bool DeviceController::areActionsEnabled() const {
    return actionsEnabled;
}

void DeviceController::setPresentationMode(bool enabled) {
    presentationMode = enabled;
    settings->setPresentationMode(enabled);
    
    // Send to device
    QString msg = MessageBuilder::buildMessage("settings", "set_mode", enabled ? "presentation" : "normal");
    sendBluetoothMessage(msg);
    
    qDebug() << "Presentation mode:" << (enabled ? "enabled" : "disabled");
}

bool DeviceController::isPresentationMode() const {
    return presentationMode;
}

void DeviceController::handleBluetoothData(const QString& data) {
    qDebug() << "Received Bluetooth data:" << data;
    
    // Parse the data and emit signals
    emit bluetoothDataReceived(data);
    
    // Handle specific responses
    if (data.contains("CALIBRATION_STARTED")) {
        // Calibration acknowledged by device
    } else if (data.contains("CALIBRATION_STOPPED")) {
        // Calibration stopped by device
    } else if (data.contains("CLOSE_CALIBRATION_WINDOW")) {
        completeCalibration();
    }
}

void DeviceController::handleBluetoothConnected() {
    settings->setDeviceStatusString("device_connected");
    emit deviceConnected();
    emit deviceStatusChanged("device_connected");
    qDebug() << "Device connected";
}

void DeviceController::handleBluetoothDisconnected() {
    settings->setDeviceStatusString("device_not_connected");
    emit deviceDisconnected();
    emit deviceStatusChanged("device_not_connected");
    qDebug() << "Device disconnected";
}

void DeviceController::handleBluetoothError(const QString& error) {
    qWarning() << "Bluetooth error:" << error;
    settings->setDeviceStatusString("device_not_connected");
    emit deviceStatusChanged("device_not_connected");
}

void DeviceController::sendBluetoothMessage(const QString& message) {
    if (!bluetoothManager->sendMessage(message)) {
        qWarning() << "Failed to send message:" << message;
    }
}
