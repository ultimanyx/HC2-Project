document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  // ---------- CONFIG ----------
  const AD_DURATION = 15; // seconds

  // ==== CHAPTER NAVIGATION CONFIG ====
  const CHAPTER_BASE = "novel_chapter";
  const CHAPTER_EXT = ".html";
  const TOTAL_CHAPTERS = 47;

  // Default Fallback Ads (If admin hasn't uploaded anything yet)
  const VIDEO_SOURCES = [
    "../advertisement/milo-ad.mp4",
    "../advertisement/datu-puti-ad.mp4",
    "../advertisement/temu_ad.mp4",
  ];
  const BANNER_IMAGES = ["../advertisement/scatter.png"];

  // ---------- STATE ----------
  const state = {
    timer: AD_DURATION,
    isRunning: false,
    isComplete: false,
    adType: "banner",
    intervalId: null,
  };

  // ---------- DOM REFS ----------
  const overlay = document.getElementById("adOverlay");
  const adContent = document.getElementById("adContent");
  const adTypeLabel = document.getElementById("adTypeLabel");
  const timerDisplay = document.getElementById("timerDisplay");
  const footerTimer = document.getElementById("footerTimer");
  const progressBar = document.getElementById("progressBar");
  const exitBtn = document.getElementById("exitBtn");
  const nextBtn = document.getElementById("nextChapterBtn");
  const chapterNumberEl = document.getElementById("chapter-number");

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
      nextBtn.textContent = "End";
      nextBtn.title = "You have reached the last chapter";
    } else {
      nextBtn.disabled = false;
      nextBtn.textContent = "Next";
      nextBtn.title = "Continue to the next chapter";
    }
  }

  // ---------- RENDER DEFAULT ADS (Fallback) ----------
  function renderBanner() {
    adTypeLabel.textContent = "Banner Ad";
    const randomImage =
      BANNER_IMAGES[Math.floor(Math.random() * BANNER_IMAGES.length)];

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
    adTypeLabel.textContent = "Video Ad";
    const randomVideo =
      VIDEO_SOURCES[Math.floor(Math.random() * VIDEO_SOURCES.length)];

    adContent.innerHTML = `
      <div class="video-ad">
        <video id="adVideo" muted playsinline preload="auto">
          <source src="${randomVideo}" type="video/mp4">
          Your browser does not support video.
        </video>
      </div>
    `;

    const video = document.getElementById("adVideo");
    if (video) {
      video.play().catch(function () {});
    }
  }

  // ---------- RENDER CUSTOM ADS (From Admin LocalStorage) ----------
  function renderActiveAd(ad) {
    adTypeLabel.textContent = ad.format + " Ad";

    if (ad.format.toLowerCase() === "banner") {
      // Render Custom Banner Image
      adContent.innerHTML = `
        <div class="banner-ad">
          <div class="banner-bg"></div>
          <div class="banner-content" style="display: flex; justify-content: center; align-items: center; height: 100%;">
             <img src="${ad.mediaData}" alt="${ad.campaign}" class="banner-image" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px;" /> 
          </div>
        </div>
      `;
    } else {
      // Render Custom Video (FIXED: Direct src assignment works better for Base64)
      adContent.innerHTML = `
        <div class="video-ad" style="display: flex; justify-content: center; align-items: center; height: 100%; background: #000;">
          <video id="adVideo" muted playsinline style="max-width: 100%; max-height: 100%; object-fit: contain;"></video>
        </div>
      `;

      const video = document.getElementById("adVideo");
      if (video) {
        // Direct src assignment is much more reliable for Base64 data URIs
        video.src = ad.mediaData;

        video.addEventListener("error", function () {
          console.warn("Failed to load custom video, falling back to default.");
          renderVideo();
        });

        video.play().catch(function (error) {
          console.log("Autoplay prevented or video failed:", error);
        });
      }
    }
  }

  // ---------- TIMER ----------
  function updateUI() {
    const t = Math.max(0, state.timer);
    timerDisplay.textContent = t;
    footerTimer.textContent = t;
    const pct = (t / AD_DURATION) * 100;
    progressBar.style.width = pct + "%";
  }

  function startTimer() {
    if (state.isRunning) return;
    state.isRunning = true;
    state.isComplete = false;
    state.timer = AD_DURATION;

    exitBtn.classList.remove("active");
    exitBtn.style.display = "none";

    updateUI();

    state.intervalId = setInterval(function () {
      state.timer--;
      updateUI();

      if (state.timer <= 0) {
        clearInterval(state.intervalId);
        state.isRunning = false;
        state.isComplete = true;
        exitBtn.style.display = "inline-block";
        requestAnimationFrame(function () {
          exitBtn.classList.add("active");
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

  // ---------- OVERLAY CONTROLS (UPDATED LOGIC) ----------
  function showOverlay(type) {
    overlay.classList.add("active");

    // 1. Check if Admin has uploaded any active ads
    let customAds = [];
    const storedAds = localStorage.getItem("novelNestAds");

    if (storedAds) {
      try {
        const ads = JSON.parse(storedAds);
        customAds = ads.filter((a) => a.status === "Active" && a.mediaData);
      } catch (e) {
        console.error("Error reading custom ads:", e);
      }
    }

    // 2. Decide what to show
    if (customAds.length > 0) {
      // Prioritize Custom Ads! Pick a random one from the active custom ads
      const randomAd = customAds[Math.floor(Math.random() * customAds.length)];
      state.adType = randomAd.format.toLowerCase();
      renderActiveAd(randomAd);
      console.log("Playing Custom Ad:", randomAd.campaign);
    } else {
      // Fallback to default random 50/50
      state.adType = type || (Math.random() < 0.5 ? "banner" : "video");
      if (state.adType === "banner") {
        renderBanner();
      } else {
        renderVideo();
      }
      console.log("No custom ads found. Playing Default Ad:", state.adType);
    }

    // 3. Start Timer
    state.timer = AD_DURATION;
    updateUI();
    exitBtn.classList.remove("active");
    exitBtn.style.display = "none";
    startTimer();
  }

  function hideOverlay() {
    overlay.classList.remove("active");
    stopTimer();
  }

  // ---------- PROCEED TO NEXT CHAPTER ----------
  function proceedToNextChapter() {
    const nextUrl = getNextChapterUrl();
    if (!nextUrl) return;

    if (isLastChapter()) {
      alert("You have reached the end of the book!");
      return;
    }

    hideOverlay();
    window.location.href = nextUrl;
  }

  // ---------- EVENT LISTENERS ----------
  if (nextBtn) {
    nextBtn.addEventListener("click", function (e) {
      e.preventDefault();

      if (isLastChapter()) {
        alert("You have reached the end of the book!");
        return;
      }

      // Trigger the overlay (it will figure out which ad to show)
      showOverlay();
    });
  }

  if (exitBtn) {
    exitBtn.addEventListener("click", proceedToNextChapter);
  }

  // ---------- KEYBOARD SHORTCUTS ----------
  document.addEventListener("keydown", function (e) {
    if (
      e.key === "Enter" &&
      overlay.classList.contains("active") &&
      exitBtn.classList.contains("active")
    ) {
      exitBtn.click();
    }
  });

  // ---------- CLEANUP ----------
  window.addEventListener("beforeunload", function () {
    stopTimer();
  });

  // ---------- INIT ----------
  updateNextButtonState();

  console.log("Ad overlay loaded. Ready to serve ads.");
});
