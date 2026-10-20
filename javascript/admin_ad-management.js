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

  const STORAGE_KEY = "novelNestAds";

  // --- 1. Initial Data (Matches your HTML) ---
  const defaultAds = [
    {
      id: "ad-1",
      campaign: "Nestle Milo Drink",
      format: "Video",
      views: 1240000,
      status: "Active",
      mediaData: null,
    },
    {
      id: "ad-2",
      campaign: "Datu Puti",
      format: "Video",
      views: 2100000,
      status: "Active",
      mediaData: null,
    },
    {
      id: "ad-3",
      campaign: "Scatter67",
      format: "Video",
      views: 980000,
      status: "Paused",
      mediaData: null,
    },
    {
      id: "ad-4",
      campaign: "CTV Holiday Special",
      format: "Banner",
      views: 620000,
      status: "Completed",
      mediaData: null,
    },
    {
      id: "ad-5",
      campaign: "Coca Cola Coke",
      format: "Banner",
      views: 450000,
      status: "Active",
      mediaData: null,
    },
  ];

  // --- 2. State Management ---
  function getAds() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Save defaults if nothing exists
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
        text: "The video/image file is too large for browser storage. Please try a smaller file or implement a backend server for uploads.",
      });
    }
  }

  // --- 3. Render Table & Stats ---
  function renderTable() {
    const ads = getAds();
    tableBody.innerHTML = "";

    let activeCount = 0;
    let pausedCount = 0;

    ads.forEach((ad) => {
      if (ad.status === "Active") activeCount++;
      if (ad.status === "Paused") pausedCount++;

      // Format views with commas
      const formattedViews = ad.views.toLocaleString();

      // Determine which buttons to show based on status
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

      // Always show Remove
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

    // Update Stats
    statTotal.textContent = ads.length;
    statActive.textContent = activeCount;
    statPaused.textContent = pausedCount;
  }

  // Initial Render
  renderTable();

  // --- 4. Modal Logic ---
  function openModal() {
    modal.classList.add("active");
    addAdForm.reset();
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

  // --- 5. Add New Ad Logic ---
  addAdForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const campaign = document.getElementById("campaignName").value;
    const format = document.getElementById("adFormat").value;
    const fileInput = document.getElementById("adFile");
    const file = fileInput.files[0];

    if (!file) return;

    // Check file size (Local Storage limits ~5MB total, so limit to ~3MB per file)
    if (file.size > 3 * 1024 * 1024) {
      Swal.fire({
        icon: "warning",
        title: "File Too Large",
        text: "Please select a file smaller than 3MB for this demo.",
      });
      return;
    }

    // Show loading state
    Swal.fire({
      title: "Processing...",
      text: "Reading file data",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    // Read file as Data URL (Base64) to simulate saving
    const reader = new FileReader();
    reader.onload = function (event) {
      const fileData = event.target.result;

      const newAd = {
        id: "ad-" + Date.now(),
        campaign: campaign,
        format: format,
        views: 0,
        status: "Active",
        mediaData: fileData, // Here is where the actual image/video data is stored
      };

      /*
        ====================================================================
        BACKEND INTEGRATION NOTE:
        Browsers cannot save directly to /mnt/Storage/Coding/HC2 Project/advertisement.
        To do that, you would send this file to a server using FormData:
        
        const formData = new FormData();
        formData.append("file", file);
        formData.append("campaign", campaign);
        
        fetch("/api/upload-ad", {
          method: "POST",
          body: formData
        }).then(...)
        ====================================================================
      */

      const ads = getAds();
      ads.unshift(newAd); // Add to top of list
      saveAds(ads);

      renderTable();
      closeModal();

      // System Feedback - CENTERED
      Swal.fire({
        icon: "success",
        title: "Ad Created",
        text: `"${campaign}" has been successfully added and is now active.`,
        confirmButtonColor: "#b8721f",
      });
    };

    reader.readAsDataURL(file);
  });

  // --- 6. Table Action Logic (Pause, Resume, Remove) ---
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
