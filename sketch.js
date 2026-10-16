// ============================================================
// WHAT THE FONT?!  Which font does your personality scream?
// ID2116 Computing for Design · Project 02
//
// States: "landing" → "quiz" → "loading" → "result"
// View   = p5 DOM elements (createDiv, createButton, createSlider)
// Model  = QUESTIONS + specs (quiz-data.js)
// AI     = The Foundry (foundry.js)
// ============================================================

let state = "landing";
let app;                  // the <main> element everything goes into
let userName = "";
let userAnswers = [];     // index of the option picked for each question
let current = 0;          // which question we're on
let specs = { ...DEFAULT_SPECS };
let quizSpecs = null;     // the specs the quiz produced (for "reset")
let foundry = null;       // The Foundry's reply

// ---------- p5 ----------
function setup() {
  const c = createCanvas(windowWidth, windowHeight);
  c.position(0, 0);
  c.style("position", "fixed");
  c.style("z-index", "-1");
  app = select("#app");
  showLanding();
}

// halftone paper background; dots pulse while The Foundry thinks
function draw() {
  background(244, 241, 234);
  noStroke();
  fill(0, 22);
  const gap = 14;
  for (let x = gap / 2; x < width; x += gap) {
    for (let y = gap / 2; y < height; y += gap) {
      let d = 1.6;
      if (state === "loading") {
        d = 1.6 + 2.2 * max(0, sin(frameCount * 0.08 - dist(x, y, width / 2, height / 2) * 0.02));
      }
      circle(x, y, d);
    }
  }
  if (state !== "loading") noLoop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  redraw();
}

function setState(s) {
  state = s;
  app.html("");
  if (s === "loading") loop(); else redraw();
  window.scrollTo(0, 0);
}

// ---------- helpers ----------
function el(tag, cls, html, parent) {
  const e = createElement(tag, html || "");
  if (cls) e.addClass(cls);
  e.parent(parent || app);
  return e;
}

// each letter in a different font, like a ransom note
const RANSOM = [
  { s: { classification: "sans",   weight: 1000, width: 140, slant: 0,   casual: 0, roundness: 0,   contrast: 0,   spacing: 0 }, bg: "ink" },
  { s: { classification: "script", weight: 700,  width: 100, slant: 0,   casual: 0, roundness: 0,   contrast: 0,   spacing: 0 }, bg: "paper" },
  { s: { classification: "serif",  weight: 900,  width: 100, slant: 0,   casual: 1, roundness: 100, contrast: 100, spacing: 0 }, bg: "red" },
  { s: { classification: "mono",   weight: 300,  width: 100, slant: -15, casual: 1, roundness: 0,   contrast: 0,   spacing: 0 }, bg: "dots" },
  { s: { classification: "slab",   weight: 900,  width: 100, slant: 0,   casual: 0, roundness: 0,   contrast: 0,   spacing: 0 }, bg: "paper" },
  { s: { classification: "serif",  weight: 200,  width: 100, slant: 0,   casual: 0, roundness: 0,   contrast: 100, spacing: 0 }, bg: "ink" },
  { s: { classification: "sans",   weight: 300,  width: 60,  slant: -15, casual: 0, roundness: 0,   contrast: 0,   spacing: 0 }, bg: "red" },
];

function ransom(text, parent) {
  const wrap = el("div", "ransom", "", parent);
  let i = 0;
  for (const ch of text) {
    if (ch === " ") { el("span", "gap", "", wrap); continue; }
    const r = RANSOM[i % RANSOM.length];
    const t = el("span", "tile " + r.bg, ch, wrap);
    applyFont(t, r.s);
    t.style("transform", `rotate(${[-5, 3, -2, 4, -3, 2, -4][i % 7]}deg)`);
    i++;
  }
  return wrap;
}

// =========================================================
// 1. LANDING
// =========================================================
function showLanding() {
  setState("landing");
  const page = el("section", "landing");
  ransom("WHAT THE", page);
  ransom("FONT?!", page);
  el("p", "tagline", 'which font does your personality <span class="scream">scream?</span>', page);
  el("p", "intro", "8 questions. No font words. An AI type designer turns you into a custom typeface.", page);

  const row = el("div", "start-row", "", page);
  const nameInput = createInput(userName);
  nameInput.attribute("placeholder", "your name");
  nameInput.attribute("maxlength", "20");
  nameInput.addClass("name-input");
  nameInput.parent(row);

  const go = createButton("Start →");
  go.addClass("btn red");
  go.parent(row);
  go.mousePressed(() => {
    userName = nameInput.value().trim();
    userAnswers = [];
    current = 0;
    specs = { ...DEFAULT_SPECS };
    showQuestion();
  });

  // API key box (stored in this browser only, never in the code)
  const keyBox = el("details", "keybox", "", page);
  el("summary", "", getKey() ? "API key saved ✓" : "Add OpenAI API key (optional, works offline without it)", keyBox);
  const keyRow = el("div", "key-row", "", keyBox);
  const keyInput = createInput("", "password");
  keyInput.attribute("placeholder", "sk-...");
  keyInput.parent(keyRow);
  const save = createButton("Save");
  save.addClass("btn small");
  save.parent(keyRow);
  save.mousePressed(() => { saveKey(keyInput.value()); showLanding(); });
  const clear = createButton("Clear");
  clear.addClass("btn small light");
  clear.parent(keyRow);
  clear.mousePressed(() => { clearKey(); showLanding(); });
  el("p", "fine", "Your key stays in this browser's storage. It is never sent anywhere except OpenAI.", keyBox);
}

// =========================================================
// 2. QUIZ (one question at a time)
// =========================================================
function showQuestion() {
  setState("quiz");
  const item = QUESTIONS[current];
  const page = el("section", "quiz");

  // ghost letter: morphs as your answers come in
  const ghost = el("div", "ghost", "Aa", page);
  applyFont(ghost, specs);

  const top = el("div", "quiz-top", "", page);
  el("span", "progress-label", `Q${current + 1} / ${QUESTIONS.length}`, top);
  const bar = el("div", "bar", "", top);
  const fill = el("div", "bar-fill", "", bar);
  fill.style("width", `${(current / QUESTIONS.length) * 100}%`);

  el("h2", "question", item.q, page);
  const opts = el("div", "options", "", page);

  item.options.forEach((opt, i) => {
    const b = createButton(opt.label);
    b.addClass("option");
    if (userAnswers[current] === i) b.addClass("picked");
    b.parent(opts);
    // preview: hovering an option morphs the ghost letter
    b.mouseOver(() => applyFont(ghost, { ...specs, [item.param]: opt.value }));
    b.mouseOut(() => applyFont(ghost, specs));
    b.mousePressed(() => pickAnswer(i));
  });

  if (current > 0) {
    const back = createButton("← back");
    back.addClass("btn small light back");
    back.parent(page);
    back.mousePressed(() => { current--; showQuestion(); });
  }
}

function pickAnswer(i) {
  userAnswers[current] = i;
  specs = specsFromAnswers();
  current++;
  if (current < QUESTIONS.length) showQuestion();
  else showLoading();
}

// THE KEY STEP: each answer sets one font parameter
function specsFromAnswers() {
  const s = { ...DEFAULT_SPECS };
  QUESTIONS.forEach((item, i) => {
    if (userAnswers[i] !== undefined) s[item.param] = item.options[userAnswers[i]].value;
  });
  return s;
}

// =========================================================
// 3. LOADING
// =========================================================
async function showLoading() {
  setState("loading");
  const page = el("section", "loading");
  el("div", "loading-word", userName || "Aa", page);
  el("p", "loading-text", "The Foundry is designing you...", page);

  quizSpecs = { ...specs };
  const wait = new Promise((r) => setTimeout(r, 2200)); // a little drama
  const [result] = await Promise.all([askFoundry(userAnswers, specs), wait]);
  foundry = result;
  showResult();
}

// =========================================================
// 4. RESULT + SLIDERS
// =========================================================
let fontEls = [];       // every element drawn in the user's font
let saysEl, chipsEl;
let sliderRows = {};
let familyBtns = {};

function showResult() {
  setState("result");
  fontEls = [];
  const page = el("section", "result");

  // --- the scream ---
  const hero = el("div", "hero", "", page);
  el("div", "you-are", "YOU ARE", hero);
  const nameEl = el("h1", "font-name", foundry.fontName, hero);
  fontEls.push(nameEl);

  const grid = el("div", "result-grid", "", page);

  // --- left: specimen ---
  const spec = el("div", "specimen card", "", grid);
  el("div", "label", "SPECIMEN", spec);
  const big = el("div", "spec-name", userName || "Hello, you", spec);
  const abc = el("div", "spec-abc", "Aa Bb Cc Dd Ee Ff Gg Hh 0123 ?!&", spec);
  const pangram = el("div", "spec-pangram", "Sphinx of black quartz, judge my vow.", spec);
  fontEls.push(big, abc, pangram);

  chipsEl = el("div", "chips", "", spec);
  const info = [
    ["Character", foundry.character],
    ["Best used for", foundry.bestUsedFor],
    ["Never use for", foundry.neverUseFor],
    ["Pairs well with", foundry.pairsWellWith],
  ];
  info.forEach(([k, v]) => {
    const row = el("div", "info-row", "", spec);
    el("span", "info-k", k, row);
    el("span", "info-v", v, row);
  });
  saysEl = el("div", "says", `“${foundry.fontSays}”`, spec);
  if (foundry.source === "offline") el("p", "fine", foundry.note, spec);

  // --- right: tweak panel ---
  const panel = el("div", "panel card", "", grid);
  el("div", "label", "TWEAK YOUR FONT", panel);

  const famRow = el("div", "families", "", panel);
  familyBtns = {};
  Object.keys(FAMILIES).forEach((key) => {
    const b = createButton(key);
    b.addClass("fam");
    b.parent(famRow);
    b.mousePressed(() => {
      specs.classification = key;
      react("classification", 1);
      updateResult();
    });
    familyBtns[key] = b;
  });

  sliderRows = {};
  SLIDERS.forEach((cfg) => {
    const row = el("div", "slider-row", "", panel);
    const head = el("div", "slider-head", "", row);
    el("span", "slider-label", cfg.label, head);
    const val = el("span", "slider-val", "", head);
    const s = createSlider(cfg.min, cfg.max, specs[cfg.param], cfg.step);
    s.parent(row);
    const note = el("div", "slider-note", cfg.trait, row);
    let prev = specs[cfg.param];
    s.input(() => {
      const v = Number(s.value());
      react(cfg.param, v - prev);
      prev = v;
      specs[cfg.param] = v;
      updateResult();
    });
    sliderRows[cfg.param] = { row, s, val, note, cfg };
  });

  el("p", "legend", "● real font axis &nbsp; ◐ simulated &nbsp; ○ not on this typeface", panel);

  const actions = el("div", "actions", "", panel);
  const reset = createButton("Reset to my answers");
  reset.addClass("btn small light");
  reset.parent(actions);
  reset.mousePressed(() => { specs = { ...quizSpecs }; showResult(); });

  const copy = createButton("Copy my font CSS");
  copy.addClass("btn small");
  copy.parent(actions);
  copy.mousePressed(() => {
    navigator.clipboard?.writeText(fontCSS(specs));
    copy.html("Copied ✓");
  });

  const again = createButton("Retake quiz");
  again.addClass("btn small red");
  again.parent(actions);
  again.mousePressed(showLanding);

  updateResult();
}

// redraw every font element + slider labels from the current specs
function updateResult() {
  fontEls.forEach((e) => applyFont(e, specs));

  Object.entries(familyBtns).forEach(([k, b]) => {
    if (k === specs.classification) b.addClass("on"); else b.removeClass("on");
  });

  Object.values(sliderRows).forEach(({ row, s, val, cfg }) => {
    const support = axisSupport(specs.classification, cfg.param);
    const mark = { real: "●", simulated: "◐", none: "○" }[support];
    val.html(`${mark} ${formatVal(cfg.param, specs[cfg.param])}`);
    if (support === "none") {
      s.attribute("disabled", "");
      row.addClass("off");
    } else {
      s.removeAttribute("disabled");
      row.removeClass("off");
    }
  });

  chipsEl.html("");
  [
    FAMILIES[specs.classification].name,
    `weight ${Math.round(specs.weight)}`,
    `width ${Math.round(specs.width)}`,
    `slant ${specs.slant}`,
    `spacing ${specs.spacing.toFixed(2)}`,
  ].forEach((t) => el("span", "chip", t, chipsEl));
}

function formatVal(param, v) {
  if (param === "casual") return v.toFixed(2);
  if (param === "spacing") return v.toFixed(3) + "em";
  return Math.round(v * 10) / 10;
}

// the font talks back when you change it
function react(param, delta) {
  if (delta === 0) return;
  const line = REACTIONS[param][delta > 0 ? "up" : "down"];
  saysEl.html(`“${line}”`);
  saysEl.removeClass("pop");
  void saysEl.elt.offsetWidth; // restart the animation
  saysEl.addClass("pop");
}
