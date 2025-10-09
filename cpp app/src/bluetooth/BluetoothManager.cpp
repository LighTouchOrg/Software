#include "BluetoothManager.h"
#include <QDebug>
#include <QThread>

BluetoothManager::BluetoothManager(QObject* parent)
    : QObject(parent)
    , serialPort(nullptr)
    , reconnectTimer(new QTimer(this))
    , isConnectedFlag(false)
{
    reconnectTimer->setInterval(10000); // 10 seconds
    connect(reconnectTimer, &QTimer::timeout, this, &BluetoothManager::retryConnection);
}

BluetoothManager::~BluetoothManager() {
    closeConnection();
}

bool BluetoothManager::isConnected() const {
    return isConnectedFlag && serialPort && serialPort->isOpen();
}

void BluetoothManager::startConnection() {
    QString port = findBluetoothPort();
    
    if (port.isEmpty()) {
        qWarning() << "[BT] No Bluetooth port found. Will retry...";
        emit errorOccurred("No Bluetooth device found");
        reconnectTimer->start();
        return;
    }
    
    setupConnection(port);
}

void BluetoothManager::stopConnection() {
    reconnectTimer->stop();
    closeConnection();
}

bool BluetoothManager::sendMessage(const QString& message) {
    if (!isConnected()) {
        qWarning() << "[BT] Cannot send message: not connected";
        return false;
    }
    
    QByteArray data = message.toUtf8();
    if (!data.endsWith('\n')) {
        data.append('\n');
    }
    
    qint64 written = serialPort->write(data);
    serialPort->flush();
    
    qDebug() << "[BT] Sent:" << message;
    return written > 0;
}

QString BluetoothManager::findBluetoothPort() {
    QList<QSerialPortInfo> ports = QSerialPortInfo::availablePorts();
    
#ifdef Q_OS_WIN
    // Windows: Look for BTHENUM devices
    for (const QSerialPortInfo& port : ports) {
        QString desc = port.description().toLower();
        QString sys = port.systemLocation();
        
        // Check if it's a Bluetooth port and not the null device
        if (desc.contains("bluetooth") || sys.contains("BTHENUM")) {
            if (!sys.contains("000000000000")) {
                qDebug() << "[BT] Found Bluetooth port:" << sys;
                return sys;
            }
        }
    }
#else
    // Linux: Look for rfcomm devices
    for (const QSerialPortInfo& port : ports) {
        QString sys = port.systemLocation();
        if (sys.contains("rfcomm") || sys.contains("ttyUSB")) {
            qDebug() << "[BT] Found Bluetooth port:" << sys;
            return sys;
        }
    }
#endif
    
    // Fallback to first available port
    if (!ports.isEmpty()) {
        qDebug() << "[BT] Using fallback port:" << ports.first().systemLocation();
        return ports.first().systemLocation();
    }
    
    return QString();
}

void BluetoothManager::setupConnection(const QString& portName) {
    closeConnection();
    
    serialPort = new QSerialPort(portName, this);
    serialPort->setBaudRate(QSerialPort::Baud9600);
    serialPort->setDataBits(QSerialPort::Data8);
    serialPort->setParity(QSerialPort::NoParity);
    serialPort->setStopBits(QSerialPort::OneStop);
    serialPort->setFlowControl(QSerialPort::NoFlowControl);
    
    connect(serialPort, &QSerialPort::readyRead, this, &BluetoothManager::handleReadyRead);
    connect(serialPort, &QSerialPort::errorOccurred, this, &BluetoothManager::handleError);
    
    if (serialPort->open(QIODevice::ReadWrite)) {
        currentPort = portName;
        isConnectedFlag = true;
        
        // Send connection message
        serialPort->write("Connected to the raspberry\n");
        serialPort->flush();
        
        qDebug() << "[BT] Connected to port:" << portName;
        emit connected();
        reconnectTimer->stop();
    } else {
        qWarning() << "[BT] Failed to open port:" << portName << serialPort->errorString();
        emit errorOccurred(serialPort->errorString());
        delete serialPort;
        serialPort = nullptr;
        reconnectTimer->start();
    }
}

void BluetoothManager::closeConnection() {
    if (serialPort) {
        if (serialPort->isOpen()) {
            serialPort->close();
        }
        serialPort->deleteLater();
        serialPort = nullptr;
    }
    
    if (isConnectedFlag) {
        isConnectedFlag = false;
        emit disconnected();
    }
}

void BluetoothManager::handleReadyRead() {
    if (!serialPort) return;
    
    buffer.append(serialPort->readAll());
    
    // Process complete lines
    while (buffer.contains('\n')) {
        int index = buffer.indexOf('\n');
        QByteArray line = buffer.left(index);
        buffer.remove(0, index + 1);
        
        QString data = QString::fromUtf8(line).trimmed();
        if (!data.isEmpty()) {
            qDebug() << "[BT] Received:" << data;
            emit dataReceived(data);
        }
    }
}

void BluetoothManager::handleError(QSerialPort::SerialPortError error) {
    if (error == QSerialPort::NoError || error == QSerialPort::TimeoutError) {
        return;
    }
    
    qWarning() << "[BT] Serial port error:" << error;
    
    if (error == QSerialPort::ResourceError || error == QSerialPort::DeviceNotFoundError) {
        closeConnection();
        emit errorOccurred("Device disconnected");
        reconnectTimer->start();
    }
}

void BluetoothManager::retryConnection() {
    qDebug() << "[BT] Attempting to reconnect...";
    startConnection();
}
