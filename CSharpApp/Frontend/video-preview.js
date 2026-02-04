/**
 * Module de gestion de l'aperçu vidéo persistant
 * Ce module restaure automatiquement l'état de l'aperçu vidéo
 * lors de la navigation entre les pages
 */

(function() {
  'use strict';

  // État global de l'aperçu vidéo (stocké dans localStorage pour persister)
  let videoPreviewEnabled = localStorage.getItem('videoPreviewEnabled') === 'true';

  // Initialisation au chargement de la page
  document.addEventListener('DOMContentLoaded', function() {
    console.log('[VideoPreview] Initializing...');
    
    // Si l'aperçu était activé, le rouvrir automatiquement
    if (videoPreviewEnabled) {
      console.log('[VideoPreview] Restoring video preview state...');
      openVideoPreview();
    }
  });

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

  // Exposer les fonctions globalement pour utilisation depuis settings.js
  window.videoPreview = {
    open: openVideoPreview,
    close: closeVideoPreview,
    isEnabled: function() { return videoPreviewEnabled; }
  };

})();
