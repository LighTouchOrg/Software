using System;
using System.Windows;
using System.Windows.Threading;

namespace LighTouch.Services
{
    /// <summary>
    /// Service qui affiche des hints aux utilisateurs :
    /// - Hint "main ouverte" pour les nouveaux utilisateurs idle
    /// - Hints contextuels pendant le tutoriel
    /// </summary>
    public class HintService : IDisposable
    {
        private readonly DispatcherTimer _idleTimer;
        private HintOverlayWindow _currentHintWindow;
        
        private DateTime _lastActivityTime;
        private bool _isTutorialCompleted;
        private bool _isInTutorial; // Si on est actuellement dans le tuto
        private bool _hintsEnabled = true;
        private bool _idleHintAlreadyShown = false; // Ne montrer le hint idle qu'une seule fois par session
        private string _currentLanguage = "fr";

        // Configuration
        private readonly TimeSpan _idleThreshold;

        /// <summary>
        /// Fenêtre parente pour les hints du tutoriel (permet de définir le Owner)
        /// </summary>
        public Window TutorialWindow { get; set; }

        public event EventHandler HintShown;
        public event EventHandler HintDismissed;

        /// <summary>
        /// Crée un nouveau service de hints
        /// </summary>
        /// <param name="idleSeconds">Secondes d'inactivité avant d'afficher le hint</param>
        public HintService(int idleSeconds = 10)
        {
            _idleThreshold = TimeSpan.FromSeconds(idleSeconds);
            _lastActivityTime = DateTime.Now;
            
            // Timer pour détecter l'idle
            _idleTimer = new DispatcherTimer
            {
                Interval = TimeSpan.FromSeconds(1)
            };
            _idleTimer.Tick += OnIdleTimerTick;
        }

        /// <summary>
        /// Démarre le service de hints
        /// </summary>
        public void Start()
        {
            _lastActivityTime = DateTime.Now;
            _idleHintAlreadyShown = false;
            _idleTimer.Start();
            Console.WriteLine("[HintService] Service démarré");
        }

        /// <summary>
        /// Arrête le service de hints
        /// </summary>
        public void Stop()
        {
            _idleTimer.Stop();
            HideCurrentHint();
            Console.WriteLine("[HintService] Service arrêté");
        }

        /// <summary>
        /// Active ou désactive les hints
        /// </summary>
        public bool HintsEnabled
        {
            get => _hintsEnabled;
            set
            {
                _hintsEnabled = value;
                if (!value)
                {
                    HideCurrentHint();
                }
                Console.WriteLine($"[HintService] Hints {(value ? "activés" : "désactivés")}");
            }
        }

        /// <summary>
        /// Définit si le tutoriel a été complété
        /// </summary>
        public bool TutorialCompleted
        {
            get => _isTutorialCompleted;
            set
            {
                _isTutorialCompleted = value;
                Console.WriteLine($"[HintService] Tutoriel {(value ? "complété" : "non complété")}");
            }
        }

        /// <summary>
        /// Définit si on est actuellement dans le tutoriel (désactive le hint idle)
        /// </summary>
        public bool InTutorial
        {
            get => _isInTutorial;
            set
            {
                _isInTutorial = value;
                Console.WriteLine($"[HintService] In tutorial: {value}");
            }
        }

        /// <summary>
        /// Définit la langue des hints
        /// </summary>
        public string Language
        {
            get => _currentLanguage;
            set
            {
                _currentLanguage = value ?? "fr";
                Console.WriteLine($"[HintService] Langue: {_currentLanguage}");
            }
        }

        /// <summary>
        /// Signale une activité utilisateur (réinitialise le timer idle)
        /// </summary>
        public void ReportActivity()
        {
            _lastActivityTime = DateTime.Now;
        }

        /// <summary>
        /// Affiche un hint avec emoji, titre et description personnalisés
        /// </summary>
        public void ShowCustomHint(string emoji, string title, string description, int durationSeconds = 4, HintAnimationType animationType = HintAnimationType.Pulse)
        {
            if (!_hintsEnabled) return;
            
            // Fermer le hint actuel s'il y en a un
            HideCurrentHint();
            
            Application.Current.Dispatcher.Invoke(() =>
            {
                try
                {
                    _currentHintWindow = new HintOverlayWindow();
                    _currentHintWindow.AutoCloseDuration = durationSeconds;
                    _currentHintWindow.SetEmoji(emoji);
                    _currentHintWindow.SetHint(title, description);
                    _currentHintWindow.SetAnimationType(animationType);

                    // Toujours utiliser Topmost - simple et efficace
                    _currentHintWindow.Topmost = true;

                    _currentHintWindow.HintDismissed += OnHintDismissed;
                    _currentHintWindow.ShowHint();

                    HintShown?.Invoke(this, EventArgs.Empty);
                    Console.WriteLine($"[HintService] Hint affiché: {emoji} {title} (anim: {animationType})");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[HintService] Erreur affichage hint: {ex.Message}");
                }
            });
        }

        /// <summary>
        /// Affiche le hint "main ouverte" (pour idle)
        /// </summary>
        public void ShowOpenHandHint()
        {
            if (_idleHintAlreadyShown) return;
            
            string title = _currentLanguage == "en" ? "Open Hand" : "Main ouverte";
            string desc = _currentLanguage == "en" 
                ? "Keep your hand open and move it to control the cursor" 
                : "Gardez la main ouverte et déplacez-la pour contrôler le curseur";
            
            ShowCustomHint("🖐️", title, desc, 4, HintAnimationType.Pulse);
            _idleHintAlreadyShown = true;
        }

        /// <summary>
        /// Affiche le hint "swipe" (pour le tutoriel) avec animation de déplacement
        /// </summary>
        public void ShowSwipeHint(string direction = "right")
        {
            string title, desc;
            HintAnimationType animType;
            
            switch (direction.ToLower())
            {
                case "left":
                    title = _currentLanguage == "en" ? "Swipe Left" : "Balayez à gauche";
                    desc = _currentLanguage == "en" 
                        ? "Swipe your open hand to the left" 
                        : "Balayez votre main ouverte vers la gauche";
                    animType = HintAnimationType.SwipeLeft;
                    break;
                case "up":
                    title = _currentLanguage == "en" ? "Swipe Up" : "Balayez vers le haut";
                    desc = _currentLanguage == "en" 
                        ? "Swipe your open hand upward" 
                        : "Balayez votre main ouverte vers le haut";
                    animType = HintAnimationType.SwipeUp;
                    break;
                case "down":
                    title = _currentLanguage == "en" ? "Swipe Down" : "Balayez vers le bas";
                    desc = _currentLanguage == "en" 
                        ? "Swipe your open hand downward" 
                        : "Balayez votre main ouverte vers le bas";
                    animType = HintAnimationType.SwipeDown;
                    break;
                default: // right
                    title = _currentLanguage == "en" ? "Swipe Right" : "Balayez à droite";
                    desc = _currentLanguage == "en" 
                        ? "Swipe your open hand to the right" 
                        : "Balayez votre main ouverte vers la droite";
                    animType = HintAnimationType.SwipeRight;
                    break;
            }
            
            // Emoji main ouverte 🖐️ pour tous les swipes
            ShowCustomHint("🖐️", title, desc, 5, animType);
        }

        /// <summary>
        /// Affiche le hint "move cursor" (pour le tutoriel)
        /// </summary>
        public void ShowMoveHint()
        {
            string title = _currentLanguage == "en" ? "Move Cursor" : "Déplacez le curseur";
            string desc = _currentLanguage == "en" 
                ? "Keep your hand open and move it to the target" 
                : "Gardez la main ouverte et déplacez-la vers la cible";
            
            ShowCustomHint("🖐️", title, desc, 5, HintAnimationType.Pulse);
        }

        /// <summary>
        /// Affiche le hint "click" (pour le tutoriel) - pince avec index et pouce
        /// </summary>
        public void ShowClickHint()
        {
            string title = _currentLanguage == "en" ? "Click" : "Cliquez";
            string desc = _currentLanguage == "en"
                ? "Pinch with your thumb and index finger to click"
                : "Pincez avec le pouce et l'index pour cliquer";

            // Emoji 🤏 (pinching hand) représente bien le pouce et l'index
            ShowCustomHint("🤏", title, desc, 5, HintAnimationType.Pinch);
        }

        /// <summary>
        /// Affiche le hint "hold click" (pour le tutoriel) - drag and drop
        /// </summary>
        public void ShowHoldClickHint()
        {
            string title = _currentLanguage == "en" ? "Drag & Drop" : "Glisser-déposer";
            string desc = _currentLanguage == "en"
                ? "Pinch and hold to drag, then release to drop"
                : "Pincez et maintenez pour glisser, puis relâchez pour déposer";

            // Emoji 🤏 (pinching hand) avec animation de swipe pour montrer le mouvement
            ShowCustomHint("🤏", title, desc, 5, HintAnimationType.SwipeRight);
        }

        /// <summary>
        /// Cache le hint actuellement affiché
        /// </summary>
        public void HideCurrentHint()
        {
            Application.Current.Dispatcher.Invoke(() =>
            {
                if (_currentHintWindow != null)
                {
                    try
                    {
                        _currentHintWindow.HideHint();
                    }
                    catch
                    {
                        // Fenêtre peut être déjà fermée
                    }
                    _currentHintWindow = null;
                }
            });
        }

        private void OnIdleTimerTick(object sender, EventArgs e)
        {
            // Ne pas afficher si le tutoriel est déjà fait
            if (_isTutorialCompleted) return;
            
            // Ne pas afficher si on est dans le tutoriel
            if (_isInTutorial) return;
            
            // Ne pas afficher si hints désactivés
            if (!_hintsEnabled) return;
            
            // Ne pas afficher si déjà montré cette session
            if (_idleHintAlreadyShown) return;
            
            // Ne pas afficher si un hint est déjà visible
            if (_currentHintWindow != null) return;
            
            var idleTime = DateTime.Now - _lastActivityTime;
            
            if (idleTime >= _idleThreshold)
            {
                Console.WriteLine($"[HintService] Idle détecté ({idleTime.TotalSeconds:F0}s), affichage hint");
                ShowOpenHandHint();
            }
        }

        private void OnHintDismissed(object sender, EventArgs e)
        {
            HintDismissed?.Invoke(this, EventArgs.Empty);
            _currentHintWindow = null;
            _lastActivityTime = DateTime.Now;
        }

        public void Dispose()
        {
            Stop();
            _idleTimer.Tick -= OnIdleTimerTick;
        }
    }
}
