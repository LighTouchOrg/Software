/**
 * Module de gestion de l'aperçu vidéo persistant
 * Ce module permet d'afficher un aperçu vidéo flottant qui reste visible
 * lors de la navigation entre les pages
 */

(function() {
  'use strict';

  // État global de l'aperçu vidéo (stocké dans localStorage pour persister)
  let videoPreviewEnabled = localStorage.getItem('videoPreviewEnabled') === 'true';

  // Initialisation au chargement de la page
  document.addEventListener('DOMContentLoaded', function() {
    console.log('[VideoPreview] Initializing...');
    
    // Créer le bouton toggle s'il n'existe pas déjà
    createToggleButton();
    
    // Restaurer l'état du toggle
    updateToggleButton();
    
    // Si l'aperçu était activé, le rouvrir
    if (videoPreviewEnabled) {
      console.log('[VideoPreview] Restoring video preview state...');
      openVideoPreview();
    }
  });

  /**
   * Crée le bouton toggle pour l'aperçu vidéo s'il n'existe pas
   */
  function createToggleButton() {
    // Vérifier si le bouton existe déjà
    if (document.getElementById('video-preview-toggle-btn')) {
      return;
    }

    // Créer le conteneur du bouton
    const toggleContainer = document.createElement('div');
    toggleContainer.id = 'video-preview-toggle-btn';
    toggleContainer.className = 'video-preview-toggle';
    toggleContainer.title = 'Activer/Désactiver l\'aperçu vidéo';
    
    // Créer l'icône caméra
    const icon = document.createElement('span');
    icon.className = 'video-preview-icon';
    icon.innerHTML = '📹';
    
    toggleContainer.appendChild(icon);
    document.body.appendChild(toggleContainer);
    
    // Ajouter l'événement de clic
    toggleContainer.addEventListener('click', function() {
      toggleVideoPreview();
    });
  }

  /**
   * Met à jour l'apparence du bouton toggle
   */
  function updateToggleButton() {
    const toggleBtn = document.getElementById('video-preview-toggle-btn');
    if (toggleBtn) {
      if (videoPreviewEnabled) {
        toggleBtn.classList.add('active');
      } else {
        toggleBtn.classList.remove('active');
      }
    }
  }

  /**
   * Active/désactive l'aperçu vidéo
   */
  function toggleVideoPreview() {
    videoPreviewEnabled = !videoPreviewEnabled;
    localStorage.setItem('videoPreviewEnabled', videoPreviewEnabled);
    
    console.log('[VideoPreview] Toggle:', videoPreviewEnabled);
    
    updateToggleButton();
    
    if (videoPreviewEnabled) {
      openVideoPreview();
    } else {
      closeVideoPreview();
    }
  }

  /**
   * Ouvre l'aperçu vidéo
   */
  function openVideoPreview() {
    if (window.electronAPI && window.electronAPI.openVideoStream) {
      console.log('[VideoPreview] Opening video stream...');
      window.electronAPI.openVideoStream();
    } else {
      console.error('[VideoPreview] electronAPI.openVideoStream not available');
    }
  }

  /**
   * Ferme l'aperçu vidéo
   */
  function closeVideoPreview() {
    if (window.electronAPI && window.electronAPI.closeVideoStream) {
      console.log('[VideoPreview] Closing video stream...');
      window.electronAPI.closeVideoStream();
    } else {
      console.error('[VideoPreview] electronAPI.closeVideoStream not available');
    }
  }

  // Exposer les fonctions globalement si nécessaire
  window.videoPreview = {
    toggle: toggleVideoPreview,
    open: openVideoPreview,
    close: closeVideoPreview,
    isEnabled: function() { return videoPreviewEnabled; }
  };

})();
