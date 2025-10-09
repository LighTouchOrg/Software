#ifndef MESSAGEBUILDER_H
#define MESSAGEBUILDER_H

#include <QString>
#include <QJsonObject>
#include <QJsonDocument>

class MessageBuilder {
public:
    /**
     * @brief Build a JSON message for Bluetooth communication
     * @param category Message category (e.g., "screen", "settings")
     * @param method Method name (e.g., "start_calibration", "set_dominant_hand")
     * @param params Parameters (can be string, bool, or complex value)
     * @return JSON string formatted for Bluetooth transmission
     */
    static QString buildMessage(const QString& category, const QString& method, const QString& params);
    
    /**
     * @brief Build a JSON message with boolean parameter
     */
    static QString buildMessage(const QString& category, const QString& method, bool value);
    
    /**
     * @brief Parse received JSON message
     */
    static QJsonObject parseMessage(const QString& message);
    
    /**
     * @brief Check if a message is valid JSON
     */
    static bool isValidMessage(const QString& message);
};

#endif // MESSAGEBUILDER_H
