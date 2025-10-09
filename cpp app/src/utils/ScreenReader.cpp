#include "ScreenReader.h"
#include <QDebug>

// Note: QTextToSpeech requires Qt6::TextToSpeech module
// For now, we'll create a stub that logs to console
// To enable real TTS, uncomment the includes and link Qt6::TextToSpeech in CMakeLists.txt

//#include <QTextToSpeech>

ScreenReader& ScreenReader::instance() {
    static ScreenReader instance;
    return instance;
}

ScreenReader::ScreenReader()
    : tts(nullptr)
    , enabled(false)
{
    // Initialize QTextToSpeech (requires Qt6::TextToSpeech module)
    // tts = new QTextToSpeech(this);
    
    qDebug() << "ScreenReader initialized (stub mode - TTS not available)";
}

ScreenReader::~ScreenReader() {
    if (tts) {
        delete tts;
    }
}

void ScreenReader::speak(const QString& text) {
    if (!enabled || text.isEmpty()) {
        return;
    }
    
    if (tts) {
        // Real TTS implementation
        // tts->say(text);
        qDebug() << "[ScreenReader] Would speak:" << text;
    } else {
        // Stub: log to console
        qDebug() << "[ScreenReader] Would speak:" << text;
    }
}

void ScreenReader::setEnabled(bool enabled) {
    this->enabled = enabled;
    
    if (enabled) {
        speak("Lecteur d'écran activé");
    } else {
        qDebug() << "[ScreenReader] Disabled";
    }
}

bool ScreenReader::isEnabled() const {
    return enabled;
}

void ScreenReader::stop() {
    if (tts) {
        // tts->stop();
    }
}
