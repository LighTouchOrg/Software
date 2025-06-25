const steps = [
  { id: "swipe-right", expected: { category: "actions", method: "swipe", params: { direction: "right" } } },
  { id: "swipe-left", expected: { category: "actions", method: "swipe", params: { direction: "left" } } },
  { id: "move-cursor", expected: "move" },
  { id: "click-target", expected: "click" },
  { id: "end", expected: null }
];

let currentStep = 0;
let cursor = { x: 0, y: 0 };
let canvas = null;
let ctx = null;
let target = { x: 300, y: 200, radius: 30 };
let finishBtn = null;

const stepText = document.getElementById('step-text');

function t(key) {
  const lang = localStorage.getItem('preferredLang') || 'fr';
  return window.translations?.[lang]?.[key] || key;
}

function updateStepText() {
  const step = steps[currentStep];
  const sanitizedId = step.id.replace(/-/g, '_');
  const key = `onboarding_step_${sanitizedId}`;
  stepText.textContent = t(key);
  if (step.id === 'click-target') {
    canvas.classList.remove('hidden');
    drawTarget();
  } else {
    canvas?.classList.add('hidden');
  }
  if (step.id === 'end') {
    finishBtn.classList.remove('hidden');
  }
}

function advanceStep() {
  currentStep++;
  if (currentStep >= steps.length) return;
  updateStepText();
}

function drawTarget() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.arc(target.x, target.y, target.radius, 0, 2 * Math.PI);
  ctx.fillStyle = "#c81927";
  ctx.fill();
}

import Actions from './Actions.js';
const actions = new Actions();
actions.isOnboarding = true;

function handleMessage(msg) {
  try {
    const parsed = JSON.parse(msg);
    const step = steps[currentStep];
    if (!step || step.expected === null) return;
    if (parsed.category === 'actions' && parsed.method === step.expected.method
        && JSON.stringify(parsed.params) === JSON.stringify(step.expected.params)) {
      const result = actions[parsed.method](parsed.params);
      if (result === 0) advanceStep();
    }
  } catch {}
}

document.addEventListener("keydown", (event) => {
  const testMessages = {
    ArrowRight: '{"category":"actions","method":"swipe","params":{"direction":"right"}}',
    ArrowLeft: '{"category":"actions","method":"swipe","params":{"direction":"left"}}',
    m: '{"category":"actions","method":"move","params":{"x":300,"y":200}}',
    c: '{"category":"actions","method":"click","params":{"x":300,"y":200}}'
  };
  if (testMessages[event.key]) {
    handleMessage(testMessages[event.key]);
  }
});

window.addEventListener("DOMContentLoaded", () => {
  if (typeof applyTranslations === 'function') applyTranslations();
  canvas = document.getElementById("target-canvas");
  ctx = canvas.getContext("2d");
  finishBtn = document.getElementById('finish-btn');
  updateStepText();
  finishBtn.addEventListener('click', () => {
    if (window.opener && !window.opener.closed) {
      const parentBtn = window.opener.document.getElementById('onboarding-button');
      if (parentBtn) parentBtn.disabled = false;
    }
    window.close();
  });
});

window.electronAPI?.onPythonData((event, data) => {
  if (data.startsWith("BT:")) {
    const raw = data.slice(3).trim();
    handleMessage(raw);
  }
});