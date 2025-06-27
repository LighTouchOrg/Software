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
const target = { x: 300, y: 200, radius: 30 };

const frame = {
  width: 180,
  height: 100,
  x: 0,
  y: 0
};

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
    frame.x = (canvas.width - frame.width) / 2;
    frame.y = (canvas.height - frame.height) / 2;
    ctx.strokeStyle = '#c81927';
    ctx.lineWidth = 4;
    ctx.strokeRect(frame.x, frame.y, frame.width, frame.height);
  }

  if (stepId === 'click-target') {
    ctx.beginPath();
    ctx.arc(target.x, target.y, target.radius, 0, 2 * Math.PI);
    ctx.fillStyle = "#c81927";
    ctx.fill();
  }

  if (cursor.x !== undefined && cursor.y !== undefined) {
    ctx.beginPath();
    ctx.arc(cursor.x, cursor.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "#2a9d8f";
    ctx.fill();
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
      const canvasX = (x / 640) * canvas.width;
      const canvasY = (y / 480) * canvas.height;
      cursor.x = canvasX;
      cursor.y = canvasY;

      const inFrame =
        canvasX >= frame.x &&
        canvasX <= frame.x + frame.width &&
        canvasY >= frame.y &&
        canvasY <= frame.y + frame.height;

      requestAnimationFrame(drawTarget);

      if (inFrame) {
        advanceStep();
      }
      return;
    }

    // CLICK
    if (step.expected === "click" && parsed.method === "click") {
      const x = Number(parsed.params.x);
      const y = Number(parsed.params.y);
      const dx = x - target.x;
      const dy = y - target.y;
      if (Math.sqrt(dx * dx + dy * dy) < target.radius + 20) {
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
