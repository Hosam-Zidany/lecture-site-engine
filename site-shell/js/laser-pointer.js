const FADE_DELAY_MS = 1500;
const FADE_DURATION_MS = 500;
const DRAG_THRESHOLD = 4;

/** Stroke width as a ratio of lecture body font size (تقليل النسبة لتصغير الحجم). */
const LINE_WIDTH_RATIO = 0.15; // قمنا بتخفيضها من 0.325 إلى 0.15
const GLOW_WIDTH_RATIO = 1.5;  // قمنا بتخفيض التوهج أيضاً ليتناسب مع الحجم الجديد

function getLaserMetrics() {
  const ref = document.querySelector('#content .text-body-md, #content .prose-content p, #content .lecture-body')
    || document.body;
  const fontSize = parseFloat(getComputedStyle(ref).fontSize) || 16;
  
  // إزالة القيد Math.max(2.5, ...) للسماح بحجم أصغر
  const lineWidth = fontSize * LINE_WIDTH_RATIO;
  
  return {
    lineWidth,
    glowWidth: lineWidth * GLOW_WIDTH_RATIO,
    shadowOuter: lineWidth * 1.5, // تقليل الهالة الخارجية
    shadowInner: lineWidth * 0.8, // تقليل الهالة الداخلية
    dotRadius: lineWidth * 0.5,
  };
}
/**
 * Interactive laser pointer — full-page transparent canvas overlay.
 * Pointer events are captured on document; canvas uses pointer-events: none.
 */
export function initLaserPointer() {
  const toggle = document.getElementById('laserPointerToggle');
  const canvas = document.getElementById('laserPointerCanvas');
  if (!toggle || !canvas || toggle.dataset.bound === '1') return;
  toggle.dataset.bound = '1';

  const ctx = canvas.getContext('2d');
  let enabled = false;
  let pointerDown = false;
  let didDrag = false;
  let startX = 0;
  let startY = 0;
  /** @type {{ points: {x:number,y:number}[], completedAt: number|null } | null} */
  let currentStroke = null;
  /** @type {Array<{ points: {x:number,y:number}[], completedAt: number|null }>} */
  let strokes = [];
  let rafId = null;

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  }

  function strokeOpacity(stroke, now) {
    if (stroke.completedAt == null) return 1;
    const fadeStart = stroke.completedAt + FADE_DELAY_MS;
    if (now < fadeStart) return 1;
    const fadeAge = now - fadeStart;
    if (fadeAge >= FADE_DURATION_MS) return 0;
    return 1 - fadeAge / FADE_DURATION_MS;
  }

  function drawStroke(points, opacity) {
    if (!points.length) return;

    const { lineWidth, glowWidth, shadowOuter, shadowInner, dotRadius } = getLaserMetrics();

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (points.length === 1) {
      ctx.globalAlpha = opacity * 0.9;
      ctx.fillStyle = '#ff3344';
      ctx.shadowColor = 'rgba(255, 55, 75, 0.95)';
      ctx.shadowBlur = shadowOuter;
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, dotRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      return;
    }

    ctx.shadowColor = 'rgba(255, 45, 65, 0.95)';
    ctx.globalAlpha = opacity * 0.4;
    ctx.strokeStyle = '#ff5566';
    ctx.shadowBlur = shadowOuter;
    ctx.lineWidth = glowWidth;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();

    ctx.shadowBlur = shadowInner;
    ctx.globalAlpha = opacity * 0.95;
    ctx.strokeStyle = '#ff2233';
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  function redraw() {
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    const now = performance.now();

    strokes = strokes.filter((stroke) => {
      if (stroke.completedAt == null) return true;
      return now < stroke.completedAt + FADE_DELAY_MS + FADE_DURATION_MS;
    });

    for (const stroke of strokes) {
      const opacity = strokeOpacity(stroke, now);
      if (opacity > 0) drawStroke(stroke.points, opacity);
    }
  }

  function needsAnimation() {
    if (!strokes.length) return false;
    const now = performance.now();
    return strokes.some((stroke) => {
      if (stroke.completedAt == null) return true;
      return now < stroke.completedAt + FADE_DELAY_MS + FADE_DURATION_MS;
    });
  }

  function tick() {
    redraw();
    if (needsAnimation()) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  }

  function ensureAnimation() {
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function stopAnimation() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function isInteractiveTarget(target) {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest(
      '#laserPointerToggle, #themeToggle, #lectureNotesBtn, #lectureWidthControl, '
      + '#lectureNotesModal, .lecture-notes-modal, .mobile-toc-drawer, .mobile-study-bar',
    ));
  }

  function onPointerDown(e) {
    if (!enabled || e.button !== 0 || isInteractiveTarget(e.target)) return;
    pointerDown = true;
    didDrag = false;
    startX = e.clientX;
    startY = e.clientY;
    currentStroke = { points: [{ x: e.clientX, y: e.clientY }], completedAt: null };
    strokes.push(currentStroke);
  }

  function onPointerMove(e) {
    if (!enabled || !pointerDown || !currentStroke) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!didDrag && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

    if (!didDrag) didDrag = true;
    if (didDrag) e.preventDefault();

    const pt = { x: e.clientX, y: e.clientY };
    const last = currentStroke.points[currentStroke.points.length - 1];
    if (Math.hypot(pt.x - last.x, pt.y - last.y) < 1.5) return;

    currentStroke.points.push(pt);
    redraw();
    ensureAnimation();
  }

  function onPointerUp() {
    if (!enabled || !pointerDown) return;
    pointerDown = false;

    if (currentStroke) {
      if (!didDrag) {
        strokes.pop();
      } else {
        currentStroke.completedAt = performance.now();
        ensureAnimation();
      }
    }

    currentStroke = null;
    didDrag = false;
  }

  function setEnabled(on) {
    enabled = on;
    toggle.classList.toggle('is-active', on);
    toggle.setAttribute('aria-pressed', String(on));
    toggle.title = on ? 'إيقاف قلم الليزر' : 'قلم ليزر تفاعلي';
    document.body.classList.toggle('laser-pointer-enabled', on);

    if (!on) {
      pointerDown = false;
      currentStroke = null;
      didDrag = false;
      strokes = [];
      stopAnimation();
      redraw();
    }
  }

  toggle.addEventListener('click', () => setEnabled(!enabled));
  window.addEventListener('resize', resizeCanvas);
  document.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointermove', onPointerMove, { passive: false });
  document.addEventListener('pointerup', onPointerUp);
  document.addEventListener('pointercancel', onPointerUp);

  resizeCanvas();
}
