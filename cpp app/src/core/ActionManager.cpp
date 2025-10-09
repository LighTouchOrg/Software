#include "ActionManager.h"
#include <QDebug>

ActionManager::ActionManager(QObject* parent)
    : QObject(parent)
{
    // Future: Initialize action bindings
}

ActionManager::~ActionManager() {
}

void ActionManager::processAction(const QString& action) {
    qDebug() << "Processing action:" << action;
    emit actionTriggered(action);
}
