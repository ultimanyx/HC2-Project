document.addEventListener("DOMContentLoaded", function () {
  const tableBody = document.getElementById("adTableBody");
  const statTotal = document.getElementById("statTotal");
  const statActive = document.getElementById("statActive");
  const statPaused = document.getElementById("statPaused");

  const modal = document.getElementById("addAdModal");
  const openModalBtn = document.getElementById("openAddModalBtn");
  const closeModalBtn = document.getElementById("closeAddModalBtn");
  const cancelBtn = document.getElementById("cancelAddBtn");
  const addAdForm = document.getElementById("addAdForm");

  // Get the file input and dropdown elements
  const fileInput = document.getElementById("adFile");
  const formatSelect = document.getElementById("adFormat");

  const STORAGE_KEY = "novelNestAds_v2";

  // Default Ads
  const defaultAds = [
    {
      id: "ad-1",
      campaign: "Nestle Milo",
      format: "Video",
      views: 1240000,
      status: "Active",
      mediaData: "../advertisement/milo-ad.mp4",
    },
    {
      id: "ad-2",
      campaign: "Datu Puti",
      format: "Video",
      views: 2100000,
      status: "Active",
      mediaData: "../advertisement/datu-puti-ad.mp4",
    },
    {
      id: "ad-3",
      campaign: "Temu",
      format: "Video",
      views: 980000,
      status: "Active",
      mediaData: "../advertisement/temu_ad.mp4",
    },
    {
      id: "ad-4",
      campaign: "Scatter",
      format: "Banner",
      views: 620000,
      status: "Active",
      mediaData: "../advertisement/scatter.png",
    },
  ];

  // --- State Management ---
  function getAds() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAds));
    return defaultAds;
  }

  function saveAds(ads) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ads));
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Storage Limit Reached",
        text: "The video/image file is too large for browser storage. Please try a smaller file.",
      });
    }
  }

  // --- Render Table & Stats ---
  function renderTable() {
    const ads = getAds();
    tableBody.innerHTML = "";

    let activeCount = 0;
    let pausedCount = 0;

    ads.forEach((ad) => {
      if (ad.status === "Active") activeCount++;
      if (ad.status === "Paused") pausedCount++;

      const formattedViews = ad.views.toLocaleString();

      let actionButtons = "";
      if (ad.status === "Active") {
        actionButtons = `
          <button class="btn btn-warning btn-sm pause-btn" data-id="${ad.id}">
            <img src="../icons/pause.svg" alt="" class="btn-icon" /> Pause
          </button>
        `;
      } else if (ad.status === "Paused") {
        actionButtons = `
          <button class="btn btn-success btn-sm resume-btn" data-id="${ad.id}">
            <img src="../icons/play.svg" alt="" class="btn-icon" /> Continue
          </button>
        `;
      }

      actionButtons += `
        <button class="btn btn-danger btn-sm remove-btn" data-id="${ad.id}">
          <img src="../icons/delete.svg" alt="delete" class="btn-icon" /> Remove
        </button>
      `;

      const statusClass = ad.status.toLowerCase();

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${ad.campaign}</strong></td>
        <td>${ad.format}</td>
        <td>${formattedViews}</td>
        <td><span class="badge ${statusClass}">${ad.status}</span></td>
        <td>
          <div class="action-group">
            ${actionButtons}
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    statTotal.textContent = ads.length;
    statActive.textContent = activeCount;
    statPaused.textContent = pausedCount;
  }

  renderTable();

  // --- Modal Logic ---
  function openModal() {
    modal.classList.add("active");
    addAdForm.reset();
    formatSelect.dispatchEvent(new Event("change")); // Reset file input state
  }

  function closeModal() {
    modal.classList.remove("active");
  }

  openModalBtn.addEventListener("click", openModal);
  closeModalBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // --- NEW: Dynamically change file input restrictions based on format ---
  formatSelect.addEventListener("change", function () {
    if (this.value === "Video") {
      fileInput.accept = "video/*"; // Only allow video files
      fileInput.value = ""; // Clear any previously selected image
    } else if (this.value === "Banner") {
      fileInput.accept = "image/*"; // Only allow image files
      fileInput.value = ""; // Clear any previously selected video
    }
  });

  // Trigger once on load to set the initial state
  formatSelect.dispatchEvent(new Event("change"));

  // --- Add New Ad Logic ---
  addAdForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const campaign = document.getElementById("campaignName").value;
    const format = formatSelect.value;
    const file = fileInput.files[0];

    if (!file) return;

    // --- STRICT VALIDATION: Prevent bypassing the file picker ---
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (format === "Video" && !isVideo) {
      Swal.fire({
        icon: "error",
        title: "Invalid File Type",
        text: "You selected 'Video' format, but uploaded an image. Please upload an MP4 or WebM file.",
      });
      return;
    }

    if (format === "Banner" && !isImage) {
      Swal.fire({
        icon: "error",
        title: "Invalid File Type",
        text: "You selected 'Banner' format, but uploaded a video. Please upload a JPG or PNG file.",
      });
      return;
    }

    // Check file size limit (1.5MB to prevent local storage crash)
    if (file.size > 1.5 * 1024 * 1024) {
      Swal.fire({
        icon: "warning",
        title: "File Too Large",
        text: "Please select a file smaller than 1.5MB for this demo.",
      });
      return;
    }

    Swal.fire({
      title: "Processing...",
      text: "Reading file data",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const reader = new FileReader();
    reader.onload = function (event) {
      const fileData = event.target.result;

      const newAd = {
        id: "ad-" + Date.now(),
        campaign: campaign,
        format: format,
        views: 0,
        status: "Active",
        mediaData: fileData,
      };

      const ads = getAds();
      ads.unshift(newAd);
      saveAds(ads);

      renderTable();
      closeModal();

      Swal.fire({
        icon: "success",
        title: "Ad Created",
        text: `"${campaign}" has been successfully added.`,
        confirmButtonColor: "#b8721f",
      });
    };

    reader.readAsDataURL(file);
  });

  // --- Table Action Logic (Pause, Resume, Remove) ---
  tableBody.addEventListener("click", function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;

    const id = btn.getAttribute("data-id");
    const ads = getAds();
    const adIndex = ads.findIndex((a) => a.id === id);

    if (adIndex === -1) return;
    const ad = ads[adIndex];

    // --- PAUSE ---
    if (btn.classList.contains("pause-btn")) {
      Swal.fire({
        title: "Pause Campaign?",
        text: `Are you sure you want to pause "${ad.campaign}"?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, pause",
        confirmButtonColor: "#b8721f",
        cancelButtonColor: "#6b6680",
      }).then((result) => {
        if (result.isConfirmed) {
          ads[adIndex].status = "Paused";
          saveAds(ads);
          renderTable();
          Swal.fire({
            icon: "success",
            title: "Paused",
            text: "The campaign has been paused.",
            confirmButtonColor: "#b8721f",
          });
        }
      });
    }

    // --- RESUME ---
    if (btn.classList.contains("resume-btn")) {
      ads[adIndex].status = "Active";
      saveAds(ads);
      renderTable();
      Swal.fire({
        icon: "success",
        title: "Resumed",
        text: "The campaign is now running again.",
        confirmButtonColor: "#b8721f",
      });
    }

    // --- REMOVE ---
    if (btn.classList.contains("remove-btn")) {
      Swal.fire({
        title: "Remove Campaign?",
        text: `Are you sure you want to permanently delete "${ad.campaign}"?`,
        icon: "error",
        showCancelButton: true,
        confirmButtonText: "Yes, remove",
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#6b6680",
      }).then((result) => {
        if (result.isConfirmed) {
          ads.splice(adIndex, 1);
          saveAds(ads);
          renderTable();
          Swal.fire({
            icon: "success",
            title: "Removed",
            text: "The campaign has been deleted.",
            confirmButtonColor: "#b8721f",
          });
        }
      });
    }
  });
});
