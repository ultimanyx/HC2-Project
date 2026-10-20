document.addEventListener("DOMContentLoaded", function () {
  const tableBody = document.getElementById("reportedTableBody");

  // Modal Elements
  const modalOverlay = document.getElementById("viewReportModalOverlay");
  const modalCloseBtn = document.getElementById("viewReportModalClose");
  const modalCancelBtn = document.getElementById("modalCloseBtn");
  const modalActionBtn = document.getElementById("modalActionBtn");
  const modalDismissBtn = document.getElementById("modalDismissBtn");

  const modalNovel = document.getElementById("modalNovel");
  const modalAuthor = document.getElementById("modalAuthor");
  const modalUser = document.getElementById("modalUser");
  const modalReason = document.getElementById("modalReason");
  const modalDetails = document.getElementById("modalDetails");
  const appealReasonGroup = document.getElementById("appealReasonGroup");
  const modalAppealReason = document.getElementById("modalAppealReason");

  // Bulk Actions & Filter Elements
  const selectAllCheckbox = document.getElementById("selectAllCheckbox");
  const bulkActionBar = document.getElementById("bulkActionBar");
  const bulkCount = document.getElementById("bulkCount");
  const bulkWarnBtn = document.getElementById("bulkWarnBtn");
  const bulkArchiveBtn = document.getElementById("bulkArchiveBtn");
  const bulkResolveBtn = document.getElementById("bulkResolveBtn");
  const statusFilter = document.getElementById("status-filter");
  const reasonFilter = document.getElementById("reason-filter");
  const searchInput = document.getElementById("search");

  let activeRow = null;

  // --- 1. Helper Functions ---
  function saveToAuthorDashboard(title, author, reason, status) {
    const authorStatusData = {
      status: status,
      novelTitle: title,
      authorName: author,
      reportReason: reason,
      date: new Date().toLocaleDateString(),
    };
    localStorage.setItem(
      "author_alert_status",
      JSON.stringify(authorStatusData),
    );
  }

  function updateRowStatus(row, status, keepActions = false) {
    const badge = row.querySelector(".badge");
    if (badge) {
      badge.className = `badge ${status.toLowerCase()}`;
      badge.textContent = status;
    }

    const actionGroup = row.querySelector(".action-group");
    if (actionGroup && !keepActions) {
      actionGroup.innerHTML = `<span class="status-processed">Processed</span>`;
    }
  }

  // --- 2. Check for Author Appeals on Load ---
  function checkForAppeals() {
    const savedAlert = localStorage.getItem("author_alert_status");
    if (!savedAlert) return;

    const data = JSON.parse(savedAlert);
    if (data.status === "appealed") {
      const rows = tableBody.querySelectorAll("tr");
      rows.forEach((row) => {
        const title = row.cells[1].innerText.trim();
        if (title === data.novelTitle) {
          updateRowStatus(row, "Appealed", true);
          row.dataset.appealReason = data.appealReason || "";

          const actionGroup = row.querySelector(".action-group");
          if (actionGroup) {
            actionGroup.innerHTML = `
              <button class="btn btn-primary btn-sm view-btn" data-details="The author has filed an appeal.">Review Appeal</button>
            `;
          }
        }
      });
    }
  }

  checkForAppeals();

  // --- 3. Search & Filter Logic ---
  function filterTable() {
    const query = searchInput.value.toLowerCase();
    const status = statusFilter.value.toLowerCase();
    const reason = reasonFilter.value.toLowerCase();
    const rows = tableBody.querySelectorAll("tr");

    rows.forEach((row) => {
      const rowText = row.innerText.toLowerCase();
      const badge = row.querySelector(".badge");
      const badgeText = badge ? badge.innerText.toLowerCase() : "";
      const rowReason = row.cells[3]
        ? row.cells[3].innerText.toLowerCase()
        : "";

      const matchesSearch = rowText.includes(query);
      const matchesStatus = status === "all" || badgeText.includes(status);
      const matchesReason = reason === "all" || rowReason.includes(reason);

      if (matchesSearch && matchesStatus && matchesReason) {
        row.style.display = "";
      } else {
        row.style.display = "none";
        const cb = row.querySelector(".row-checkbox");
        if (cb) cb.checked = false;
      }
    });
    updateBulkBar();
  }

  if (searchInput) searchInput.addEventListener("input", filterTable);
  if (statusFilter) statusFilter.addEventListener("change", filterTable);
  if (reasonFilter) reasonFilter.addEventListener("change", filterTable);

  // --- 4. Checkbox & Bulk Action Logic ---
  function updateBulkBar() {
    const checked = tableBody.querySelectorAll(".row-checkbox:checked");
    bulkCount.textContent = checked.length;
    if (checked.length > 0) {
      bulkActionBar.classList.add("active");
    } else {
      bulkActionBar.classList.remove("active");
      if (selectAllCheckbox) selectAllCheckbox.checked = false;
    }
  }

  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", function () {
      const isChecked = this.checked;
      const visibleCheckboxes = Array.from(
        tableBody.querySelectorAll(".row-checkbox"),
      ).filter((cb) => cb.closest("tr").style.display !== "none");
      visibleCheckboxes.forEach((cb) => (cb.checked = isChecked));
      updateBulkBar();
    });
  }

  if (tableBody) {
    tableBody.addEventListener("change", function (e) {
      if (e.target.classList.contains("row-checkbox")) updateBulkBar();
    });
  }

  function handleBulkAction(action) {
    const checkedCheckboxes = tableBody.querySelectorAll(
      ".row-checkbox:checked",
    );

    Swal.fire({
      title: `Confirm Bulk ${action}`,
      text: `Are you sure you want to mark ${checkedCheckboxes.length} reports as ${action}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${action}`,
      confirmButtonColor: action === "Resolve" ? "#3f7d4f" : "#dc2626",
    }).then((result) => {
      if (result.isConfirmed) {
        checkedCheckboxes.forEach((cb) => {
          const row = cb.closest("tr");
          const title = row.cells[1].innerText.trim();
          const author = row.cells[2].innerText.trim();
          const reason = row.cells[3].innerText.trim();

          updateRowStatus(row, action);
          cb.checked = false;

          if (action !== "Resolve") {
            saveToAuthorDashboard(title, author, reason, action.toLowerCase());
          }
        });

        updateBulkBar();
        filterTable();

        // System Feedback - CENTERED
        Swal.fire({
          icon: "success",
          title: "Success",
          text: `${checkedCheckboxes.length} reports ${action.toLowerCase()}d`,
          showConfirmButton: false,
          timer: 2000,
        });
      }
    });
  }

  if (bulkWarnBtn)
    bulkWarnBtn.addEventListener("click", () => handleBulkAction("Warn"));
  if (bulkArchiveBtn)
    bulkArchiveBtn.addEventListener("click", () => handleBulkAction("Archive"));
  if (bulkResolveBtn)
    bulkResolveBtn.addEventListener("click", () => handleBulkAction("Resolve"));

  // --- 5. Quick Inline Action (Warn) ---
  if (tableBody) {
    tableBody.addEventListener("click", function (e) {
      const warnBtn = e.target.closest(".warn-btn");
      if (!warnBtn) return;

      const row = warnBtn.closest("tr");
      const title = row.cells[1].innerText.trim();
      const author = row.cells[2].innerText.trim();
      const reason = row.cells[3].innerText.trim();

      Swal.fire({
        title: "Warn Author?",
        text: `Issue a warning for "${title}"?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, warn",
        confirmButtonColor: "#b8721f",
      }).then((result) => {
        if (result.isConfirmed) {
          updateRowStatus(row, "Warned");
          saveToAuthorDashboard(title, author, reason, "warn");

          // System Feedback - CENTERED
          Swal.fire({
            icon: "success",
            title: "Warning Issued",
            text: "A warning has been sent to the author.",
            showConfirmButton: false,
            timer: 2000,
          });

          filterTable();
        }
      });
    });
  }

  // --- 6. View Modal Logic ---
  if (tableBody) {
    tableBody.addEventListener("click", function (e) {
      const btn = e.target.closest(".view-btn");
      if (!btn) return;

      const row = btn.closest("tr");
      if (!row) return;

      activeRow = row;

      const title = row.cells[1].innerText.trim();
      const author = row.cells[2].innerText.trim();
      const reason = row.cells[3].innerText.trim();
      const user = row.cells[4].innerText.trim();
      const details =
        btn.getAttribute("data-details") || "No additional details provided.";

      const isAppealed = row.querySelector(".badge").textContent === "Appealed";
      const appealReason = row.dataset.appealReason;

      modalNovel.textContent = title;
      modalAuthor.textContent = author;
      modalReason.textContent = reason;
      modalUser.textContent = user;
      modalDetails.textContent = details;

      if (isAppealed && appealReason) {
        appealReasonGroup.style.display = "flex";
        modalAppealReason.textContent = appealReason;
      } else {
        appealReasonGroup.style.display = "none";
      }

      modalOverlay.classList.add("active");
      modalOverlay.setAttribute("aria-hidden", "false");
    });
  }

  function closeModal() {
    modalOverlay.classList.remove("active");
    modalOverlay.setAttribute("aria-hidden", "true");
    activeRow = null;
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);
  if (modalCancelBtn) modalCancelBtn.addEventListener("click", closeModal);

  if (modalOverlay) {
    modalOverlay.addEventListener("click", function (e) {
      if (e.target === modalOverlay) closeModal();
    });
  }

  // --- 7. Modal Take Action / Dismiss ---
  if (modalActionBtn) {
    modalActionBtn.addEventListener("click", function () {
      if (!activeRow) return;
      const title = modalNovel.textContent;
      const author = modalAuthor.textContent;
      const reason = modalReason.textContent;

      const isAppealed =
        activeRow.querySelector(".badge").textContent === "Appealed";

      let options = {
        archive: "Archive Novel",
        warn: "Warn Author",
        ban: "Ban Author",
      };

      if (isAppealed) {
        options = {
          accept_appeal: "Accept Appeal (Restore Novel)",
          reject_appeal: "Reject Appeal (Uphold Penalty)",
        };
      }

      Swal.fire({
        title: isAppealed ? "Review Appeal" : "Take Action",
        text: `What would you like to do with "${title}"?`,
        input: "select",
        inputOptions: options,
        inputPlaceholder: "Select an action",
        showCancelButton: true,
        confirmButtonText: "Apply Action",
        confirmButtonColor: isAppealed ? "#3f7d4f" : "#dc2626",
        cancelButtonColor: "#6b6680",
        inputValidator: (value) => {
          if (!value) return "You need to choose an action!";
        },
      }).then((result) => {
        if (result.isConfirmed) {
          const action = result.value;

          if (action === "accept_appeal" || action === "reject_appeal") {
            localStorage.removeItem("author_alert_status");
            updateRowStatus(activeRow, "Resolved");
            closeModal();

            // System Feedback - CENTERED
            Swal.fire({
              icon: "success",
              title: "Appeal Reviewed",
              text:
                action === "accept_appeal"
                  ? "The appeal has been accepted. The novel has been restored."
                  : "The appeal has been rejected. The penalty is upheld.",
            });
            filterTable();
            return;
          }

          const formattedStatus =
            action.charAt(0).toUpperCase() + action.slice(1);

          updateRowStatus(activeRow, formattedStatus);
          saveToAuthorDashboard(title, author, reason, action);

          closeModal();

          // System Feedback - CENTERED
          Swal.fire({
            icon: "success",
            title: "Action Applied!",
            text: `The novel has been ${formattedStatus.toLowerCase()}d.`,
          });

          filterTable();
        }
      });
    });
  }

  if (modalDismissBtn) {
    modalDismissBtn.addEventListener("click", function () {
      if (!activeRow) return;

      Swal.fire({
        title: "Resolve Report?",
        text: "Are you sure you want to dismiss this report?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, resolve",
        confirmButtonColor: "#3f7d4f",
        cancelButtonColor: "#6b6680",
      }).then((result) => {
        if (result.isConfirmed) {
          updateRowStatus(activeRow, "Resolved");
          localStorage.removeItem("author_alert_status");

          closeModal();

          // System Feedback - CENTERED
          Swal.fire({
            icon: "success",
            title: "Report Resolved",
            text: "The report has been successfully dismissed.",
            showConfirmButton: false,
            timer: 2000,
          });

          filterTable();
        }
      });
    });
  }
});
