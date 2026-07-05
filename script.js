/* ================================================================
   ELIAS VANCE — DIGITAL EXHIBITION
   ----------------------------------------------------------------
   TABLE OF CONTENTS
   01. CONFIG
   02. DATA / STATE
   03. UTILITIES
   04. SCROLL ENGINE   (hero dissolve + pseudo-3D tunnel, desktop)
   05. DECODE ENGINE   (scramble → typewriter lock-in)
   06. PARTICLES       (ambient field: dust + code fragments)
   07. MOBILE          (layered fade & float + lightweight decode)
   08. OUTRO           (code fragments converge into the email)
   09. EVENTS
   10. ANIMATION LOOP
   ================================================================ */
"use strict";

/* ================================================================
   01. CONFIG — tune the whole experience from here
   ================================================================ */
const CONFIG = {
  desktopQuery:      "(min-width: 768px)",

  /* tunnel geometry */
  screensPerProject: 1.6,     // scroll distance (in viewports) per chapter
  tunnelDepth:       2600,    // px of Z travel per chapter
  exitDepth:         700,     // px toward the camera before a chapter fades out
  fadeInDepth:       2200,    // chapter becomes visible within this depth
  lockThreshold:     240,     // |z| below which a chapter is "locked in"
  glitchRange:       1400,    // |z| over which glitch eases from 1 → 0

  /* mouse parallax */
  parallaxRotate:    3.2,     // max degrees of rotateX / rotateY
  magnetStrength:    10,      // px of cursor-magnet pull on the figure

  /* ambient particles */
  particleCount:     70,
  fragmentCount:     14,      // floating code fragments
  fragmentChars:     "01<>/{}[]#*+=~;:._",

  /* decode effect */
  decodeChars:       "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_#/*",
  decodeSpeed:       2,       // resolved characters per frame

  /* outro convergence */
  outroParticles:    1400,
  outroFont:         '900 %spx "Arial Black", Arial, sans-serif',

  /* i18n */
  defaultLang:       "en",
  storageKey:        "ev26.lang",
};

/* ================================================================
   01b. TRANSLATIONS  (i18n dictionary)
   ===== CHANGE / ADD YOUR TRANSLATIONS HERE =====
   Every element in index.html carrying data-i18n="key" is swapped
   from this table. The name "ELIAS VANCE" is a proper noun and is
   intentionally NOT translated. The email address is also left as-is
   so the outro convergence keeps spelling the same characters.
   ================================================================ */
const TRANSLATIONS = {
  en: {
    role:        "styling & visual studio",
    bio:         "A styling and visual studio moving between parties, artists and brands. We believe the best looks feel grown rather than made — pairing design thinking with engineering to shape looks, performances and the systems that run them.",
    hint:        "scroll_to_enter",

    k_theme:     "[THEME]",
    k_material:  "[MATERIAL]",
    k_workflow:  "[WORKFLOW]",

    p1_index:    "CH.01 // MIDSUMMER",
    p1_theme:    "Immersive_Night_Party_·_Sci-Fi",
    p1_workflow: "Costume_Design_·_Making_·_Performance",
    p1_decoded:  "signal_locked · press_feature",

    p2_index:    "CH.02 // DAYDREAM",
    p2_theme:    "Christmas_Daydream",
    p2_workflow: "Costume_Design_·_Making_·_Performance",
    p2_decoded:  "signal_locked · daydream_in_motion → live",

    p3_index:    "CH.03 // ARTIST",
    p3_theme:    "Commercial_Styling_·_Artist",
    p3_workflow: "Styling_Design_·_Consulting",
    p3_decoded:  "signal_locked · artist_jane_liu",

    p4_index:    "CH.04 // PARASOL",
    p4_theme:    "Commercial_Styling_·_Total_Look",
    p4_workflow: "Styling_Design_·_Consulting",
    p4_decoded:  "signal_locked · yoreh_in_market",

    outro_label: "transmission_end // reach_me",
    signature:   "Sara · Visual Director",

    status: {
      ready:  "[SYSTEM READY]",
      decode: "[DECODING SIGNAL…]",
      locked: "[SIGNAL LOCKED]",
      end:    "[TRANSMISSION END]",
    },
  },

  zh: {
    role:        "造型視覺設計工作室",
    bio:         "一間造型與視覺設計工作室,遊走於派對、藝術家與品牌之間。我們相信最好的造型如生長而成,而非被製造 —— 以設計思維結合工程能力,打造造型、表演與其運作的系統。",
    hint:        "捲動_進入",

    k_theme:     "[主題]",
    k_material:  "[材質]",
    k_workflow:  "[流程]",

    p1_index:    "第01章 // 仲夏夜",
    p1_theme:    "沉浸式夜間派對_·_科幻",
    p1_workflow: "造型設計_·_製作_·_表演",
    p1_decoded:  "訊號鎖定 · 媒體報導_Shopping Design",

    p2_index:    "第02章 // 白日夢",
    p2_theme:    "聖誕白日夢",
    p2_workflow: "造型設計_·_製作_·_表演",
    p2_decoded:  "訊號鎖定 · 白日夢_已登場 → 現場",

    p3_index:    "第03章 // 藝術家",
    p3_theme:    "商業造型_·_藝術家形象",
    p3_workflow: "造型設計_·_顧問諮詢",
    p3_decoded:  "訊號鎖定 · 藝術家_Jane_Liu",

    p4_index:    "第04章 // 傘",
    p4_theme:    "商業造型_·_整體造型",
    p4_workflow: "造型設計_·_顧問諮詢",
    p4_decoded:  "訊號鎖定 · Yoreh雨傘_實際販售中",

    outro_label: "傳輸結束 // 聯繫我",
    signature:   "Sara · 視覺總監",

    status: {
      ready:  "[系統就緒]",
      decode: "[解碼訊號中…]",
      locked: "[訊號已鎖定]",
      end:    "[傳輸結束]",
    },
  },
};

/* ================================================================
   02. DATA / STATE
   ================================================================ */
const mqDesktop      = window.matchMedia(CONFIG.desktopQuery);
const mqReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/** Decide the initial language: saved choice → browser hint → default. */
function detectInitialLang() {
  try {
    const saved = localStorage.getItem(CONFIG.storageKey);
    if (saved && TRANSLATIONS[saved]) return saved;
  } catch (_) { /* storage may be blocked; fall through */ }
  const nav = (navigator.language || "").toLowerCase();
  if (nav.startsWith("zh")) return "zh";
  return CONFIG.defaultLang;
}

const state = {
  lang:       detectInitialLang(),
  isDesktop:  mqDesktop.matches,
  reduced:    mqReduceMotion.matches,
  scrollY:    window.scrollY,
  viewportW:  window.innerWidth,
  viewportH:  window.innerHeight,
  pointerX:   0.5,             // normalised 0..1
  pointerY:   0.5,
  tunnelTop:  0,               // measured on resize
  tunnelLen:  1,               // scrollable length of the tunnel
  activeIdx:  -1,              // currently locked chapter (-1 = none)
  outroDone:  false,
  rafId:      null,
};

/* -- element handles --------------------------------------------- */
const els = {
  body:       document.body,
  status:     document.getElementById("system-status"),
  langToggle: document.getElementById("lang-toggle"),
  langOpts:   Array.from(document.querySelectorAll("[data-lang-opt]")),
  i18nNodes:  Array.from(document.querySelectorAll("[data-i18n]")),
  hero:       document.querySelector(".hero__inner"),
  tunnel:     document.getElementById("tunnel"),
  stage:      document.getElementById("tunnel-stage"),
  chapters:   Array.from(document.querySelectorAll(".chapter")),
  cards:      Array.from(document.querySelectorAll(".card")),
  figures:    Array.from(document.querySelectorAll(".card__figure")),
  field:      document.getElementById("particle-field"),
  outro:      document.getElementById("outro"),
  outroWrap:  document.querySelector(".outro__content"),
  converge:   document.getElementById("convergence"),
};

/* ================================================================
   03. UTILITIES
   ================================================================ */
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp  = (a, b, t) => a + (b - a) * t;

/** Ease-out cubic — used for convergence motion. */
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/** One-time measurement of layout-dependent values (avoids layout
    thrashing inside the animation loop). */
function measure() {
  state.viewportW = window.innerWidth;
  state.viewportH = window.innerHeight;

  if (state.isDesktop && !state.reduced) {
    // total tunnel scroll distance = one viewport per "screensPerProject"
    const screens = els.chapters.length * CONFIG.screensPerProject + 1;
    els.tunnel.style.height = `${screens * 100}vh`;
  } else {
    els.tunnel.style.height = ""; // let mobile CSS take over
  }

  const rect = els.tunnel.getBoundingClientRect();
  state.tunnelTop = rect.top + window.scrollY;
  state.tunnelLen = Math.max(1, els.tunnel.offsetHeight - state.viewportH);
}

/** Resolve a status key to text in the active language. */
function statusText(key) {
  return TRANSLATIONS[state.lang].status[key];
}

/** Update the [SYSTEM …] badge without touching layout.
    Accepts a status KEY (e.g. "ready") so it stays language-correct. */
function setStatus(key) {
  const text = statusText(key);
  if (els.status.textContent !== text) els.status.textContent = text;
}

/* ================================================================
   03b. I18N — apply a language across the whole document
   ================================================================ */
/**
 * Swap every data-i18n node to the chosen language.
 * For telemetry values (data-decode) we also refresh the cached
 * "original" string and replay the decode animation on any card
 * that is currently locked, so the switch feels intentional.
 */
function applyLang(lang, { animate = false } = {}) {
  if (!TRANSLATIONS[lang]) lang = CONFIG.defaultLang;
  state.lang = lang;
  const dict = TRANSLATIONS[lang];

  // <html lang> + persistence
  document.documentElement.lang = (lang === "zh") ? "zh-Hant" : "en";
  try { localStorage.setItem(CONFIG.storageKey, lang); } catch (_) {}

  // swap text content
  els.i18nNodes.forEach((node) => {
    const key = node.dataset.i18n;
    const value = dict[key];
    if (value == null) return;

    node.textContent = value;
    // keep the decode engine's cached target in sync with the new text
    if (node.hasAttribute("data-decode")) node.dataset.original = value;
  });

  // reflect active state on the toggle
  els.langOpts.forEach((opt) => {
    opt.classList.toggle("is-active", opt.dataset.langOpt === lang);
  });

  // refresh the status badge in the new language
  if (state.outroDone)          setStatus("end");
  else if (state.activeIdx >= 0) setStatus("locked");
  else                           setStatus("ready");

  // replay decode on the focused card so the change reads as a re-scan
  if (animate && !state.reduced && state.activeIdx >= 0) {
    runDecode(els.cards[state.activeIdx]);
  }
}

/* ================================================================
   04. SCROLL ENGINE — hero dissolve + pseudo-3D tunnel (desktop)
   Runs inside the rAF loop; reads cached values only, writes
   transform / opacity / CSS custom properties exclusively.
   ================================================================ */
function updateHero() {
  // dissolve like smoke over the first viewport of scrolling
  const t = clamp(state.scrollY / (state.viewportH * 0.7), 0, 1);
  const drift = t * -60;                       // rise upward
  const spread = 1 + t * 0.06;                 // letters loosen slightly

  els.hero.style.opacity   = String(1 - t);
  els.hero.style.transform = `translate3d(0, ${drift}px, 0) scale(${spread})`;
  els.hero.style.filter    = `blur(${t * 14}px)`;
}

function updateTunnel() {
  const progress = clamp((state.scrollY - state.tunnelTop) / state.tunnelLen, 0, 1);
  const count = els.chapters.length;
  let anyLocked = false;
  let anyDecoding = false;

  els.chapters.forEach((chapter, i) => {
    const card = els.cards[i];

    // where along [0..1] this chapter sits perfectly at z = 0
    const focus = (i + 0.55) / (count + 0.35);
    // z < 0 → deep in the tunnel; z > 0 → past the camera
    const z = (progress - focus) * CONFIG.tunnelDepth * count;

    /* -- visibility ------------------------------------------------ */
    let opacity;
    if (z <= 0) {
      // emerging from the deep: fade + sharpen as it approaches
      opacity = clamp(1 - (-z / CONFIG.fadeInDepth), 0, 1);
    } else {
      // flying past the viewer: quick graceful exit
      opacity = clamp(1 - z / CONFIG.exitDepth, 0, 1);
    }

    /* -- mouse parallax (only meaningful near focus) ---------------- */
    const near = clamp(1 - Math.abs(z) / CONFIG.glitchRange, 0, 1);
    const rx = (state.pointerY - 0.5) * -CONFIG.parallaxRotate * near;
    const ry = (state.pointerX - 0.5) *  CONFIG.parallaxRotate * near;

    /* -- write transform + opacity (GPU only) ----------------------- */
    chapter.style.opacity = opacity.toFixed(3);
    chapter.style.transform =
      `translate3d(0, 0, ${z.toFixed(1)}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;

    /* -- glitch intensity → CSS custom property ---------------------- */
    const glitch = clamp(Math.abs(z) / CONFIG.glitchRange, 0, 1);
    card.style.setProperty("--glitch", glitch.toFixed(3));

    /* -- state classes ----------------------------------------------- */
    const locked   = Math.abs(z) < CONFIG.lockThreshold;
    const decoding = !locked && opacity > 0.05 && z < CONFIG.exitDepth;

    chapter.classList.toggle("is-active", locked);
    card.classList.toggle("card--locked", locked);
    card.classList.toggle("card--decoding", decoding);

    if (locked) {
      anyLocked = true;
      if (state.activeIdx !== i) {
        state.activeIdx = i;
        runDecode(card);               // scramble → resolve telemetry
      }
      applyMagnet(els.figures[i]);     // cursor-magnet on the focused image
    }
    if (decoding) anyDecoding = true;
  });

  if (!anyLocked) state.activeIdx = -1;

  /* -- system badge narration ---------------------------------------- */
  if (state.outroDone)        setStatus("end");
  else if (anyLocked)         setStatus("locked");
  else if (anyDecoding)       setStatus("decode");
  else                        setStatus("ready");
}

/** Cursor-magnet: the focused figure leans a few px toward the cursor. */
function applyMagnet(figure) {
  const dx = (state.pointerX - 0.5) * CONFIG.magnetStrength;
  const dy = (state.pointerY - 0.5) * CONFIG.magnetStrength;
  figure.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
}

/* ================================================================
   05. DECODE ENGINE — scramble → typewriter resolution
   Used on lock-in (desktop) and card entrance (mobile).
   ================================================================ */
function runDecode(card) {
  if (state.reduced) return;

  card.querySelectorAll("[data-decode]").forEach((el) => {
    // remember the true text once
    if (!el.dataset.original) el.dataset.original = el.textContent;
    const target = el.dataset.original;

    // cancel a previous run on the same element
    if (el._decodeRaf) cancelAnimationFrame(el._decodeRaf);

    let resolved = 0;
    const chars = CONFIG.decodeChars;

    const tick = () => {
      resolved = Math.min(target.length, resolved + CONFIG.decodeSpeed);
      let out = target.slice(0, resolved);
      for (let i = resolved; i < target.length; i++) {
        out += target[i] === "_" ? "_" : chars[(Math.random() * chars.length) | 0];
      }
      el.textContent = out;

      if (resolved < target.length) {
        el._decodeRaf = requestAnimationFrame(tick);
      } else {
        el._decodeRaf = null;
      }
    };
    el._decodeRaf = requestAnimationFrame(tick);
  });
}

/* ================================================================
   06. PARTICLES — ambient dust + drifting code fragments (desktop)
   A single 2D canvas, transform-free DOM, one draw per frame.
   ================================================================ */
const field = {
  ctx: null,
  dots: [],
  frags: [],
  dpr: 1,

  init() {
    if (!state.isDesktop || state.reduced) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.resize();
    this.ctx = els.field.getContext("2d");

    this.dots = Array.from({ length: CONFIG.particleCount }, () => ({
      x: Math.random(), y: Math.random(),
      r: 0.6 + Math.random() * 1.4,
      vy: 0.00012 + Math.random() * 0.0004,
      flicker: Math.random() * Math.PI * 2,
    }));

    this.frags = Array.from({ length: CONFIG.fragmentCount }, () => ({
      x: Math.random(), y: Math.random(),
      vy: 0.0003 + Math.random() * 0.0006,
      char: CONFIG.fragmentChars[(Math.random() * CONFIG.fragmentChars.length) | 0],
      size: 9 + Math.random() * 4,
      blinkAt: Math.random(),
    }));
  },

  resize() {
    els.field.width  = state.viewportW * this.dpr;
    els.field.height = state.viewportH * this.dpr;
  },

  draw(time) {
    const ctx = this.ctx;
    if (!ctx) return;
    const w = els.field.width, h = els.field.height;
    ctx.clearRect(0, 0, w, h);

    /* dust — tiny moss-tinted points, gently rising & flickering */
    for (const d of this.dots) {
      d.y -= d.vy;
      if (d.y < -0.02) { d.y = 1.02; d.x = Math.random(); }
      const alpha = 0.10 + 0.10 * Math.sin(time * 0.001 + d.flicker);
      ctx.fillStyle = `rgba(225, 84, 58, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(d.x * w, d.y * h, d.r * this.dpr, 0, Math.PI * 2);
      ctx.fill();
    }

    /* code fragments — occasional digital flickers */
    ctx.font = `${11 * this.dpr}px monospace`;
    for (const f of this.frags) {
      f.y -= f.vy;
      if (f.y < -0.03) {
        f.y = 1.03; f.x = Math.random();
        f.char = CONFIG.fragmentChars[(Math.random() * CONFIG.fragmentChars.length) | 0];
      }
      // brief hard flickers, otherwise very quiet
      const blink = (time * 0.0002 + f.blinkAt) % 1;
      const alpha = blink > 0.94 ? 0.35 : 0.09;
      ctx.fillStyle = `rgba(225, 84, 58, ${alpha})`;
      ctx.fillText(f.char, f.x * w, f.y * h);
    }
  },
};

/* ================================================================
   07. MOBILE — layered fade & float + lightweight decode
   IntersectionObserver drives entrances; no scroll math, no canvas.
   ================================================================ */
function initMobile() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const card = entry.target.querySelector(".card");

      card.classList.add("card--enter", "card--decoding");
      runDecode(card);                              // typewriter decode

      // settle into the locked state once the decode has played
      window.setTimeout(() => {
        card.classList.remove("card--decoding");
        card.classList.add("card--locked");
      }, state.reduced ? 0 : 1400);

      observer.unobserve(entry.target);             // one-shot
    });
  }, { threshold: 0.3 });

  els.chapters.forEach((ch) => observer.observe(ch));
}

/* ================================================================
   08. OUTRO — thousands of code fragments converge into the email
   Targets are sampled from text rendered on an offscreen canvas,
   then particles ease home over ~2.4 s. Afterwards the real,
   selectable DOM email fades in and the canvas dissolves.
   ================================================================ */
const outro = {
  ctx: null,
  particles: [],
  started: false,
  startTime: 0,
  dpr: 1,

  /** Rasterise "EMAIL / address" and sample opaque pixels as targets. */
  buildTargets() {
    const w = els.converge.width, h = els.converge.height;
    const off = document.createElement("canvas");
    off.width = w; off.height = h;
    const octx = off.getContext("2d");

    const big = Math.min(w * 0.09, 110 * this.dpr);
    octx.fillStyle = "#fff";
    octx.textAlign = "center";

    octx.font = CONFIG.outroFont.replace("%s", big.toFixed(0));
    octx.fillText("EMAIL", w / 2, h * 0.42);
    octx.font = `${(big * 0.34).toFixed(0)}px monospace`;
    // ===== CHANGE YOUR EMAIL HERE (canvas copy of the address) =====
    octx.fillText("7chaud@gmail.com", w / 2, h * 0.42 + big * 0.75);

    const data = octx.getImageData(0, 0, w, h).data;
    const targets = [];
    const step = 4 * this.dpr;                       // sampling density
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        if (data[(y * w + x) * 4 + 3] > 128) targets.push({ x, y });
      }
    }
    return targets;
  },

  start() {
    if (this.started || state.reduced || !state.isDesktop) {
      // graceful path: just reveal the content
      els.outroWrap.classList.add("is-revealed");
      state.outroDone = true;
      return;
    }
    this.started = true;

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    els.converge.width  = els.converge.offsetWidth  * this.dpr;
    els.converge.height = els.converge.offsetHeight * this.dpr;
    this.ctx = els.converge.getContext("2d");

    const targets = this.buildTargets();
    const count = Math.min(CONFIG.outroParticles, targets.length);
    const w = els.converge.width, h = els.converge.height;

    this.particles = Array.from({ length: count }, (_, i) => {
      const t = targets[(i * targets.length / count) | 0];
      return {
        sx: Math.random() * w,                       // scattered start
        sy: Math.random() * h,
        tx: t.x, ty: t.y,
        delay: Math.random() * 0.35,                 // staggered arrival
        char: CONFIG.fragmentChars[(Math.random() * CONFIG.fragmentChars.length) | 0],
      };
    });
    this.startTime = performance.now();
  },

  draw(time) {
    if (!this.started || state.outroDone) return;
    const ctx = this.ctx;
    const w = els.converge.width, h = els.converge.height;
    const elapsed = (time - this.startTime) / 2400;  // 2.4 s convergence
    ctx.clearRect(0, 0, w, h);

    ctx.font = `${5 * this.dpr}px monospace`;
    ctx.fillStyle = "rgba(225, 84, 58, 0.8)";

    let settled = true;
    for (const p of this.particles) {
      const t = easeOutCubic(clamp((elapsed - p.delay) / (1 - p.delay), 0, 1));
      if (t < 1) settled = false;
      const x = lerp(p.sx, p.tx, t);
      const y = lerp(p.sy, p.ty, t);
      // fragments render as tiny code glyphs until they land as points
      if (t < 0.92) ctx.fillText(p.char, x, y);
      else ctx.fillRect(x, y, 1.6 * this.dpr, 1.6 * this.dpr);
    }

    if (settled && elapsed > 1.15) {
      // hold the formed word for a beat, then hand over to the DOM
      state.outroDone = true;
      els.converge.style.transition = "opacity 1.6s ease";
      els.converge.style.opacity = "0";
      els.outroWrap.classList.add("is-revealed");
      setStatus("end");
    }
  },
};

function initOutroObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      outro.start();
      observer.disconnect();                         // no restart, no loop
    });
  }, { threshold: 0.45 });
  observer.observe(els.outro);
}

/* ================================================================
   09. EVENTS — passive listeners, cached reads, no work in handlers
   ================================================================ */
window.addEventListener("scroll", () => { state.scrollY = window.scrollY; },
  { passive: true });

window.addEventListener("pointermove", (e) => {
  state.pointerX = e.clientX / state.viewportW;
  state.pointerY = e.clientY / state.viewportH;
}, { passive: true });

let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    state.isDesktop = mqDesktop.matches;
    measure();
    if (field.ctx) field.resize();
  }, 150);
}, { passive: true });

mqReduceMotion.addEventListener?.("change", (e) => { state.reduced = e.matches; });

// language toggle — flip EN ⇄ 中, replaying the decode on the active card
els.langToggle.addEventListener("click", () => {
  applyLang(state.lang === "en" ? "zh" : "en", { animate: true });
});

/* ================================================================
   10. ANIMATION LOOP — one rAF for everything (≈60 FPS budget)
   ================================================================ */
function loop(time) {
  if (state.isDesktop && !state.reduced) {
    updateHero();
    updateTunnel();
    field.draw(time);
  }
  outro.draw(time);
  state.rafId = requestAnimationFrame(loop);
}

/* ================================================================
   PHOTO CAROUSEL — per-theme slideshow inside each card figure.
   Reads the comma-separated list in [data-images], swaps the main
   image + the --card-img variable (so glitch layers follow along).
   ================================================================ */
function initCarousels() {
  document.querySelectorAll("[data-carousel]").forEach((fig) => {
    const imgs = (fig.dataset.images || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const imgEl = fig.querySelector(".card__img");
    const dotsWrap = fig.querySelector(".carousel__dots");
    const prevBtn = fig.querySelector(".carousel__nav--prev");
    const nextBtn = fig.querySelector(".carousel__nav--next");

    // Single (or missing) photo → no controls, nothing to rotate.
    if (!imgEl || imgs.length <= 1) {
      fig.setAttribute("data-single", "");
      return;
    }

    imgs.forEach((src) => { const p = new Image(); p.src = src; }); // preload

    let index = 0;
    let timer = null;
    const DELAY = 4200;

    const dots = imgs.map((_, i) => {
      const b = document.createElement("button");
      b.className = "carousel__dot" + (i === 0 ? " is-active" : "");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", "Image " + (i + 1));
      b.addEventListener("click", () => { go(i); restart(); });
      dotsWrap.appendChild(b);
      return b;
    });

    function go(i) {
      index = (i + imgs.length) % imgs.length;
      const src = imgs[index];
      fig.classList.add("is-swapping");
      window.setTimeout(() => {
        imgEl.src = src;
        fig.style.setProperty("--card-img", "url('" + src + "')");
        fig.classList.remove("is-swapping");
      }, 160);
      dots.forEach((d, di) => d.classList.toggle("is-active", di === index));
    }

    function start() {
      if (state.reduced) return;      // respect prefers-reduced-motion
      stop();
      timer = window.setInterval(() => go(index + 1), DELAY);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    nextBtn.addEventListener("click", () => { go(index + 1); restart(); });
    prevBtn.addEventListener("click", () => { go(index - 1); restart(); });
    fig.addEventListener("mouseenter", stop);   // pause while inspecting
    fig.addEventListener("mouseleave", start);

    start();
  });
}

/* -- boot ---------------------------------------------------------- */
function init() {
  applyLang(state.lang);   // set language before anything renders
  measure();
  initCarousels();

  if (state.isDesktop && !state.reduced) {
    field.init();
  } else {
    initMobile();                                    // fade & float mode
  }

  initOutroObserver();

  if (state.reduced) {
    // static, fully-decoded experience — no engines
    setStatus("locked");
    return;
  }
  state.rafId = requestAnimationFrame(loop);
}

init();
