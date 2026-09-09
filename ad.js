document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // ---------- CONFIG ----------
  const AD_DURATION = 15; // seconds

  // ==== CHAPTER NAVIGATION CONFIG ====
  const CHAPTER_BASE = 'novel_chapter'; // e.g., novel_chapter1.html, novel_chapter1.html
  const CHAPTER_EXT = '.html';
  const TOTAL_CHAPTERS = 47; // ← set this to the total number of chapters

  const VIDEO_SOURCES = [
  '../advertisement/milo-ad.mp4',
  '../advertisement/datu-puti-ad.mp4'

];

const BANNER_IMAGES = [
  '../advertisement/scatter.png',
];
  // ---------- STATE ----------
  const state = {
    timer: AD_DURATION,
    isRunning: false,
    isComplete: false,
    adType: 'banner',
    intervalId: null,
  };

  // ---------- DOM REFS ----------
  const overlay = document.getElementById('adOverlay');
  const adContent = document.getElementById('adContent');
  const adTypeLabel = document.getElementById('adTypeLabel');
  const timerDisplay = document.getElementById('timerDisplay');
  const footerTimer = document.getElementById('footerTimer');
  const progressBar = document.getElementById('progressBar');
  const exitBtn = document.getElementById('exitBtn');
  const nextBtn = document.getElementById('nextChapterBtn');
  const chapterNumberEl = document.getElementById('chapter-number');

  // ---------- HELPER: get current chapter number ----------
  function getCurrentChapterNumber() {
    if (!chapterNumberEl) return null;
    const text = chapterNumberEl.textContent.trim();
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }

  // ---------- HELPER: get next chapter URL ----------
  function getNextChapterUrl() {
    const current = getCurrentChapterNumber();
    if (current === null) return null;
    const next = current + 1;
    return `${CHAPTER_BASE}${next}${CHAPTER_EXT}`;
  }

  // ---------- HELPER: check if this is the last chapter ----------
  function isLastChapter() {
    const current = getCurrentChapterNumber();
    if (current === null) return false;
    return current >= TOTAL_CHAPTERS;
  }

  // ---------- Update "Next" button state ----------
  function updateNextButtonState() {
    if (!nextBtn) return;
    if (isLastChapter()) {
      nextBtn.disabled = true;
      nextBtn.textContent = 'End'; // or 'No more chapters'
      nextBtn.title = 'You have reached the last chapter';
    } else {
      nextBtn.disabled = false;
      nextBtn.textContent = 'Next';
      nextBtn.title = 'Continue to the next chapter';
    }
  }

  // ---------- AD RENDERERS ----------
  function renderBanner() {
    adTypeLabel.textContent = 'Banner Ad';
     const randomImage = BANNER_IMAGES[Math.floor(Math.random() * BANNER_IMAGES.length)];

    adContent.innerHTML = `
      <div class="banner-ad">
        <div class="banner-bg"></div>
        <div class="banner-content">
           <img src="${randomImage}" alt="Banner ad" class="banner-image" /> 
      </div>
    </div>
  `;
  }


  function renderVideo() {
    adTypeLabel.textContent = 'Video Ad';
     const randomVideo = VIDEO_SOURCES[Math.floor(Math.random() * VIDEO_SOURCES.length)];
     adContent.innerHTML = `
    <div class="video-ad">
      <video id="adVideo" muted playsinline preload="metadata">
        <source src="${randomVideo}" type="video/mp4">
        Your browser does not support video.
      </video>
      <div class="video-placeholder" id="videoPlaceholder" style="display:none;">
        <span class="play-icon"></span>
        <p>Video ad would play here.</p>
        <p style="font-size:13px;color:#6b7a93;">(Sample video from W3Schools)</p>
      </div>
    </div>
  `;

    const video = document.getElementById('adVideo');
    if (video) {
      video.addEventListener('loadedmetadata', function () {
        video.play().catch(function () {});
      });
      video.addEventListener('error', function () {
        const placeholder = document.getElementById('videoPlaceholder');
        if (placeholder) placeholder.style.display = 'block';
        if (video) video.style.display = 'none';
      });
      setTimeout(function () {
        video.play().catch(function () {});
      }, 400);
    }
  }

  function renderAd(type) {
    if (type === 'banner') renderBanner();
    else renderVideo();
  }

  // ---------- TIMER ----------
  function updateUI() {
    const t = Math.max(0, state.timer);
    timerDisplay.textContent = t;
    footerTimer.textContent = t;
    const pct = (t / AD_DURATION) * 100;
    progressBar.style.width = pct + '%';
  }

  function startTimer() {
    if (state.isRunning) return;
    state.isRunning = true;
    state.isComplete = false;
    state.timer = AD_DURATION;

    exitBtn.classList.remove('active');
    exitBtn.style.display = 'none';

    updateUI();

    state.intervalId = setInterval(function () {
      state.timer--;
      updateUI();

      if (state.timer <= 0) {
        clearInterval(state.intervalId);
        state.isRunning = false;
        state.isComplete = true;
        exitBtn.style.display = 'inline-block';
        requestAnimationFrame(function () {
          exitBtn.classList.add('active');
        });
      }
    }, 1000);
  }

  function stopTimer() {
    if (state.intervalId) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
    state.isRunning = false;
  }

  // ---------- OVERLAY CONTROLS ----------
  function showOverlay(type) {
    overlay.classList.add('active');
    state.adType = type || (Math.random() < 0.5 ? 'banner' : 'video');
    renderAd(state.adType);
    state.timer = AD_DURATION;
    updateUI();
    exitBtn.classList.remove('active');
    exitBtn.style.display = 'none';
    startTimer();
  }

  function hideOverlay() {
    overlay.classList.remove('active');
    stopTimer();
  }

  // ---------- PROCEED TO NEXT CHAPTER (DYNAMIC) ----------
  function proceedToNextChapter() {
    const nextUrl = getNextChapterUrl();
    if (!nextUrl) {
      console.warn('Could not determine next chapter URL.');
      return;
    }

    // Check if we're on the last chapter
    if (isLastChapter()) {
      alert('You have reached the end of the book!');
      return;
    }

    hideOverlay();

    // Navigate to the next chapter
    window.location.href = nextUrl;
  }

  // ---------- EVENT LISTENERS ----------
  if (nextBtn) {
    nextBtn.addEventListener('click', function (e) {
      e.preventDefault();

      // If it's the last chapter, show a message
      if (isLastChapter()) {
        alert('You have reached the end of the book!');
        return;
      }

      const type = Math.random() < 0.5 ? 'banner' : 'video';
      showOverlay(type);
    });
  }

  if (exitBtn) {
    exitBtn.addEventListener('click', proceedToNextChapter);
  }

  // ---------- KEYBOARD SHORTCUTS ----------
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && overlay.classList.contains('active') && exitBtn.classList.contains('active')) {
      exitBtn.click();
    }
  });

  // ---------- CLEANUP ----------
  window.addEventListener('beforeunload', function () {
    stopTimer();
  });

  // ---------- INIT ----------
  // Check if we're on the last chapter and update the button state
  updateNextButtonState();

  console.log('Ad overlay with dynamic chapter navigation loaded.');
  console.log('Current chapter: ' + getCurrentChapterNumber());
  console.log('Next chapter URL: ' + getNextChapterUrl());
  console.log(' Total chapters: ' + TOTAL_CHAPTERS);
  console.log(' Click "Next" to trigger a ' + AD_DURATION + 's ad, then "Exit" to proceed.');
});