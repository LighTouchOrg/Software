using System;
using System.Windows;
using System.Windows.Media.Animation;
using System.Windows.Threading;

namespace LighTouch
{
    public enum HintAnimationType
    {
        Pulse,      // Pulsation simple (pour mouvement, idle)
        SwipeRight,
        SwipeLeft,
        SwipeUp,
        SwipeDown,
        Pinch       // Animation de pince (pour clic)
    }

    public partial class HintOverlayWindow : Window
    {
        private Storyboard _showAnimation;
        private Storyboard _hideAnimation;
        private Storyboard _pulseAnimation;
        private Storyboard _swipeRightAnimation;
        private Storyboard _swipeLeftAnimation;
        private Storyboard _swipeUpAnimation;
        private Storyboard _swipeDownAnimation;
        private Storyboard _pinchAnimation;
        private Storyboard _currentHandAnimation;
        private DispatcherTimer _autoCloseTimer;
        private bool _isClosing = false;

        public event EventHandler HintDismissed;

        /// <summary>
        /// Durée d'affichage du hint en secondes avant auto-fermeture
        /// </summary>
        public int AutoCloseDuration { get; set; } = 4;

        public HintOverlayWindow()
        {
            InitializeComponent();

            // Mettre la fenêtre en plein écran sans maximiser (pour éviter le conflit avec Focusable="False")
            Left = 0;
            Top = 0;
            Width = SystemParameters.PrimaryScreenWidth;
            Height = SystemParameters.PrimaryScreenHeight;

            // Récupérer les animations
            _showAnimation = (Storyboard)FindResource("ShowHintAnimation");
            _hideAnimation = (Storyboard)FindResource("HideHintAnimation");
            _pulseAnimation = (Storyboard)FindResource("PulseAnimation");
            _swipeRightAnimation = (Storyboard)FindResource("SwipeRightAnimation");
            _swipeLeftAnimation = (Storyboard)FindResource("SwipeLeftAnimation");
            _swipeUpAnimation = (Storyboard)FindResource("SwipeUpAnimation");
            _swipeDownAnimation = (Storyboard)FindResource("SwipeDownAnimation");
            _pinchAnimation = (Storyboard)FindResource("PinchAnimation");
            
            // Timer pour auto-fermeture
            _autoCloseTimer = new DispatcherTimer();
            _autoCloseTimer.Tick += (s, e) =>
            {
                _autoCloseTimer.Stop();
                HideHint();
            };
            
            // Quand l'animation de fermeture est terminée, fermer la fenêtre
            _hideAnimation.Completed += (s, e) =>
            {
                if (_isClosing)
                {
                    StopCurrentHandAnimation();
                    this.Close();
                }
            };
        }

        /// <summary>
        /// Définit le contenu du hint (titre et description)
        /// </summary>
        public void SetHint(string title, string description)
        {
            HintTitle.Text = title;
            HintDescription.Text = description;
        }

        /// <summary>
        /// Définit l'emoji à afficher
        /// </summary>
        public void SetEmoji(string emoji)
        {
            HandEmoji.Text = emoji;
        }

        /// <summary>
        /// Définit le type d'animation pour la main
        /// </summary>
        public void SetAnimationType(HintAnimationType animationType)
        {
            StopCurrentHandAnimation();
            
            switch (animationType)
            {
                case HintAnimationType.SwipeRight:
                    _currentHandAnimation = _swipeRightAnimation;
                    break;
                case HintAnimationType.SwipeLeft:
                    _currentHandAnimation = _swipeLeftAnimation;
                    break;
                case HintAnimationType.SwipeUp:
                    _currentHandAnimation = _swipeUpAnimation;
                    break;
                case HintAnimationType.SwipeDown:
                    _currentHandAnimation = _swipeDownAnimation;
                    break;
                case HintAnimationType.Pinch:
                    _currentHandAnimation = _pinchAnimation;
                    break;
                case HintAnimationType.Pulse:
                default:
                    _currentHandAnimation = _pulseAnimation;
                    break;
            }
        }

        private void StopCurrentHandAnimation()
        {
            _pulseAnimation?.Stop();
            _swipeRightAnimation?.Stop();
            _swipeLeftAnimation?.Stop();
            _swipeUpAnimation?.Stop();
            _swipeDownAnimation?.Stop();
            _pinchAnimation?.Stop();
            _currentHandAnimation = null;
            
            // Reset les transforms
            HandTranslateTransform.X = 0;
            HandTranslateTransform.Y = 0;
            HandScaleTransform.ScaleX = 1;
            HandScaleTransform.ScaleY = 1;
            HandEmoji.Opacity = 1;
        }

        /// <summary>
        /// Affiche le hint avec animation et auto-fermeture après X secondes
        /// </summary>
        public void ShowHint()
        {
            _isClosing = false;
            this.Show();
            _showAnimation.Begin();
            
            // Démarrer l'animation de la main
            if (_currentHandAnimation != null)
            {
                _currentHandAnimation.Begin();
            }
            else
            {
                _pulseAnimation.Begin();
            }
            
            // Démarrer le timer d'auto-fermeture
            _autoCloseTimer.Interval = TimeSpan.FromSeconds(AutoCloseDuration);
            _autoCloseTimer.Start();
        }

        /// <summary>
        /// Cache le hint avec animation
        /// </summary>
        public void HideHint()
        {
            if (_isClosing) return;
            
            _autoCloseTimer.Stop();
            _isClosing = true;
            _hideAnimation.Begin();
            HintDismissed?.Invoke(this, EventArgs.Empty);
        }
    }
}
