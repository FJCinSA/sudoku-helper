// ── state.js ──────────────────────────────────────────────────
// Single source of truth. All modules read and write through this object.
// Loaded first — no dependencies.

'use strict';

const State = {
  imageBase64:    null,
  imageMime:      'image/jpeg',
  moveHistory:    [],
  moveCount:      0,
  selectedRating: 0
};

// ── Shared DOM refs ────────────────────────────────────────────
const DOM = {
  fileInput:   document.getElementById('fileInput'),
  dropZone:    document.getElementById('dropZone'),
  previewWrap: document.getElementById('previewWrap'),
  previewImg:  document.getElementById('previewImg'),
  analyseBtn:  document.getElementById('analyseBtn'),
  starEls:     document.querySelectorAll('.star'),
  loadingStep: document.getElementById('loadingStep')
};

// ── Section visibility ─────────────────────────────────────────
const SECTIONS = ['analyseSection','loadingSection','resultSection','errorSection'];

function showSection(id) {
  SECTIONS.forEach(s => document.getElementById(s).classList.toggle('hidden', s !== id));
}

function showError(message) {
  document.getElementById('errorMsg').textContent = message;
  showSection('errorSection');
}
