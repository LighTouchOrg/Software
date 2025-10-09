#ifndef ACTIONMANAGER_H
#define ACTIONMANAGER_H

#include <QObject>
#include <QString>
#include <QMap>

// Placeholder for future action management (keyboard bindings, etc.)
class ActionManager : public QObject {
    Q_OBJECT

public:
    explicit ActionManager(QObject* parent = nullptr);
    ~ActionManager();
    
    // Future: Handle actions from Bluetooth data
    void processAction(const QString& action);

signals:
    void actionTriggered(const QString& action);

private:
    QMap<QString, QString> actionBindings;
};

#endif // ACTIONMANAGER_H
