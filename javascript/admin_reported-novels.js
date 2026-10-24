document.addEventListener("DOMContentLoaded", function () {
  const REPORT_KEY = "chapterReports";
  const NOVELS_KEY = "novels";

  const tableBody = document.getElementById("reportedTableBody");
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

  function getReports() {
    try {
      return JSON.parse(localStorage.getItem(REPORT_KEY) || "[]");
    } catch {
      return [];
    }
  }
  function saveReports(reports) {
    localStorage.setItem(REPORT_KEY, JSON.stringify(reports));
  }
  function getNovels() {
    try {
      return JSON.parse(localStorage.getItem(NOVELS_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveToAuthorDashboard(
    title,
    author,
    reason,
    status,
    chapter,
    details,
  ) {
    const authorStatusData = {
      status: status,
      novelTitle: title,
      authorName: author,
      reportReason: reason,
      chapter: chapter || "Unknown",
      reportDetails: details || "No additional details provided.",
      date: new Date().toLocaleDateString(),
    };
    localStorage.setItem(
      "author_alert_status",
      JSON.stringify(authorStatusData),
    );
  }

  function escapeHtml(str) {
    return String(str ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }

  function reasonClass(reason) {
    const r = (reason || "").toLowerCase();
    if (r.includes("broken")) return "reason-spam";
    if (r.includes("missing")) return "reason-plagiarism";
    if (r.includes("wrong")) return "reason-violence";
    if (r.includes("inappropriate")) return "reason-inappropriate";
    if (r.includes("other")) return "reason-default";
    return "reason-default";
  }

  function renderTable() {
    if (!tableBody) return;
    const reports = getReports();
    const novels = getNovels();
    tableBody.innerHTML = "";

    if (reports.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 36px; color: var(--muted-foreground);">No reported novels at the moment.</td></tr>`;
      updateBulkBar();
      return;
    }

    reports.sort((a, b) => new Date(b.date) - new Date(a.date));

    reports.forEach((report) => {
      const book = novels.find((n) => String(n.id) === String(report.bookId));
      const authorName =
        report.author || (book && book.author) || "Unknown Author";
      const bookTitle = report.bookTitle || (book ? book.title : report.bookId);
      const reportedBy = report.reportedBy || "Anonymous Reader";

      const chapterText =
        `${report.chapter || ""}${report.chapterTitle ? ": " + report.chapterTitle : ""}`.trim();
      const displayTitle = `${bookTitle} - ${chapterText}`;
      const initial = (reportedBy || "?").trim().charAt(0).toUpperCase() || "?";
      const rClass = reasonClass(report.reason);

      let statusText = report.status || "Pending";
      if (statusText === "Resolve") statusText = "Resolved";
      const statusClass = statusText.toLowerCase();

      const tr = document.createElement("tr");
      tr.dataset.id = report.id;
      tr.dataset.bookId = report.bookId;
      tr.dataset.bookTitle = bookTitle;
      tr.dataset.author = authorName;
      tr.dataset.chapter = report.chapter || "";
      tr.dataset.displayTitle = displayTitle;
      tr.dataset.reason = report.reason || "";
      tr.dataset.reportedBy = reportedBy;
      tr.dataset.status = statusText;
      if (report.appealReason) tr.dataset.appealReason = report.appealReason;

      tr.innerHTML = `
        <td><input type="checkbox" class="row-checkbox" /></td>
        <td>
          <div class="novel-cell">
            <span class="novel-title" title="${escapeHtml(bookTitle)}">${escapeHtml(bookTitle)}</span>
            <span class="novel-meta" title="${escapeHtml(displayTitle)}">${escapeHtml(chapterText || "—")} <span class="dot">·</span> ${escapeHtml(authorName)}</span>
          </div>
        </td>
        <td><span class="reason-pill ${rClass}" title="${escapeHtml(report.reason)}">${escapeHtml(report.reason)}</span></td>
        <td><span class="reporter"><span class="reporter-avatar">${escapeHtml(initial)}</span><span class="reporter-name" title="${escapeHtml(reportedBy)}">${escapeHtml(reportedBy)}</span></span></td>
        <td><span class="badge ${statusClass}">${escapeHtml(statusText)}</span></td>
        <td>
          <div class="action-group">
            <button class="btn btn-primary btn-sm btn-view view-btn" data-details="${escapeHtml(report.details)}">View</button>
            <button class="icon-btn warn-btn" title="Warn author" aria-label="Warn author">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </button>
          </div>
        </td>
      `;

      if (statusText !== "Pending") {
        tr.querySelector(".action-group").innerHTML =
          `<span class="status-processed">Processed</span>`;
      }
      tableBody.appendChild(tr);
    });
    filterTable();
  }

  function updateStatus(id, newStatus) {
    const reports = getReports();
    const reportIndex = reports.findIndex((r) => String(r.id) === String(id));
    if (reportIndex === -1) return;

    let finalStatus = newStatus;
    let isWarn = false;
    const report = reports[reportIndex];

    if (newStatus === "Warn" || newStatus === "Warned") {
      finalStatus = "Resolved";
      isWarn = true;
      saveToAuthorDashboard(
        report.bookTitle || "Unknown Novel",
        report.author || "Unknown Author",
        report.reason || "Guidelines violation",
        "warn",
        report.chapter,
        report.details,
      );
    } else if (newStatus === "Resolve" || newStatus === "Resolved") {
      finalStatus = "Resolved";
    } else if (newStatus !== "Resolved") {
      saveToAuthorDashboard(
        report.bookTitle || "Unknown Novel",
        report.author || "Unknown Author",
        report.reason || "Guidelines violation",
        newStatus.toLowerCase(),
        report.chapter,
        report.details,
      );
    }

    report.status = finalStatus;
    saveReports(reports);

    const row = tableBody.querySelector(`tr[data-id="${id}"]`);
    if (!row) return;

    row.dataset.status = finalStatus;
    const badge = row.querySelector(".badge");
    if (badge) {
      badge.className = `badge ${finalStatus.toLowerCase()}`;
      badge.textContent = finalStatus;
    }
    row.querySelector(".action-group").innerHTML =
      `<span class="status-processed">Processed</span>`;
    if (isWarn || finalStatus === "Resolved") row.style.display = "none";

    filterTable();
    updateBulkBar();
  }

  function filterTable() {
    if (!tableBody) return;
    const query = searchInput ? searchInput.value.toLowerCase() : "";
    const status = statusFilter ? statusFilter.value.toLowerCase() : "all";
    const reason = reasonFilter ? reasonFilter.value.toLowerCase() : "all";
    const rows = tableBody.querySelectorAll("tr");

    rows.forEach((row) => {
      if (row.cells.length < 6) return;
      const rowText = row.innerText.toLowerCase();
      const rowStatus = (row.dataset.status || "").toLowerCase();
      const rowReason = (row.dataset.reason || "").toLowerCase();
      const isProcessed = [
        "resolved",
        "resolve",
        "warned",
        "archived",
        "banned",
      ].includes(rowStatus);
      const matchesSearch = rowText.includes(query);

      let matchesStatus = false;
      if (status === "all") matchesStatus = !isProcessed;
      else if (status === "resolved")
        matchesStatus = rowStatus === "resolved" || rowStatus === "resolve";
      else matchesStatus = rowStatus === status;

      const matchesReason = reason === "all" || rowReason.includes(reason);

      if (matchesSearch && matchesStatus && matchesReason)
        row.style.display = "";
      else {
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

  function updateBulkBar() {
    const checked = tableBody.querySelectorAll(".row-checkbox:checked");
    bulkCount.textContent = checked.length;
    if (checked.length > 0) bulkActionBar.classList.add("active");
    else {
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
    if (checkedCheckboxes.length === 0) return;

    Swal.fire({
      title: `Confirm Bulk ${action}`,
      text: `Are you sure you want to mark ${checkedCheckboxes.length} reports as ${action}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${action}`,
      confirmButtonColor: action === "Resolve" ? "#3f7d4f" : "#dc2626",
    }).then((result) => {
      if (!result.isConfirmed) return;
      checkedCheckboxes.forEach((cb) => {
        const row = cb.closest("tr");
        updateStatus(row.dataset.id, action);
        cb.checked = false;
      });
      updateBulkBar();
      Swal.fire({
        icon: "success",
        title: "Success",
        text: `${checkedCheckboxes.length} reports ${action.toLowerCase()}d`,
        showConfirmButton: false,
        timer: 2000,
      });
    });
  }

  if (bulkWarnBtn)
    bulkWarnBtn.addEventListener("click", () => handleBulkAction("Warn"));
  if (bulkArchiveBtn)
    bulkArchiveBtn.addEventListener("click", () => handleBulkAction("Archive"));
  if (bulkResolveBtn)
    bulkResolveBtn.addEventListener("click", () => handleBulkAction("Resolve"));

  if (tableBody) {
    tableBody.addEventListener("click", function (e) {
      const warnBtn = e.target.closest(".warn-btn");
      if (!warnBtn) return;
      const row = warnBtn.closest("tr");
      const id = row.dataset.id;
      const title = row.dataset.bookTitle || "this novel";

      Swal.fire({
        title: "Warn Author?",
        text: `Issue a warning for "${title}"?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, warn",
        confirmButtonColor: "#b8721f",
      }).then((result) => {
        if (!result.isConfirmed) return;
        updateStatus(id, "Warned");
        Swal.fire({
          icon: "success",
          title: "Warning Issued",
          text: "A warning has been sent to the author.",
          showConfirmButton: false,
          timer: 2000,
        });
      });
    });
  }

  if (tableBody) {
    tableBody.addEventListener("click", function (e) {
      const btn = e.target.closest(".view-btn");
      if (!btn) return;
      const row = btn.closest("tr");
      if (!row) return;

      activeRow = row;
      const title = row.dataset.displayTitle || row.dataset.bookTitle || "";
      const author = row.dataset.author || "";
      const reason = row.dataset.reason || "";
      const user = row.dataset.reportedBy || "";
      const details =
        btn.getAttribute("data-details") || "No additional details provided.";

      const badge = row.querySelector(".badge");
      const isAppealed = badge && badge.textContent === "Appealed";
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

  if (modalActionBtn) {
    modalActionBtn.addEventListener("click", function () {
      if (!activeRow) return;
      const id = activeRow.dataset.id;
      const title = modalNovel.textContent;

      let options = {
        archive: "Archive Novel",
        warn: "Warn Author",
        ban: "Ban Author",
      };
      const isAppealed =
        activeRow.querySelector(".badge").textContent === "Appealed";
      if (isAppealed)
        options = {
          accept_appeal: "Accept Appeal (Restore Novel)",
          reject_appeal: "Reject Appeal (Uphold Penalty)",
        };

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
        if (!result.isConfirmed) return;
        const action = result.value;

        if (action === "accept_appeal" || action === "reject_appeal") {
          localStorage.removeItem("author_alert_status");
          updateStatus(id, "Resolved");
          closeModal();
          Swal.fire({
            icon: "success",
            title: "Appeal Reviewed",
            text:
              action === "accept_appeal"
                ? "The appeal has been accepted. The novel has been restored."
                : "The appeal has been rejected. The penalty is upheld.",
          });
          return;
        }

        const formattedStatus =
          action.charAt(0).toUpperCase() + action.slice(1);
        updateStatus(id, formattedStatus);
        closeModal();
        Swal.fire({
          icon: "success",
          title: "Action Applied!",
          text: `The report has been marked as ${formattedStatus}.`,
        });
      });
    });
  }

  if (modalDismissBtn) {
    modalDismissBtn.addEventListener("click", function () {
      if (!activeRow) return;
      const id = activeRow.dataset.id;
      Swal.fire({
        title: "Resolve Report?",
        text: "Are you sure you want to dismiss this report?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, resolve",
        confirmButtonColor: "#3f7d4f",
        cancelButtonColor: "#6b6680",
      }).then((result) => {
        if (!result.isConfirmed) return;
        updateStatus(id, "Resolved");
        localStorage.removeItem("author_alert_status");
        closeModal();
        Swal.fire({
          icon: "success",
          title: "Report Resolved",
          text: "The report has been successfully dismissed.",
          showConfirmButton: false,
          timer: 2000,
        });
      });
    });
  }

  renderTable();
});
