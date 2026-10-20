document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  const AD_DURATION = 15;
  const CHAPTER_BASE = "novel_chapter";
  const CHAPTER_EXT = ".html";
  const TOTAL_CHAPTERS = 47;

  const state = {
    timer: AD_DURATION,
    isRunning: false,
    isComplete: false,
    intervalId: null,
  };

  const overlay = document.getElementById("adOverlay");
  const adContent = document.getElementById("adContent");
  const adTypeLabel = document.getElementById("adTypeLabel");
  const timerDisplay = document.getElementById("timerDisplay");
  const footerTimer = document.getElementById("footerTimer");
  const progressBar = document.getElementById("progressBar");
  const exitBtn = document.getElementById("exitBtn");
  const nextBtn = document.getElementById("nextChapterBtn");
  const chapterNumberEl = document.getElementById("chapter-number");

  function getCurrentChapterNumber() {
    if (!chapterNumberEl) return null;
    const text = chapterNumberEl.textContent.trim();
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }

  function getNextChapterUrl() {
    const current = getCurrentChapterNumber();
    if (current === null) return null;
    return `${CHAPTER_BASE}${current + 1}${CHAPTER_EXT}`;
  }

  function isLastChapter() {
    const current = getCurrentChapterNumber();
    if (current === null) return false;
    return current >= TOTAL_CHAPTERS;
  }

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

  function renderAd(ad) {
    adTypeLabel.textContent = ad.format + " Ad";

    if (ad.format.toLowerCase() === "banner") {
      adContent.innerHTML = `
        <div class="banner-ad">
          <div class="banner-bg"></div>
          <div class="banner-content" style="display: flex; justify-content: center; align-items: center; height: 100%;">
             <img src="${ad.mediaData}" alt="${ad.campaign}" class="banner-image" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px;" /> 
          </div>
        </div>
      `;
    } else {
      adContent.innerHTML = `
        <div class="video-ad" style="display: flex; justify-content: center; align-items: center; height: 100%; background: #000;">
          <video id="adVideo" muted playsinline style="max-width: 100%; max-height: 100%; object-fit: contain;"></video>
        </div>
      `;

      const video = document.getElementById("adVideo");
      if (video) {
        video.src = ad.mediaData;

        // If the video fails to load, just log it. DO NOT fallback to a paused ad.
        video.addEventListener("error", function () {
          console.warn(
            "Failed to load video ad. File might be too large or corrupted:",
            ad.campaign,
          );
        });

        video.play().catch(function (error) {
          console.log("Autoplay prevented:", error);
        });
      }
    }
  }

  function updateUI() {
    const t = Math.max(0, state.timer);
    timerDisplay.textContent = t;
    footerTimer.textContent = t;
    progressBar.style.width = (t / AD_DURATION) * 100 + "%";
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
    if (state.intervalId) clearInterval(state.intervalId);
    state.isRunning = false;
  }

  function showOverlay() {
    overlay.classList.add("active");

    let ads = [];
    const storedAds = localStorage.getItem("novelNestAds_v2");

    if (storedAds) {
      ads = JSON.parse(storedAds);
    } else {
      // Hardcoded default ads if LocalStorage is completely empty
      ads = [
        {
          campaign: "Milo",
          format: "Video",
          status: "Active",
          mediaData: "../advertisement/milo-ad.mp4",
        },
        {
          campaign: "Datu Puti",
          format: "Video",
          status: "Active",
          mediaData: "../advertisement/datu-puti-ad.mp4",
        },
        {
          campaign: "Temu",
          format: "Video",
          status: "Active",
          mediaData: "../advertisement/temu_ad.mp4",
        },
        {
          campaign: "Scatter",
          format: "Banner",
          status: "Active",
          mediaData: "../advertisement/scatter.png",
        },
      ];
    }

    // Only filter for ACTIVE ads that have media data
    const activeAds = ads.filter((a) => a.status === "Active" && a.mediaData);

    if (activeAds.length > 0) {
      const randomAd = activeAds[Math.floor(Math.random() * activeAds.length)];
      renderAd(randomAd);
      console.log("Playing Ad:", randomAd.campaign);
    } else {
      // Admin paused EVERY single ad
      adTypeLabel.textContent = "Notice";
      adContent.innerHTML = `<div style="padding:20px;text-align:center;color:#fff;font-size:16px;">No active ads available.</div>`;
    }

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

  if (nextBtn) {
    nextBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (isLastChapter()) {
        alert("You have reached the end of the book!");
        return;
      }
      showOverlay();
    });
  }

  if (exitBtn) {
    exitBtn.addEventListener("click", proceedToNextChapter);
  }

  document.addEventListener("keydown", function (e) {
    if (
      e.key === "Enter" &&
      overlay.classList.contains("active") &&
      exitBtn.classList.contains("active")
    ) {
      exitBtn.click();
    }
  });

  window.addEventListener("beforeunload", function () {
    stopTimer();
  });

  updateNextButtonState();
  console.log("Ad overlay loaded. Synced with Admin Panel.");
});
