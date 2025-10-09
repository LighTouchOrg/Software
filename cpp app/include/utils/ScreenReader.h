#ifndef SCREENREADER_H
#define SCREENREADER_H

#include <QObject>
#include <QString>

// Forward declaration to avoid dependency on Qt TextToSpeech module
class QTextToSpeech;

/**
 * @brief Screen Reader for accessibility
 * Reads text aloud using QTextToSpeech
 */
class ScreenReader : public QObject {
    Q_OBJECT

public:
    static ScreenReader& instance();
    
    /**
     * @brief Speak text aloud (if enabled)
     */
    void speak(const QString& text);
    
    /**
     * @brief Enable/disable screen reader
     */
    void setEnabled(bool enabled);
    bool isEnabled() const;
    
    /**
     * @brief Stop current speech
     */
    void stop();

private:
    ScreenReader();
    ~ScreenReader();
    
    QTextToSpeech* tts;
    bool enabled;
};

#endif // SCREENREADER_H
