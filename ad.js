
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // ---------- CONFIG ----------
  const AD_DURATION = 10; // seconds
  const NEXT_CHAPTER_URL = 'chapter2.html'; // ← change to your actual next chapter URL

  // ---------- STATE ----------
  const state = {
    timer: AD_DURATION,
    isRunning: false,
    isComplete: false,
    adType: 'banner', // 'banner' or 'video'
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

  // ---------- AD RENDERERS ----------
  function renderBanner() {
    adTypeLabel.textContent = '📢 Banner Ad';
    adContent.innerHTML = `
      <div class="banner-ad">
        <div class="banner-bg"></div>
        <div class="banner-content">
          <div class="banner-icon">📖</div>
          <h2>Continue Your Journey</h2>
          <p>Enjoy this short message before proceeding to the next chapter.</p>
          <span class="cta-badge">✨ Keep Reading</span>
        </div>
      </div>
    `;
  }

  function renderVideo() {
    adTypeLabel.textContent = '🎬 Video Ad';
    adContent.innerHTML = `
      <div class="video-ad">
        <video id="adVideo" muted playsinline preload="metadata">
          <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4">
          Your browser does not support video.
        </video>
        <div class="video-placeholder" id="videoPlaceholder" style="display:none;">
          <span class="play-icon">▶️</span>
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

    // Hide exit button
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
        // Show the Exit button
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

  function proceedToNextChapter() {
    hideOverlay();
    // Navigate to the next chapter
    window.location.href = NEXT_CHAPTER_URL;
  }

  // ---------- EVENT LISTENERS ----------
  // "Next" button triggers the ad
  if (nextBtn) {
    nextBtn.addEventListener('click', function (e) {
      e.preventDefault();
      // Randomly choose banner or video
      const type = Math.random() < 0.5 ? 'banner' : 'video';
      showOverlay(type);
    });
  }

  // "Exit" button proceeds to the next chapter
  if (exitBtn) {
    exitBtn.addEventListener('click', proceedToNextChapter);
  }

  // ---------- KEYBOARD SHORTCUTS ----------
  document.addEventListener('keydown', function (e) {
    // Enter to exit when overlay is active and exit button is visible
    if (e.key === 'Enter' && overlay.classList.contains('active') && exitBtn.classList.contains('active')) {
      exitBtn.click();
    }
    // Escape does nothing (no close without watching)
  });

  // ---------- CLEANUP ----------
  // Ensure timer is stopped if overlay is closed unexpectedly
  window.addEventListener('beforeunload', function () {
    stopTimer();
  });

  console.log('📺 Ad overlay integrated with chapter page.');
  console.log('⏱️  Click "Next" to trigger a 10s ad, then "Exit" to proceed.');
  console.log('📄 Next chapter URL: ' + NEXT_CHAPTER_URL);
});