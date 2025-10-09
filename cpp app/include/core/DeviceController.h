#ifndef DEVICECONTROLLER_H
#define DEVICECONTROLLER_H

#include <QObject>
#include <QString>
#include "BluetoothManager.h"
#include "MessageBuilder.h"
#include "Settings.h"

class DeviceController : public QObject {
    Q_OBJECT

public:
    explicit DeviceController(QObject* parent = nullptr);
    ~DeviceController();
    
    // Device status
    bool isDeviceConnected() const;
    QString getDeviceStatus() const;
    
    // Calibration
    void startCalibration();
    void stopCalibration();
    void completeCalibration();
    bool isCalibrating() const;
    
    // Settings
    void setDominantHand(const QString& hand); // "left" or "right"
    QString getDominantHand() const;
    
    // Actions
    void enableActions(bool enabled);
    bool areActionsEnabled() const;
    
    // Modes
    void setPresentationMode(bool enabled);
    bool isPresentationMode() const;
    
    // Bluetooth Manager access
    BluetoothManager* getBluetoothManager() { return bluetoothManager; }

signals:
    void deviceConnected();
    void deviceDisconnected();
    void calibrationStarted();
    void calibrationCompleted();
    void calibrationFailed();
    void bluetoothDataReceived(const QString& data);
    void deviceStatusChanged(const QString& status);

public slots:
    void handleBluetoothData(const QString& data);
    void handleBluetoothConnected();
    void handleBluetoothDisconnected();
    void handleBluetoothError(const QString& error);

private:
    BluetoothManager* bluetoothManager;
    Settings* settings;
    bool calibrating;
    bool actionsEnabled;
    bool presentationMode;
    
    void sendBluetoothMessage(const QString& message);
};

#endif // DEVICECONTROLLER_H
