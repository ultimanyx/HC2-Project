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
  const timerDisplay = document.getElementById("timerDisplay");
  const footerTimer = document.getElementById("footerTimer");
  const progressBar = document.getElementById("progressBar");
  const exitBtn = document.getElementById("exitBtn");
  const nextBtn = document.getElementById("nextChapterBtn");
  const chapterNumberEl = document.getElementById("chapter-number");

  const volumeBtn = document.getElementById("volumeBtn");
  const volumeIcon = document.getElementById("volumeIcon");

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

  // --- Volume Toggle Logic ---
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
