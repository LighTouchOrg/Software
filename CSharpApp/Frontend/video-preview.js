/**
 * Module de gestion de l'aperçu vidéo persistant intégré
 * Affiche la vidéo directement dans la page au lieu d'ouvrir une fenêtre séparée
 */

(function() {
  'use strict';

  // État global de l'aperçu vidéo (stocké dans localStorage pour persister)
  let videoPreviewEnabled = localStorage.getItem('videoPreviewEnabled') === 'true';
  let videoContainer = null;
  let videoImage = null;
  let statusElement = null;
  let fpsElement = null;
  let isDragging = false;
  let currentX = 0;
  let currentY = 0;
  let initialX = 0;
  let initialY = 0;

  // Initialisation au chargement de la page
  document.addEventListener('DOMContentLoaded', function() {
    console.log('[VideoPreview] Initializing...');
    
    // Créer le conteneur HTML pour la vidéo
    createVideoContainer();
    
    // Si l'aperçu était activé, le réafficher
    if (videoPreviewEnabled) {
      console.log('[VideoPreview] Restoring video preview state...');
      showVideoContainer();
      // Demander les frames au backend via WebSocket ou polling
      startVideoStream();
    }
  });

  /**
   * Crée le conteneur HTML pour l'aperçu vidéo intégré
   */
  function createVideoContainer() {
    // Vérifier si le conteneur existe déjà
    if (document.getElementById('video-preview-container')) {
      videoContainer = document.getElementById('video-preview-container');
      return;
    }

    // Créer le conteneur principal
    videoContainer = document.createElement('div');
    videoContainer.id = 'video-preview-container';
    videoContainer.innerHTML = `
      <div class="video-preview-header">
        <div class="video-preview-title">
          📹 Aperçu vidéo
          <span class="video-preview-status" id="video-status">Déconnecté</span>
        </div>
        <button class="video-preview-close" id="video-close-btn">×</button>
      </div>
      <div class="video-preview-content">
        <img id="video-preview-image" alt="Video Stream" style="display: none;" />
        <div class="video-preview-message" id="video-message">En attente de connexion...</div>
      </div>
      <div class="video-preview-footer">
        <span id="video-fps">0 FPS</span>
        <span id="video-resolution">--</span>
      </div>
    `;

    document.body.appendChild(videoContainer);

    // Récupérer les éléments
    videoImage = document.getElementById('video-preview-image');
    statusElement = document.getElementById('video-status');
    fpsElement = document.getElementById('video-fps');

    // Ajouter les événements
    const closeBtn = document.getElementById('video-close-btn');
    closeBtn.addEventListener('click', function() {
      closeVideoPreview();
    });

    // Rendre le conteneur déplaçable
    const header = videoContainer.querySelector('.video-preview-header');
    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
  }

  /**
   * Gestion du drag & drop pour déplacer le conteneur
   */
  function dragStart(e) {
    initialX = e.clientX - currentX;
    initialY = e.clientY - currentY;
    
    if (e.target.closest('.video-preview-header')) {
      isDragging = true;
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      
      videoContainer.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }
  }

  function dragEnd() {
    isDragging = false;
  }

  /**
   * Affiche le conteneur vidéo
   */
  function showVideoContainer() {
    if (videoContainer) {
      videoContainer.classList.add('active');
    }
  }

  /**
   * Cache le conteneur vidéo
   */
  function hideVideoContainer() {
    if (videoContainer) {
      videoContainer.classList.remove('active');
    }
  }

  /**
   * Démarre le streaming vidéo (appelle le backend C#)
   */
  function startVideoStream() {
    console.log('[VideoPreview] Starting video stream via C# backend...');
    // Le backend C# va commencer à envoyer des frames
    // Pour l'instant, on simule juste l'interface
    updateStatus('connected', 'Connecté');
    
    // Masquer le message et afficher l'image
    const messageEl = document.getElementById('video-message');
    if (messageEl) messageEl.style.display = 'none';
    if (videoImage) videoImage.style.display = 'block';
  }

  /**
   * Arrête le streaming vidéo
   */
  function stopVideoStream() {
    console.log('[VideoPreview] Stopping video stream...');
    updateStatus('disconnected', 'Déconnecté');
    
    // Afficher le message et cacher l'image
    const messageEl = document.getElementById('video-message');
    if (messageEl) {
      messageEl.textContent = 'Vidéo désactivée';
      messageEl.style.display = 'block';
    }
    if (videoImage) videoImage.style.display = 'none';
  }

  /**
   * Met à jour le statut de connexion
   */
  function updateStatus(status, text) {
    if (statusElement) {
      statusElement.textContent = text;
      statusElement.className = 'video-preview-status ' + status;
    }
  }

  /**
   * Ouvre l'aperçu vidéo
   */
  function openVideoPreview() {
    videoPreviewEnabled = true;
    localStorage.setItem('videoPreviewEnabled', 'true');
    
    showVideoContainer();
    startVideoStream();
    
    console.log('[VideoPreview] Video preview opened (embedded mode)');
  }

  /**
   * Ferme l'aperçu vidéo
   */
  function closeVideoPreview() {
    videoPreviewEnabled = false;
    localStorage.setItem('videoPreviewEnabled', 'false');
    
    stopVideoStream();
    hideVideoContainer();
    
    console.log('[VideoPreview] Video preview closed');
  }

  // Exposer les fonctions globalement pour utilisation depuis settings.js
  window.videoPreview = {
    open: openVideoPreview,
    close: closeVideoPreview,
    isEnabled: function() { return videoPreviewEnabled; },
    updateFrame: function(imageData) {
      // Fonction pour mettre à jour l'image depuis le backend C#
      if (videoImage && imageData) {
        videoImage.src = imageData;
      }
    },
    updateFPS: function(fps) {
      if (fpsElement) {
        fpsElement.textContent = fps + ' FPS';
      }
    }
  };

})();
