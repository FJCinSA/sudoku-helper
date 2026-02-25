// ── upload.js ─────────────────────────────────────────────────
// Handles file selection, drag-and-drop, preview, and upload reset.
// Depends on: state.js

'use strict';

// ── File input & drag-and-drop ─────────────────────────────────
DOM.fileInput.addEventListener('change', e => {
  if (e.target.files[0]) handleFile(e.target.files[0]);
});

DOM.dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  DOM.dropZone.classList.add('drag-over');
});
DOM.dropZone.addEventListener('dragleave', () => {
  DOM.dropZone.classList.remove('drag-over');
});
DOM.dropZone.addEventListener('drop', e => {
  e.preventDefault();
  DOM.dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file?.type.startsWith('image/')) handleFile(file);
});

// ── Handle selected file ───────────────────────────────────────
function handleFile(file) {
  State.imageMime = file.type || 'image/jpeg';
  const reader = new FileReader();
  reader.onload = ev => {
    State.imageBase64          = ev.target.result.split(',')[1];
    DOM.previewImg.src         = ev.target.result;
    DOM.dropZone.style.display    = 'none';
    DOM.previewWrap.style.display = 'block';
    DOM.analyseBtn.disabled       = false;
  };
  reader.readAsDataURL(file);
}

// ── Reset upload only (image + preview) ───────────────────────
function resetUpload() {
  State.imageBase64             = null;
  DOM.fileInput.value           = '';
  DOM.previewImg.src            = '';
  DOM.dropZone.style.display    = 'block';
  DOM.previewWrap.style.display = 'none';
  DOM.analyseBtn.disabled       = true;
}
