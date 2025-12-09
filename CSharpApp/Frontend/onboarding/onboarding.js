const steps = [
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
  { id: "move-cursor", expected: "move" },
  { id: "click-target", expected: "click" },
  { id: "end", expected: null },
];

let currentStep = 0;
let canvas, drawingCanvas, ctx, drawingCtx, finishBtn, onboardingTitle;

const cursor = { x: undefined, y: undefined };
const target = { x: undefined, y: undefined, radius: undefined };

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
      switch (stepId) {
        case "swipe-right":
          api.ShowSwipeHint("right");
          break;
        case "swipe-left":
          api.ShowSwipeHint("left");
          break;
        case "move-cursor":
          api.ShowMoveHint();
          break;
        case "click-target":
          api.ShowClickHint();
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
  if (step.id === "move-cursor" || step.id === "click-target") {
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

function drawTarget() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!steps[currentStep]) return;

  const stepId = steps[currentStep].id;

  if (stepId === "move-cursor") {
    // Draw a red-white target at the center
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radii = [75, 60, 45, 30, 15]; // radii for the rings
    const colors = ["#c81927", "#fff", "#c81927", "#fff", "#c81927"]; // red, white, red

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
    // Draw a red-white target at the center
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radii = [75, 60, 45, 30, 15]; // radii for the rings
    const colors = ["#2c8ad1", "#fff", "#2c8ad1", "#fff", "#2c8ad1"]; // red, white, red

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
}

function handleMessage(msg) {
  try {
    const parsed = JSON.parse(msg);
    const step = steps[currentStep];
    if (!step || step.expected === null) return;

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

    // CLICK
    if (step.expected === "click" && parsed.method === "click") {
      const x = Number(parsed.params.x);
      const y = Number(parsed.params.y);
      const canvasX = (x / 400) * canvas.width;
      const canvasY = (y / 240) * canvas.height;
      const dx = x - target.x;
      const dy = y - target.y;

      const inTarget =
        Math.sqrt((canvasX - target.x) ** 2 + (canvasY - target.y) ** 2) <
        target.radius - 5;

      if (inTarget) {
        advanceStep();
      }
      return;
    }

    // SWIPE
    if (
      parsed.method === step.expected.method &&
      JSON.stringify(parsed.params) === JSON.stringify(step.expected.params)
    ) {
      advanceStep();
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

  console.log("mousedown", event);
  let x = event.offsetX || event.layerX;
  let y = event.offsetY || event.layerY;
  handleMessage(
    `{"category":"actions","method":"click","params":{"x":${x},"y":${y}}}`
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
