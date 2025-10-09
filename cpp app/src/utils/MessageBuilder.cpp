#include "MessageBuilder.h"
#include <QJsonObject>
#include <QJsonDocument>
#include <QJsonValue>

QString MessageBuilder::buildMessage(const QString& category, const QString& method, const QString& params) {
    QJsonObject json;
    json["category"] = category;
    json["method"] = method;
    
    QJsonObject paramsObj;
    if (!params.isEmpty()) {
        paramsObj["value"] = params;
    }
    json["params"] = paramsObj;
    
    QJsonDocument doc(json);
    return doc.toJson(QJsonDocument::Compact);
}

QString MessageBuilder::buildMessage(const QString& category, const QString& method, bool value) {
    QJsonObject json;
    json["category"] = category;
    json["method"] = method;
    
    QJsonObject paramsObj;
    paramsObj["value"] = value;
    json["params"] = paramsObj;
    
    QJsonDocument doc(json);
    return doc.toJson(QJsonDocument::Compact);
}

QJsonObject MessageBuilder::parseMessage(const QString& message) {
    QJsonDocument doc = QJsonDocument::fromJson(message.toUtf8());
    return doc.object();
}

bool MessageBuilder::isValidMessage(const QString& message) {
    QJsonParseError error;
    QJsonDocument doc = QJsonDocument::fromJson(message.toUtf8(), &error);
    return error.error == QJsonParseError::NoError && doc.isObject();
}
