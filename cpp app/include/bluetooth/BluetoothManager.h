#ifndef BLUETOOTHMANAGER_H
#define BLUETOOTHMANAGER_H

#include <QObject>
#include <QSerialPort>
#include <QSerialPortInfo>
#include <QString>
#include <QTimer>

class BluetoothManager : public QObject {
    Q_OBJECT

public:
    explicit BluetoothManager(QObject* parent = nullptr);
    ~BluetoothManager();
    
    bool isConnected() const;
    void startConnection();
    void stopConnection();
    
    /**
     * @brief Send message to Bluetooth device
     */
    bool sendMessage(const QString& message);
    
    /**
     * @brief Find active Bluetooth serial port
     */
    QString findBluetoothPort();

signals:
    void connected();
    void disconnected();
    void dataReceived(const QString& data);
    void errorOccurred(const QString& error);

private slots:
    void handleReadyRead();
    void handleError(QSerialPort::SerialPortError error);
    void retryConnection();

private:
    void setupConnection(const QString& portName);
    void closeConnection();
    
    QSerialPort* serialPort;
    QTimer* reconnectTimer;
    QString currentPort;
    bool isConnectedFlag;
    QByteArray buffer;
};

#endif // BLUETOOTHMANAGER_H
