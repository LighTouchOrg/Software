#include <QApplication>
#include <QIcon>
#include <QDebug>
#include "MainWindow.h"

int main(int argc, char *argv[]) {
    QApplication app(argc, argv);
    
    // Set application info
    app.setApplicationName("LighTouch");
    app.setApplicationVersion("1.1.0");
    app.setOrganizationName("LighTouch");
    app.setOrganizationDomain("lightouch.org");
    
    // Set application icon
    // app.setWindowIcon(QIcon(":/img/lightouch-logo.png"));
    
    qDebug() << "Starting LighTouch application v1.1.0";
    qDebug() << "Qt version:" << QT_VERSION_STR;
    
    // Create and show main window
    MainWindow mainWindow;
    mainWindow.show();
    
    return app.exec();
}
