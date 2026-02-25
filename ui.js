// ── ui.js ─────────────────────────────────────────────────────
// Handles all DOM rendering: results, walkthrough, solution grid,
// star rating, feedback, and full reset.
// Depends on: state.js, upload.js

'use strict';

// ── Loading animation ──────────────────────────────────────────
const LOADING_STEPS = [
  'Reading the grid…',
  'Identifying empty cells…',
  'Applying solving logic…',
  'Finding the best move…'
];

function startLoadingAnimation(steps) {
  const all = steps || LOADING_STEPS;
  let i = 0;
  DOM.loadingStep.textContent = all[0];
  return setInterval(() => { DOM.loadingStep.textContent = all[++i % all.length]; }, 900);
}

// ── Record move + render next-move result ──────────────────────
function recordAndRender(result, prompt) {
  State.moveCount++;
  State.moveHistory.push({ user:prompt, assistant:JSON.stringify(result) });

  document.getElementById('resultAnswer').textContent         = result.answer_plain || '';
  document.getElementById('resultWhy').textContent            = result.why || '';
  document.getElementById('techniqueName').textContent        = result.technique_name || '';
  document.getElementById('techniqueExplanation').textContent = result.technique_explanation || '';

  // Show move panels, hide extended outputs
  document.getElementById('resultMove').classList.remove('hidden');
  document.getElementById('resultTechnique').classList.remove('hidden');
  document.getElementById('walkthroughWrap').classList.add('hidden');
  document.getElementById('solutionWrap').classList.add('hidden');

  // Update section label and next-move button title
  document.querySelector('#resultSection .section-label').firstChild.textContent = 'Your next move';
  const titleSpan = document.querySelector('#nextBtn .help-btn-title');
  if (titleSpan) titleSpan.textContent = `Find move ${State.moveCount + 1}`;

  showSection('resultSection');
  document.getElementById('resultSection').scrollIntoView({ behavior:'smooth', block:'nearest' });
}

// ── Render walkthrough list ────────────────────────────────────
function renderWalkthrough(moves) {
  const list = document.getElementById('walkList');
  list.innerHTML = moves.map((m, idx) => `
    <li class="walk-item">
      <span class="walk-num">${idx + 1}.</span>
      <div>
        <div class="walk-move">${m.answer_plain}</div>
        <div class="walk-technique">${m.technique_name}</div>
      </div>
    </li>`).join('');

  document.getElementById('resultMove').classList.add('hidden');
  document.getElementById('resultTechnique').classList.add('hidden');
  document.getElementById('solutionWrap').classList.add('hidden');
  document.getElementById('walkthroughWrap').classList.remove('hidden');
  document.querySelector('#resultSection .section-label').firstChild.textContent = 'All remaining moves';

  showSection('resultSection');
  document.getElementById('walkthroughWrap').scrollIntoView({ behavior:'smooth', block:'nearest' });
}

// ── Render solution grid ───────────────────────────────────────
function renderSolutionGrid(grid, given) {
  const container = document.getElementById('solutionGrid');
  container.innerHTML = '';
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell ' + (given?.[r]?.[c] ? 'given' : 'solved');
      cell.textContent = grid[r][c];
      container.appendChild(cell);
    }
  }

  document.getElementById('resultMove').classList.add('hidden');
  document.getElementById('resultTechnique').classList.add('hidden');
  document.getElementById('walkthroughWrap').classList.add('hidden');
  document.getElementById('solutionWrap').classList.remove('hidden');
  document.querySelector('#resultSection .section-label').firstChild.textContent = 'Complete solution';

  showSection('resultSection');
  document.getElementById('solutionWrap').scrollIntoView({ behavior:'smooth', block:'nearest' });
}

// ── Star rating ────────────────────────────────────────────────
function updateStars(value, permanent) {
  DOM.starEls.forEach(s => s.classList.toggle('lit', parseInt(s.dataset.v) <= value));
  if (permanent) State.selectedRating = value;
}

DOM.starEls.forEach(star => {
  star.addEventListener('mouseover', () => updateStars(parseInt(star.dataset.v), false));
  star.addEventListener('mouseout',  () => updateStars(State.selectedRating, false));
  star.addEventListener('click',     () => updateStars(parseInt(star.dataset.v), true));
  star.addEventListener('touchend',  e  => { e.preventDefault(); updateStars(parseInt(star.dataset.v), true); });
});

// ── Feedback submission ────────────────────────────────────────
function submitFeedback() {
  const suggestion = document.getElementById('suggestionBox').value.trim();
  const thanks     = document.getElementById('feedbackThanks');
  if (!State.selectedRating && !suggestion) {
    thanks.textContent   = 'Please select a star rating first.';
    thanks.style.color   = 'var(--amber)';
    thanks.style.display = 'block';
    return;
  }
  document.getElementById('feedbackBtn').style.display = 'none';
  thanks.textContent   = '✓ Thanks — your feedback helps improve the tool';
  thanks.style.color   = 'var(--ok)';
  thanks.style.display = 'block';

  const starsStr = '★'.repeat(State.selectedRating) + '☆'.repeat(5 - State.selectedRating);
  const body     = `Rating: ${starsStr} (${State.selectedRating}/5)\n\nSuggestion: ${suggestion || 'None'}\n\nMoves found: ${State.moveCount}`;
  window.location.href = `mailto:sudokumasterycourse@gmail.com?subject=Sudoku Helper Feedback&body=${encodeURIComponent(body)}`;
}

// ── Full reset ─────────────────────────────────────────────────
function resetAll() {
  resetUpload();   // from upload.js
  State.moveHistory    = [];
  State.moveCount      = 0;
  State.selectedRating = 0;
  updateStars(0, false);
  document.getElementById('suggestionBox').value          = '';
  document.getElementById('feedbackBtn').style.display    = 'inline-block';
  document.getElementById('feedbackThanks').style.display = 'none';
  document.getElementById('resultMove').classList.add('hidden');
  document.getElementById('resultTechnique').classList.add('hidden');
  document.getElementById('walkthroughWrap').classList.add('hidden');
  document.getElementById('solutionWrap').classList.add('hidden');
  document.getElementById('walkList').innerHTML     = '';
  document.getElementById('solutionGrid').innerHTML = '';
  const titleSpan = document.querySelector('#nextBtn .help-btn-title');
  if (titleSpan) titleSpan.textContent = 'Next move';
  showSection('analyseSection');
  document.getElementById('uploadSection').scrollIntoView({ behavior:'smooth' });
}
