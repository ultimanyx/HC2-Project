document.addEventListener("DOMContentLoaded", () => {
  const panel = document.getElementById("autoscroll");
  const toggleBtn = document.getElementById("autoscrollToggle");
  const slowerBtn = document.getElementById("autoscrollSlower");
  const fasterBtn = document.getElementById("autoscrollFaster");
  const speedLabel = document.getElementById("autoscrollSpeedLabel");
  if (!panel || !toggleBtn || !slowerBtn || !fasterBtn || !speedLabel) return;

  // Speed levels in pixels-per-frame at ~60fps.
  // 1 = very slow (36px/s), 5 = fast (180px/s).
  const SPEEDS = [0.15, 0.3, 0.5, 0.75, 1.0];
  const DEFAULT_INDEX = 0; // start at "2x"

  let speedIndex = DEFAULT_INDEX;
  let isPlaying = false;
  let rafId = null;

  function updateLabel() {
    speedLabel.textContent = `${speedIndex + 1}×`;
    slowerBtn.disabled = speedIndex === 0;
    fasterBtn.disabled = speedIndex === SPEEDS.length - 1;
  }

  let scrollAccumulator = 0;

  function tick() {
    if (!isPlaying) return;

    scrollAccumulator += SPEEDS[speedIndex];

    // Only scroll when we've accumulated at least 1px
    const px = Math.floor(scrollAccumulator);
    if (px > 0) {
      window.scrollBy(0, px);
      scrollAccumulator -= px;
    }

    // Stop automatically when we hit the bottom of the page
    const atBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 2;

    if (atBottom) {
      stop();
      return;
    }

    rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (isPlaying) return;
    isPlaying = true;
    panel.classList.add("is-playing");
    toggleBtn.setAttribute("aria-label", "Stop auto-scroll");
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    if (!isPlaying) return;
    isPlaying = false;
    panel.classList.remove("is-playing");
    toggleBtn.setAttribute("aria-label", "Start auto-scroll");
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    scrollAccumulator = 0; // ← add this
  }

  function toggle() {
    isPlaying ? stop() : start();
  }

  // ---------- Events ----------
  toggleBtn.addEventListener("click", toggle);

  slowerBtn.addEventListener("click", () => {
    if (speedIndex > 0) {
      speedIndex--;
      updateLabel();
    }
  });

  fasterBtn.addEventListener("click", () => {
    if (speedIndex < SPEEDS.length - 1) {
      speedIndex++;
      updateLabel();
    }
  });

  // ---------- Keyboard shortcuts (optional) ----------
  // Space = toggle, ArrowUp/Down = speed, Esc = stop
  document.addEventListener("keydown", (e) => {
    // Don't hijack keys when the user is typing
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || e.target.isContentEditable)
      return;

    if (e.code === "Space") {
      e.preventDefault();
      toggle();
    } else if (e.key === "ArrowUp") {
      fasterBtn.click();
    } else if (e.key === "ArrowDown") {
      slowerBtn.click();
    } else if (e.key === "Escape") {
      stop();
    }
  });

  // ---------- Auto-stop if user scrolls manually ----------
  // Small threshold so tiny OS-driven scrolls don't falsely trigger.
  let lastAutoY = 0;
  window.addEventListener(
    "wheel",
    () => {
      if (isPlaying) stop();
    },
    { passive: true },
  );
  window.addEventListener(
    "touchmove",
    () => {
      if (isPlaying) stop();
    },
    { passive: true },
  );

  // ---------- Hide controls when page is too short ----------
  function maybeHide() {
    const scrollable =
      document.documentElement.scrollHeight - window.innerHeight;
    panel.classList.toggle("autoscroll-hidden", scrollable < 200);
  }
  window.addEventListener("resize", maybeHide);
  maybeHide();

  updateLabel();
});
