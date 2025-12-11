const steps = [
  { id: "move-cursor-1", expected: "move", targetPos: "top-left" },
  { id: "move-cursor-2", expected: "move", targetPos: "bottom-right" },
  { id: "move-cursor-3", expected: "move", targetPos: "center" },
  {
    id: "swipe-right",
    expected: {
      category: "actions",
      method: "swipe",
      params: { direction: "right" },
    },
  },
  {
    id: "swipe-left",
    expected: {
      category: "actions",
      method: "swipe",
      params: { direction: "left" },
    },
  },
  { id: "click-target", expected: "click" },
  { id: "hold-click-target", expected: "click_down" },
  { id: "end", expected: null },
];

let currentStep = 0;
let canvas, drawingCanvas, ctx, drawingCtx, finishBtn, onboardingTitle;

const cursor = { x: undefined, y: undefined };
const target = { x: undefined, y: undefined, radius: undefined };

// Pour le drag-and-drop
const dragObject = { x: undefined, y: undefined, size: 60, isDragging: false };
const dropZone = { x: undefined, y: undefined, size: 80 };

// Pour l'animation des swipes en temps réel
const swipeIndicator = {
  startX: undefined,
  startY: undefined,
  currentX: undefined,
  currentY: undefined,
  isActive: false
};

// Tracker pour éviter d'afficher les hints plusieurs fois
const shownHints = new Set();

const stepText = document.getElementById("step-text");

function t(key) {
  const lang = localStorage.getItem("preferredLang") || "fr";
  return window.translations?.[lang]?.[key] || key;
}

// Obtient l'API d'onboarding (nouvelle fenêtre WPF)
async function getOnboardingAPI() {
  // Attendre que l'API soit disponible
  if (chrome && chrome.webview && chrome.webview.hostObjects) {
    return chrome.webview.hostObjects.onboardingAPI;
  }
  return null;
}

// Affiche le hint correspondant à l'étape actuelle
function showHintForStep(stepId) {
  // Petit délai pour laisser le temps à l'UI de se mettre à jour
  setTimeout(async () => {
    const api = await getOnboardingAPI();
    if (!api) {
      console.warn('onboardingAPI not available');
      return;
    }

    try {
      // Déterminer le type de hint à afficher
      let hintType = null;

      if (stepId.startsWith("move-cursor")) {
        hintType = "move";
      } else if (stepId.startsWith("swipe")) {
        hintType = "swipe";
      } else if (stepId === "click-target") {
        hintType = "click";
      } else if (stepId === "hold-click-target") {
        hintType = "hold-click";
      }

      // Si ce type de hint a déjà été affiché, ne pas le réafficher
      if (hintType && shownHints.has(hintType)) {
        console.log(`Hint "${hintType}" already shown, skipping`);
        return;
      }

      // Marquer le hint comme affiché
      if (hintType) {
        shownHints.add(hintType);
      }

      // Afficher le hint approprié
      switch (stepId) {
        case "move-cursor-1":
        case "move-cursor-2":
        case "move-cursor-3":
          api.ShowMoveHint();
          break;
        case "swipe-right":
          api.ShowSwipeHint("right");
          break;
        case "swipe-left":
          api.ShowSwipeHint("left");
          break;
        case "click-target":
          api.ShowClickHint();
          break;
        case "hold-click-target":
          api.ShowHoldClickHint();
          break;
        case "end":
          api.HideHint();
          break;
      }
    } catch (e) {
      console.warn('Error showing hint:', e);
    }
  }, 300);
}

function updateStepText() {
  const step = steps[currentStep];
  stepText.textContent = t(`onboarding_step_${step.id.replace(/-/g, "_")}`);

  // Réinitialiser l'indicateur de swipe si on change d'étape
  swipeIndicator.isActive = false;
  swipeIndicator.startX = undefined;
  swipeIndicator.startY = undefined;
  swipeIndicator.currentX = undefined;
  swipeIndicator.currentY = undefined;

  // Afficher le canvas pour les étapes de mouvement, swipe et click
  const showCanvas = step.id.startsWith("move-cursor") || step.id.startsWith("swipe-") || step.id.includes("click-target");
  if (showCanvas) {
    canvas.classList.remove("hidden");
    requestAnimationFrame(drawTarget);
  } else {
    canvas.classList.add("hidden");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  if (step.id === "end") {
    finishBtn.classList.remove("hidden");
    drawingCanvas.classList.remove("hidden");
    onboardingTitle.classList.add("hidden");
  } else {
    finishBtn.classList.add("hidden");
    drawingCanvas.classList.add("hidden");
  }

  // Afficher le hint pour cette étape
  showHintForStep(step.id);
}

function advanceStep() {
  currentStep++;
  if (currentStep < steps.length) updateStepText();
}

function showSuccessAnimation(direction = null) {
  const startTime = Date.now();
  const duration = 600; // 600ms

  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (direction) {
      // Animation de flèche pour les swipes
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Distance de déplacement
      const maxDistance = 150;
      const distance = maxDistance * progress;

      // Calculer la position selon la direction
      let arrowX = centerX;
      let arrowY = centerY;
      let angle = 0;

      switch (direction) {
        case "right":
          arrowX = centerX + distance;
          angle = 0;
          break;
        case "left":
          arrowX = centerX - distance;
          angle = Math.PI;
          break;
        case "up":
          arrowY = centerY - distance;
          angle = -Math.PI / 2;
          break;
        case "down":
          arrowY = centerY + distance;
          angle = Math.PI / 2;
          break;
      }

      const alpha = 1 - progress;

      // Dessiner une flèche
      ctx.save();
      ctx.translate(arrowX, arrowY);
      ctx.rotate(angle);

      // Corps de la flèche
      ctx.strokeStyle = `rgba(46, 213, 115, ${alpha})`;
      ctx.fillStyle = `rgba(46, 213, 115, ${alpha})`;
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Ligne centrale
      ctx.beginPath();
      ctx.moveTo(-40, 0);
      ctx.lineTo(40, 0);
      ctx.stroke();

      // Pointe de flèche
      ctx.beginPath();
      ctx.moveTo(40, 0);
      ctx.lineTo(25, -15);
      ctx.lineTo(25, 15);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

    } else {
      // Animation de cercle vert pour les autres actions
      const alpha = 1 - progress;

      // Dessiner un cercle vert qui s'agrandit et devient transparent
      const maxRadius = 100;
      const radius = maxRadius * progress;

      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = `rgba(46, 213, 115, ${alpha})`;
      ctx.lineWidth = 8;
      ctx.stroke();

      // Dessiner un checkmark
      if (progress > 0.3) {
        const checkAlpha = Math.min((progress - 0.3) / 0.3, 1) * alpha;
        ctx.strokeStyle = `rgba(46, 213, 115, ${checkAlpha})`;
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const size = 30;

        ctx.beginPath();
        ctx.moveTo(centerX - size / 2, centerY);
        ctx.lineTo(centerX - size / 6, centerY + size / 2);
        ctx.lineTo(centerX + size / 2, centerY - size / 2);
        ctx.stroke();
      }
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Animation terminée, passer à l'étape suivante
      setTimeout(() => {
        updateStepText();
      }, 100);
    }
  }

  animate();
}

function drawTarget() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!steps[currentStep]) return;

  const step = steps[currentStep];
  const stepId = step.id;

  // Déterminer la position de la cible
  let centerX, centerY;

  if (stepId.startsWith("move-cursor")) {
    // Position selon targetPos avec marges réduites pour espacer davantage
    const margin = 80; // Réduit de 100 à 80 pour être plus près des bords
    switch (step.targetPos) {
      case "top-left":
        centerX = margin;
        centerY = margin;
        break;
      case "top-right":
        centerX = canvas.width - margin;
        centerY = margin;
        break;
      case "bottom-left":
        centerX = margin;
        centerY = canvas.height - margin;
        break;
      case "bottom-right":
        centerX = canvas.width - margin;
        centerY = canvas.height - margin;
        break;
      case "center":
      default:
        centerX = canvas.width / 2;
        centerY = canvas.height / 2;
        break;
    }

    // Dessiner une cible rouge-blanc pour le mouvement
    const radii = [75, 60, 45, 30, 15];
    const colors = ["#c81927", "#fff", "#c81927", "#fff", "#c81927"];

    for (let i = 0; i < radii.length; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radii[i], 0, 2 * Math.PI);
      ctx.fillStyle = colors[i];
      ctx.fill();
    }

    target.x = centerX;
    target.y = centerY;
    target.radius = radii[0];
  }

  if (stepId === "click-target") {
    // Cible au centre pour le click simple
    centerX = canvas.width / 2;
    centerY = canvas.height / 2;

    const radii = [75, 60, 45, 30, 15];
    const colors = ["#2c8ad1", "#fff", "#2c8ad1", "#fff", "#2c8ad1"]; // bleu

    for (let i = 0; i < radii.length; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radii[i], 0, 2 * Math.PI);
      ctx.fillStyle = colors[i];
      ctx.fill();
    }

    target.x = centerX;
    target.y = centerY;
    target.radius = radii[0];
  }

  if (stepId === "hold-click-target") {
    // Drag-and-drop : objet à gauche, zone de dépôt à droite

    // Zone de dépôt (à droite)
    dropZone.x = canvas.width - 120;
    dropZone.y = canvas.height / 2;

    // Dessiner la zone de dépôt avec un style moderne
    ctx.strokeStyle = "#2ecc71";
    ctx.lineWidth = 5;
    ctx.setLineDash([15, 8]);

    // Rectangle arrondi pour la zone de dépôt
    const cornerRadius = 10;
    ctx.beginPath();
    ctx.roundRect(
      dropZone.x - dropZone.size / 2,
      dropZone.y - dropZone.size / 2,
      dropZone.size,
      dropZone.size,
      cornerRadius
    );
    ctx.stroke();
    ctx.setLineDash([]);

    // Fond semi-transparent
    ctx.fillStyle = "rgba(46, 204, 113, 0.15)";
    ctx.fill();

    // Dessiner un symbole + au centre pour indiquer la zone de dépôt
    ctx.strokeStyle = "#2ecc71";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    const plusSize = 20;

    // Ligne horizontale du +
    ctx.beginPath();
    ctx.moveTo(dropZone.x - plusSize, dropZone.y);
    ctx.lineTo(dropZone.x + plusSize, dropZone.y);
    ctx.stroke();

    // Ligne verticale du +
    ctx.beginPath();
    ctx.moveTo(dropZone.x, dropZone.y - plusSize);
    ctx.lineTo(dropZone.x, dropZone.y + plusSize);
    ctx.stroke();

    // Initialiser l'objet draggable s'il n'a pas de position
    if (dragObject.x === undefined) {
      dragObject.x = 120;
      dragObject.y = canvas.height / 2;
    }

    // Dessiner l'objet draggable avec un cercle moderne
    const gradient = ctx.createRadialGradient(
      dragObject.x, dragObject.y, 0,
      dragObject.x, dragObject.y, dragObject.size / 2
    );

    if (dragObject.isDragging) {
      gradient.addColorStop(0, "#ff6b6b");
      gradient.addColorStop(1, "#ee5a6f");
    } else {
      gradient.addColorStop(0, "#f39c12");
      gradient.addColorStop(1, "#e67e22");
    }

    // Shadow plus prononcé pendant le drag
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = dragObject.isDragging ? 20 : 15;
    ctx.shadowOffsetX = dragObject.isDragging ? 0 : 4;
    ctx.shadowOffsetY = dragObject.isDragging ? 0 : 4;

    // Dessiner un cercle au lieu d'un carré
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(dragObject.x, dragObject.y, dragObject.size / 2, 0, 2 * Math.PI);
    ctx.fill();

    // Bordure blanche
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Réinitialiser le shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Dessiner des points de préhension au centre (grip dots)
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    const dotRadius = 3;
    const dotSpacing = 8;
    const dotRows = 3;
    const dotCols = 2;

    for (let row = 0; row < dotRows; row++) {
      for (let col = 0; col < dotCols; col++) {
        const dotX = dragObject.x - (dotCols - 1) * dotSpacing / 2 + col * dotSpacing;
        const dotY = dragObject.y - (dotRows - 1) * dotSpacing / 2 + row * dotSpacing;

        ctx.beginPath();
        ctx.arc(dotX, dotY, dotRadius, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Si en train de drag, ajouter un effet de mouvement avec des lignes
    if (dragObject.isDragging) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";

      // Lignes de mouvement
      for (let i = 0; i < 3; i++) {
        const offset = 8 + i * 6;
        ctx.beginPath();
        ctx.moveTo(dragObject.x + offset, dragObject.y - 8);
        ctx.lineTo(dragObject.x + offset + 6, dragObject.y - 8);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(dragObject.x + offset, dragObject.y + 8);
        ctx.lineTo(dragObject.x + offset + 6, dragObject.y + 8);
        ctx.stroke();
      }
    }
  }
}

function handleMessage(msg) {
  try {
    const parsed = JSON.parse(msg);
    const step = steps[currentStep];
    if (!step || step.expected === null) return;

    // Détection de mouvement pour l'animation des swipes
    if (step.id && step.id.startsWith("swipe-") && parsed.method === "move") {
      const x = Number(parsed.params.x);
      const y = Number(parsed.params.y);
      const canvasX = (x / 400) * canvas.width;
      const canvasY = (y / 240) * canvas.height;

      if (!swipeIndicator.isActive) {
        // Initialiser le point de départ
        swipeIndicator.startX = canvasX;
        swipeIndicator.startY = canvasY;
        swipeIndicator.isActive = true;
      }

      // Mettre à jour la position actuelle
      swipeIndicator.currentX = canvasX;
      swipeIndicator.currentY = canvasY;

      requestAnimationFrame(drawTarget);
    }

    // MOVE
    if (step.expected === "move" && parsed.method === "move") {
      const x = Number(parsed.params.x);
      const y = Number(parsed.params.y);
      const canvasX = (x / 400) * canvas.width;
      const canvasY = (y / 240) * canvas.height;
      cursor.x = canvasX;
      cursor.y = canvasY;

      const inTarget =
        Math.sqrt((canvasX - target.x) ** 2 + (canvasY - target.y) ** 2) <
        target.radius - 5;

      requestAnimationFrame(drawTarget);

      if (inTarget) {
        advanceStep();
      }
      return;
    }

    // CLICK (détecté sur click_up pour cohérence avec drag-and-drop)
    if (step.expected === "click" && parsed.method === "click_up") {
      const x = Number(parsed.params.x);
      const y = Number(parsed.params.y);
      const canvasX = (x / 400) * canvas.width;
      const canvasY = (y / 240) * canvas.height;

      const inTarget =
        Math.sqrt((canvasX - target.x) ** 2 + (canvasY - target.y) ** 2) <
        target.radius - 5;

      if (inTarget) {
        advanceStep();
      }
      return;
    }

    // DRAG AND DROP
    if (step.expected === "click_down") {
      const x = Number(parsed.params.x);
      const y = Number(parsed.params.y);
      const canvasX = (x / 400) * canvas.width;
      const canvasY = (y / 240) * canvas.height;

      // Vérifier si on clique sur l'objet draggable
      if (parsed.method === "click_down") {
        const dx = canvasX - dragObject.x;
        const dy = canvasY - dragObject.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < dragObject.size / 2) {
          dragObject.isDragging = true;
          console.log("Started dragging");
        }
        return;
      }

      // Déplacer l'objet pendant le drag
      if (parsed.method === "move" && dragObject.isDragging) {
        dragObject.x = canvasX;
        dragObject.y = canvasY;
        requestAnimationFrame(drawTarget);
        return;
      }

      // Terminer le drag et vérifier si dans la zone de dépôt
      if (parsed.method === "click_up") {
        if (dragObject.isDragging) {
          dragObject.isDragging = false;

          // Vérifier si l'objet est dans la zone de dépôt
          const inDropZone =
            Math.abs(dragObject.x - dropZone.x) < dropZone.size / 2 &&
            Math.abs(dragObject.y - dropZone.y) < dropZone.size / 2;

          if (inDropZone) {
            console.log("Successfully dropped in zone!");
            // Animation de succès
            dragObject.x = dropZone.x;
            dragObject.y = dropZone.y;
            requestAnimationFrame(drawTarget);

            setTimeout(() => {
              advanceStep();
            }, 300);
          } else {
            // Remettre l'objet à sa position initiale
            dragObject.x = 120;
            dragObject.y = canvas.height / 2;
            requestAnimationFrame(drawTarget);
          }
        }
        return;
      }
    }

    // SWIPE - avec animation pour tous les swipes (même incorrects)
    if (step.id && step.id.startsWith("swipe-") && parsed.method === "swipe") {
      // Réinitialiser l'indicateur de swipe
      swipeIndicator.isActive = false;
      swipeIndicator.startX = undefined;
      swipeIndicator.startY = undefined;
      swipeIndicator.currentX = undefined;
      swipeIndicator.currentY = undefined;

      const direction = parsed.params.direction;
      const isCorrect = JSON.stringify(parsed.params) === JSON.stringify(step.expected.params);

      if (isCorrect) {
        // Incrémenter l'étape sans appeler updateStepText
        currentStep++;
        // Afficher l'animation de succès avec flèche dans la direction du swipe
        showSuccessAnimation(direction);
      } else {
        // Afficher l'animation même si c'est le mauvais swipe (mais ne pas avancer)
        showSuccessAnimation(direction);
        // Redessiner l'écran après l'animation
        setTimeout(() => {
          requestAnimationFrame(drawTarget);
        }, 700);
      }
      return;
    }
  } catch (e) {
    console.warn("Message invalide dans handleMessage :", msg);
  }
}

document.addEventListener("keydown", (event) => {
  const test = {
    ArrowRight:
      '{"category":"actions","method":"swipe","params":{"direction":"right"}}',
    ArrowLeft:
      '{"category":"actions","method":"swipe","params":{"direction":"left"}}',
  };
  if (test[event.key]) handleMessage(test[event.key]);
});

document.addEventListener("mousemove", (event) => {
  let x = event.offsetX || event.layerX;
  let y = event.offsetY || event.layerY;
  handleMessage(
    `{"category":"actions","method":"move","params":{"x":${x},"y":${y}}}`
  );
});

document.addEventListener("mousedown", (event) => {
  if (!drawingCanvas.classList.contains("hidden")) {
    let isDrawing = false;

    // Define the mousemove handler as a named function
    const handleMouseMove = (e) => {
      if (!isDrawing) {
        drawingCtx.beginPath();
        drawingCtx.moveTo(e.offsetX, e.offsetY);
        isDrawing = true;
      } else {
        drawingCtx.lineTo(e.offsetX, e.offsetY);
        drawingCtx.stroke();
      }
    };

    // Set up drawing style
    drawingCtx.strokeStyle = "#9b6ee2";
    drawingCtx.lineWidth = 10;
    drawingCtx.lineCap = "round"; // Rounded line ends
    drawingCtx.lineJoin = "round"; // Rounded line joins

    // Start drawing
    drawingCtx.beginPath();
    drawingCtx.moveTo(event.offsetX, event.offsetY);
    isDrawing = true;

    // Add the mousemove listener to the canvas
    drawingCanvas.addEventListener("mousemove", handleMouseMove);

    // Define the mouseup handler
    const handleMouseUp = () => {
      drawingCanvas.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp); // Remove from document
      isDrawing = false;
    };

    // Add the mouseup listener to the document (not just the canvas)
    document.addEventListener("mouseup", handleMouseUp);
    return;
  }

  // Send click_down for drag-and-drop support
  console.log("mousedown", event);
  let x = event.offsetX || event.layerX;
  let y = event.offsetY || event.layerY;
  handleMessage(
    `{"category":"actions","method":"click_down","params":{"x":${x},"y":${y}}}`
  );
});

document.addEventListener("mouseup", (event) => {
  // Don't interfere with drawing canvas
  if (!drawingCanvas.classList.contains("hidden")) {
    return;
  }

  // Send click_up for drag-and-drop support
  console.log("mouseup", event);
  let x = event.offsetX || event.layerX;
  let y = event.offsetY || event.layerY;
  handleMessage(
    `{"category":"actions","method":"click_up","params":{"x":${x},"y":${y}}}`
  );
});

function resizeCanvas() {
  const drawingCanvas = document.getElementById('drawing-canvas');

  if (!drawingCanvas) return;

  // Calculate responsive dimensions
  const viewportHeight = window.innerHeight;
  const displayHeight = Math.floor(viewportHeight * 0.4); // 40vh
  const displayWidth = Math.min(800, window.innerWidth * 0.9);

  // Set canvas internal dimensions (affects drawing area)
  drawingCanvas.width = displayWidth;
  drawingCanvas.height = displayHeight;

  // Set CSS dimensions (affects display size) - should match internal dimensions
  drawingCanvas.style.width = displayWidth + 'px';
  drawingCanvas.style.height = displayHeight + 'px';
}

window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

// Ferme le tutoriel proprement via l'API WPF
async function closeTutorial() {
  console.log("Closing tutorial...");
  
  const api = await getOnboardingAPI();
  if (api) {
    try {
      api.CloseOnboarding();
    } catch (e) {
      console.warn('Error closing onboarding:', e);
    }
  }
}

// Termine le tutoriel avec succès via l'API WPF
async function finishTutorial() {
  console.log("Finishing tutorial...");
  
  // Marquer le tutoriel comme complété dans localStorage
  localStorage.setItem("tutorialCompleted", "true");
  
  const api = await getOnboardingAPI();
  if (api) {
    try {
      api.SetTutorialCompleted(true);
      api.FinishOnboarding();
    } catch (e) {
      console.warn('Error finishing onboarding:', e);
    }
  }
}

// Gestion de la touche Escape pour fermer le tutoriel
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    closeTutorial();
  }
});

window.addEventListener("DOMContentLoaded", () => {
  if (typeof applyTranslations === "function") applyTranslations();
  canvas = document.getElementById("target-canvas");
  drawingCanvas = document.getElementById("drawing-canvas");
  onboardingTitle = document.getElementById("onboarding-title");
  ctx = canvas.getContext("2d");
  drawingCtx = drawingCanvas.getContext("2d");
  finishBtn = document.getElementById("finish-btn");
  
  // La fenêtre WPF est déjà en plein écran, pas besoin de requestFullscreen
  
  finishBtn.addEventListener("click", () => {
    finishTutorial();
  });
  
  updateStepText();
});

window.addEventListener("message", (event) => {
  if (typeof event.data === "string") {
    handleMessage(event.data);
  }
});
