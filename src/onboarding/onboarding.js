const steps = [
  { id: "swipe-right", expected: { category: "actions", method: "swipe", params: { direction: "right" } } },
  { id: "swipe-left", expected: { category: "actions", method: "swipe", params: { direction: "left" } } },
  { id: "move-cursor", expected: "move" },
  { id: "click-target", expected: "click" },
  { id: "end", expected: null }
];

let currentStep = 0;
let canvas, ctx, finishBtn;

const cursor = { x: undefined, y: undefined };
const target = { x: undefined, y: undefined, radius: undefined };

const stepText = document.getElementById('step-text');

function t(key) {
  const lang = localStorage.getItem('preferredLang') || 'fr';
  return window.translations?.[lang]?.[key] || key;
}

function updateStepText() {
  const step = steps[currentStep];
  stepText.textContent = t(`onboarding_step_${step.id.replace(/-/g, '_')}`);
  if (step.id === 'move-cursor' || step.id === 'click-target') {
    canvas.classList.remove('hidden');
    requestAnimationFrame(drawTarget);
  } else {
    canvas.classList.add('hidden');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  if (step.id === 'end') {
    finishBtn.classList.remove('hidden');
  } else {
    finishBtn.classList.add('hidden');
  }
}

function advanceStep() {
  currentStep++;
  if (currentStep < steps.length) updateStepText();
}

function drawTarget() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!steps[currentStep]) return;

  const stepId = steps[currentStep].id;

  if (stepId === 'move-cursor') {
      // Draw a red-white target at the center
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radii = [75, 60, 45, 30, 15]; // radii for the rings
      const colors = ['#c81927', '#fff', '#c81927', '#fff', '#c81927']; // red, white, red
  
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

  if (stepId === 'click-target') {
    // Draw a red-white target at the center
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radii = [75, 60, 45, 30, 15]; // radii for the rings
      const colors = ['#2c8ad1', '#fff', '#2c8ad1', '#fff', '#2c8ad1']; // red, white, red
  
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

      const inTarget = Math.sqrt(
        (canvasX - target.x) ** 2 + (canvasY - target.y) ** 2
      ) < target.radius - 5;

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

      const inTarget = Math.sqrt(
        (canvasX - target.x) ** 2 + (canvasY - target.y) ** 2
      ) < target.radius - 5;

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
    ArrowRight: '{"category":"actions","method":"swipe","params":{"direction":"right"}}',
    ArrowLeft: '{"category":"actions","method":"swipe","params":{"direction":"left"}}'
  };
  if (test[event.key]) handleMessage(test[event.key]);
});

document.addEventListener("mousemove", (event) => {
  let x = event.offsetX || event.layerX;
  let y = event.offsetY || event.layerY;
  handleMessage(`{"category":"actions","method":"move","params":{"x":${x},"y":${y}}}`);
});

document.addEventListener("mousedown", (event) => {
  console.log("mousedown", event);
  let x = event.offsetX || event.layerX;
  let y = event.offsetY || event.layerY;
  handleMessage(`{"category":"actions","method":"click","params":{"x":${x},"y":${y}}}`);
});


window.addEventListener("DOMContentLoaded", () => {
  if (typeof applyTranslations === 'function') applyTranslations();
  canvas = document.getElementById("target-canvas");
  ctx = canvas.getContext("2d");
  finishBtn = document.getElementById('finish-btn');
  finishBtn.addEventListener('click', () => {
    if (window.opener && !window.opener.closed) {
      const parentBtn = window.opener.document.getElementById('onboarding-button');
      if (parentBtn) parentBtn.disabled = false;
    }
    window.close();
  });
  updateStepText();
});

window.addEventListener("message", (event) => {
  if (typeof event.data === "string") {
    handleMessage(event.data);
  }
});
