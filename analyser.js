// ── analyser.js ───────────────────────────────────────────────
// Handles all Claude API calls and the three help modes:
// 1. Next move   2. Walk through   3. Solve completely
// Depends on: state.js, ui.js

'use strict';

// ── System prompts ─────────────────────────────────────────────
const SYSTEM_PROMPT_MOVE = `You are a Sudoku expert and patient teacher. When given a Sudoku puzzle image:
1. Read the grid carefully — identify all given digits and empty cells.
2. Find the BEST next move using logical techniques (not guessing).
3. Return your answer in this EXACT JSON format:
{
  "answer_plain": "Place [digit] in Row X, Column Y",
  "why": "One or two sentences explaining WHY this cell must be that digit.",
  "technique_name": "Name of the technique (e.g. Naked Single, Hidden Single, Naked Pair)",
  "technique_explanation": "Two to three sentences explaining this technique in plain language."
}
If you cannot read the grid clearly, return: {"error": "Brief explanation of the problem"}
Return ONLY the JSON object. No preamble, no markdown fences.`;

const SYSTEM_PROMPT_WALK = `You are a Sudoku expert. Analyse the puzzle image and return ALL remaining moves needed to complete it, in logical order.
Return this EXACT JSON format:
{
  "moves": [
    { "answer_plain": "Place [digit] in Row X, Column Y", "technique_name": "Technique name" },
    ...
  ]
}
If you cannot read the grid, return: {"error": "Brief explanation"}
Return ONLY the JSON object. No preamble, no markdown fences.`;

const SYSTEM_PROMPT_SOLVE = `You are a Sudoku expert. Analyse the puzzle image and return the complete solved 9x9 grid.
Return this EXACT JSON format:
{
  "grid": [[r1c1,r1c2,...,r1c9],[r2c1,...],... 9 rows total],
  "given": [[true/false for each cell — true if it was a given digit, false if it was empty]]
}
If you cannot read the grid, return: {"error": "Brief explanation"}
Return ONLY the JSON object. No preamble, no markdown fences.`;

// ── Core API call ──────────────────────────────────────────────
async function callClaude(prompt, includeImage, systemPrompt) {
  const messages = [];

  // Include conversation history for sequential next-move mode only
  if (State.moveHistory.length > 0 && systemPrompt === SYSTEM_PROMPT_MOVE) {
    messages.push({ role:'user',      content:'I have a Sudoku puzzle I need help with.' });
    messages.push({ role:'assistant', content:"Please share the puzzle image and I'll analyse it." });
    State.moveHistory.forEach(m => {
      messages.push({ role:'user',      content: m.user });
      messages.push({ role:'assistant', content: m.assistant });
    });
  }

  const content = [];
  if (includeImage) {
    content.push({ type:'image', source:{ type:'base64', media_type:State.imageMime, data:State.imageBase64 } });
  }
  content.push({ type:'text', text:prompt });
  messages.push({ role:'user', content });

  const response = await fetch('https://sudoku-proxy.fjcspeel.workers.dev', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system:     systemPrompt || SYSTEM_PROMPT_MOVE,
      messages
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${response.status}`);
  }

  const data  = await response.json();
  const raw   = data.content.map(c => c.text || '').join('').trim();
  const clean = raw.replace(/^```json\s*/,'').replace(/```\s*$/,'').trim();
  return JSON.parse(clean);
}

// ── Mode 1: Analyse first move ─────────────────────────────────
async function analysePuzzle() {
  if (!State.imageBase64) return;
  showSection('loadingSection');
  const timer = startLoadingAnimation();
  try {
    const prompt = 'Please analyse this Sudoku puzzle and tell me the best next move.';
    const result = await callClaude(prompt, true, SYSTEM_PROMPT_MOVE);
    clearInterval(timer);
    if (result.error) { showError(result.error); return; }
    recordAndRender(result, prompt);
  } catch(e) {
    clearInterval(timer);
    showError('Something went wrong: ' + e.message + '. Please check your connection and try again.');
  }
}

// ── Mode 1: Find next move ─────────────────────────────────────
async function findNextMove() {
  showSection('loadingSection');
  const timer = startLoadingAnimation(['Finding the next move…','Applying solving logic…','Checking constraints…','Almost there…']);
  const prompt = `Find the next logical move after the ${State.moveCount} move${State.moveCount !== 1 ? 's' : ''} already identified.`;
  try {
    const result = await callClaude(prompt, false, SYSTEM_PROMPT_MOVE);
    clearInterval(timer);
    if (result.error) { showError(result.error); return; }
    recordAndRender(result, prompt);
  } catch(e) {
    clearInterval(timer);
    showError('Something went wrong: ' + e.message);
  }
}

// ── Mode 2: Walk through all moves ────────────────────────────
async function walkThrough() {
  showSection('loadingSection');
  const timer = startLoadingAnimation(['Reading the full puzzle…','Planning every move…','Ordering by logic…','Almost done…']);
  try {
    const result = await callClaude('Give me all remaining moves to complete this puzzle.', true, SYSTEM_PROMPT_WALK);
    clearInterval(timer);
    if (result.error) { showError(result.error); return; }
    renderWalkthrough(result.moves || []);
  } catch(e) {
    clearInterval(timer);
    showError('Something went wrong: ' + e.message);
  }
}

// ── Mode 3: Solve completely ───────────────────────────────────
async function solvePuzzle() {
  showSection('loadingSection');
  const timer = startLoadingAnimation(['Reading every cell…','Solving logically…','Verifying solution…','Rendering grid…']);
  try {
    const result = await callClaude('Solve this Sudoku puzzle completely and return the full grid.', true, SYSTEM_PROMPT_SOLVE);
    clearInterval(timer);
    if (result.error) { showError(result.error); return; }
    renderSolutionGrid(result.grid, result.given);
  } catch(e) {
    clearInterval(timer);
    showError('Something went wrong: ' + e.message);
  }
}
