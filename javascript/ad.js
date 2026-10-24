document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  const AD_DURATION = 15;

  const state = {
    timer: AD_DURATION,
    isRunning: false,
    isComplete: false,
    intervalId: null,
  };

  const overlay = document.getElementById("adOverlay");
  const adContent = document.getElementById("adContent");
  const timerDisplay = document.getElementById("timerDisplay");
  const footerTimer = document.getElementById("footerTimer");
  const progressBar = document.getElementById("progressBar");
  const exitBtn = document.getElementById("exitBtn");
  const nextBtn = document.getElementById("nextChapterBtn");
  const chapterNumberEl = document.getElementById("chapter-number");

  const volumeBtn = document.getElementById("volumeBtn");
  const volumeIcon = document.getElementById("volumeIcon");

  /* ============================================================
     CHAPTER URL PARSING
     ============================================================ */

  function getChapterInfo() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("book") && urlParams.has("ch")) {
      return {
        isDynamic: true,
        bookId: urlParams.get("book"),
        current: parseInt(urlParams.get("ch"), 10),
      };
    }

    const filename = window.location.pathname.split(/[\\/]/).pop();
    const m = filename.match(/^(.*?)chapter(\d+)(\.html?)$/i);
    if (!m) return null;
    return {
      isDynamic: false,
      prefix: m[1],
      numStr: m[2],
      suffix: m[3],
      current: parseInt(m[2], 10),
    };
  }

  function getCurrentChapterNumber() {
    const info = getChapterInfo();
    if (info) return info.current;

    if (!chapterNumberEl) return null;
    const m = chapterNumberEl.textContent.trim().match(/\d+/);
    return m ? parseInt(m[0], 10) : null;
  }

  function getNextChapterUrl() {
    const current = getCurrentChapterNumber();
    if (current === null) return null;

    const info = getChapterInfo();
    if (!info) return null;

    if (info.isDynamic) {
      return `chapter.html?book=${info.bookId}&ch=${info.current + 1}`;
    }

    const nextChapterNum = current + 1;
    const nextLink = document.querySelector(
      `#chapter-list a[href*="chapter${nextChapterNum}.html"]`,
    );

    if (
      !nextLink ||
      !nextLink.getAttribute("href") ||
      nextLink.getAttribute("href") === ""
    ) {
      return null;
    }

    return nextLink.getAttribute("href");
  }

  function getTotalChapters() {
    const n = parseInt(document.body.dataset.totalChapters, 10);
    if (!isNaN(n) && n > 0) return n;
    return 3;
  }

  function isLastChapter() {
    const current = getCurrentChapterNumber();
    const total = getTotalChapters();
    if (current === null || total <= 0) return false;

    if (current >= total) return true;
    const nextUrl = getNextChapterUrl();
    return !nextUrl;
  }

  /* ============================================================
     BUTTON STATE
     ============================================================ */

  function updateNextButtonState() {
    if (!nextBtn) return;

    const info = getChapterInfo();

    // 🚨 FIX: Only show "End" if it's a DYNAMIC book.
    // Hardcoded static pages will always show "Next".
    if (info && info.isDynamic) {
      if (isLastChapter()) {
        nextBtn.disabled = true;
        nextBtn.textContent = "End";
        nextBtn.title = "You have reached the last available chapter";
      } else {
        nextBtn.disabled = false;
        nextBtn.textContent = "Next";
        nextBtn.title = "Continue to the next chapter";
      }
    } else {
      // Static pages: Always say Next
      nextBtn.disabled = false;
      nextBtn.textContent = "Next";
      nextBtn.title = "Continue";
    }
  }

  /* ============================================================
     AD RENDERING
     ============================================================ */

  function renderAd(ad) {
    if (ad.format.toLowerCase() === "banner") {
      adContent.innerHTML = `
        <div class="banner-ad">
          <div class="banner-bg"></div>
          <div class="banner-content">
            <img src="${ad.mediaData}" alt="${ad.campaign}" class="banner-image" />
          </div>
        </div>
      `;
      if (volumeBtn) volumeBtn.style.display = "none";
    } else {
      adContent.innerHTML = `
        <div class="video-ad">
          <video id="adVideo" playsinline></video>
        </div>
      `;

      if (volumeBtn) volumeBtn.style.display = "flex";

      const video = document.getElementById("adVideo");
      if (video) {
        video.src = ad.mediaData;
        video.muted = true;
        if (volumeIcon) volumeIcon.src = "../icons/volume-mute.svg";

        video.play().catch(function (error) {
          console.log("Autoplay prevented:", error);
        });
      }
    }
  }

  /* ============================================================
     TIMER
     ============================================================ */

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

  /* ============================================================
     OVERLAY
     ============================================================ */

  function showOverlay() {
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";

    let ads = [];
    const storedAds = localStorage.getItem("ads");

    if (storedAds) {
      ads = JSON.parse(storedAds);
    } else {
      ads = [
        {
          campaign: "Milo",
          format: "Video",
          status: "Active",
          archived: false,
          mediaData: "../advertisement/milo-ad.mp4",
        },
        {
          campaign: "Datu Puti",
          format: "Video",
          status: "Active",
          archived: false,
          mediaData: "../advertisement/datu-puti-ad.mp4",
        },
        {
          campaign: "Temu",
          format: "Video",
          status: "Active",
          archived: false,
          mediaData: "../advertisement/temu_ad.mp4",
        },
        {
          campaign: "Scatter",
          format: "Banner",
          status: "Active",
          archived: false,
          mediaData: "../advertisement/scatter.png",
        },
      ];
    }

    const activeAds = ads.filter(
      (a) => a.status === "Active" && !a.archived && a.mediaData,
    );

    if (activeAds.length > 0) {
      const randomAd = activeAds[Math.floor(Math.random() * activeAds.length)];
      renderAd(randomAd);
      console.log("Playing Ad:", randomAd.campaign);
    } else {
      adContent.innerHTML = `<div style="padding:20px;text-align:center;color:#fff;font-size:16px;">No active ads available.</div>`;
      if (volumeBtn) volumeBtn.style.display = "none";
    }

    state.timer = AD_DURATION;
    updateUI();
    exitBtn.classList.remove("active");
    exitBtn.style.display = "none";
    startTimer();
  }

  function hideOverlay() {
    overlay.classList.remove("active");
    document.body.style.overflow = "";
    stopTimer();

    const adVideo = document.getElementById("adVideo");
    if (adVideo) {
      adVideo.pause();
      adVideo.src = "";
    }
  }

  /* ============================================================
     NAVIGATION
     ============================================================ */

  function proceedToNextChapter() {
    const nextUrl = getNextChapterUrl();

    if (!nextUrl) {
      hideOverlay();
      return;
    }

    hideOverlay();
    window.location.href = nextUrl;
  }

  /* ============================================================
     EVENT WIRING
     ============================================================ */

  if (nextBtn) {
    nextBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (nextBtn.disabled) return; // Don't open ad if it says "End"
      showOverlay();
    });
  }

  if (exitBtn) {
    exitBtn.addEventListener("click", proceedToNextChapter);
  }

  if (volumeBtn && volumeIcon) {
    volumeBtn.addEventListener("click", function () {
      const video = document.getElementById("adVideo");
      if (!video) return;

      video.muted = !video.muted;

      if (video.muted) {
        volumeIcon.src = "../icons/volume-mute.svg";
        volumeBtn.setAttribute("aria-label", "Unmute ad");
      } else {
        volumeIcon.src = "../icons/volume-full.svg";
        volumeBtn.setAttribute("aria-label", "Mute ad");
      }
    });
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
