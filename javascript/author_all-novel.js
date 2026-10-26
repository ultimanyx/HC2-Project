document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";
  const tbody = document.querySelector(".table-card tbody");
  if (!tbody) return;

  // ==========================================
  // HELPERS
  // ==========================================
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

  function labelForStatus(status) {
    return (
      {
        published: "Ongoing",
        completed: "Completed",
        draft: "Draft",
        pending: "Pending Review",
        hiatus: "On Hiatus",
      }[status] || "Ongoing"
    );
  }

  function badgeClassFor(label) {
    return (
      {
        Ongoing: "active",
        Completed: "completed",
        Draft: "draft",
        "Pending Review": "pending",
        "On Hiatus": "paused",
      }[label] || "active"
    );
  }

  // ==========================================
  // SEED HARDCODED DRAFT
  // ==========================================
  function seedHardcodedDraft() {
    let novels = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    let changed = false;

    const filteredNovels = novels.filter((n) => {
      const isDuplicate =
        n.title.toLowerCase() === "the lost kingdom" &&
        String(n.id) !== "draft-seed-0";

      if (isDuplicate) {
        changed = true;
        return false;
      }
      return true;
    });

    const existingIndex = filteredNovels.findIndex(
      (n) => String(n.id) === "draft-seed-0",
    );

    if (existingIndex === -1) {
      filteredNovels.push({
        id: "draft-seed-0",
        title: "The Lost Kingdom",
        subtitle: "A throne unclaimed",
        genre: "Fantasy",
        synopsis:
          "An heir believed dead. A throne left empty. A kingdom on the brink of war. The Lost Kingdom is the first book in an epic fantasy saga.",
        coverImage: "../image/lostcrown.jpeg",
        status: "draft",
        author: "Sarah J.",
        chapters: [
          {
            number: 1,
            title: "Prologue: The Empty Throne",
            status: "draft",
            words: 1120,
            lastUpdated: Date.now() - 86400000,
          },
          {
            number: 2,
            title: "A Kingdom Without a King",
            status: "draft",
            words: 1890,
            lastUpdated: Date.now() - 172800000,
          },
          {
            number: 3,
            title: "The Broken Oath",
            status: "draft",
            words: 2340,
            lastUpdated: Date.now() - 259200000,
          },
          {
            number: 4,
            title: "Whispers in the Dark",
            status: "draft",
            words: 0,
            lastUpdated: Date.now(),
          },
        ],
        reads: 0,
        rating: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastEdited: Date.now(),
      });
      changed = true;
    }

    if (changed)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredNovels));
  }

  // ==========================================
  // SCRAPE HARDCODED DATA FROM HTML
  // ==========================================
  function scrapeHardcodedDracula() {
    const hardcodedRow = tbody.querySelector('tr[data-hardcoded="true"]');
    if (!hardcodedRow) return null;

    const title =
      hardcodedRow.querySelector("td:nth-child(1)")?.textContent.trim() ||
      "Dracula";
    const statusLabel =
      hardcodedRow.querySelector("td:nth-child(2) span")?.textContent.trim() ||
      "Ongoing";
    const genre =
      hardcodedRow.querySelector("td:nth-child(3)")?.textContent.trim() ||
      "Horror";
    const readsStr =
      hardcodedRow.querySelector("td:nth-child(5)")?.textContent.trim() || "0";
    const ratingStr =
      hardcodedRow.querySelector("td:nth-child(6)")?.textContent.trim() || "0";

    const reads = parseInt(readsStr.replace(/,/g, ""), 10) || 0;
    const rating = parseFloat(ratingStr) || 0;

    const statusMap = {
      Ongoing: "published",
      Completed: "completed",
      Draft: "draft",
      "Pending Review": "pending",
      "On Hiatus": "hiatus",
    };

    return {
      id: "seed-0",
      title: title,
      author: "Bram Stoker",
      genre: genre,
      coverImage:
        "../books/Horror(1)/Dracula by Bram Stoker/dracula-9781471141621_lg.jpg",
      status: statusMap[statusLabel] || "published",
      chapters: [
        {
          number: 1,
          title: "Jonathan Harker's Journal",
          status: "published",
          words: 4120,
          lastUpdated: Date.now(),
        },
        {
          number: 2,
          title: "The Blood is the Life",
          status: "published",
          words: 3850,
          lastUpdated: Date.now(),
        },
        {
          number: 3,
          title: "The Grey Man",
          status: "published",
          words: 3210,
          lastUpdated: Date.now(),
        },
      ],
      reads: reads,
      rating: rating,
      systemSeeded: false,
      archived: false,
    };
  }

  // Run the seed function before loading
  seedHardcodedDraft();

  function loadNovels() {
    let allNovels = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    let dracula = allNovels.find((n) => String(n.id) === "seed-0");
    const scrapedDracula = scrapeHardcodedDracula();

    if (!dracula) {
      if (scrapedDracula) {
        allNovels.push(scrapedDracula);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allNovels));
      }
    } else if (scrapedDracula) {
      // Only sync the visual table fields.
      dracula.title = scrapedDracula.title;
      dracula.genre = scrapedDracula.genre;
      dracula.status = "published";
      dracula.systemSeeded = false;

      // 🚨 THE FIX: Delete these fields so the View page always falls back to HTML text
      delete dracula.synopsis;
      delete dracula.subtitle;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(allNovels));
    }

    return allNovels
      .filter((n) => !n.systemSeeded)
      .map((n) => ({
        ...n,
        chapters: Array.isArray(n.chapters)
          ? n.chapters.filter((c) => !c.archived).length
          : 0,
        reads: Number(n.reads) || 0,
        rating: n.rating != null ? Number(n.rating) : null,
        statusLabel: labelForStatus(n.status),
        archived: !!n.archived,
      }));
  }

  function saveNovels(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function updateStats() {
    const list = loadNovels().filter((n) => !n.archived);
    const pending = list.filter((n) => n.status === "pending").length;
    const totalEl = document.getElementById("stat-total");
    const pendingEl = document.getElementById("stat-pending");
    if (totalEl) totalEl.textContent = list.length;
    if (pendingEl) pendingEl.textContent = pending;
  }

  // ==========================================
  // RENDER NOVEL ROWS
  // ==========================================
  function renderRows(list) {
    const hardcodedRow = tbody.querySelector('tr[data-hardcoded="true"]');

    Array.from(tbody.querySelectorAll("tr")).forEach((tr) => {
      if (tr !== hardcodedRow) tr.remove();
    });

    const draculaInList = list.some((n) => String(n.id) === "seed-0");
    if (hardcodedRow) {
      hardcodedRow.style.display = draculaInList ? "" : "none";
    }

    const others = list.filter((n) => String(n.id) !== "seed-0");

    if (others.length === 0 && !draculaInList) {
      const emptyRow = document.createElement("tr");
      emptyRow.innerHTML = `
        <td colspan="7" style="text-align:center;padding:28px;color:var(--muted-foreground);">
          No novels match your filters.
        </td>`;
      tbody.appendChild(emptyRow);
      return;
    }

    others.forEach((n) => {
      const ratingCell = n.rating
        ? `<img src="../icons/star-fill.svg" class="star-rating" alt="star"> ${n.rating}`
        : "";
      const readsCell = n.reads ? n.reads.toLocaleString() : "";
      const badgeCls = badgeClassFor(n.statusLabel);

      const idStr = String(n.id);
      const isDemo =
        /seed-/i.test(idStr) &&
        !["seed-0", "seed-1", "draft-seed-0"].includes(idStr);

      let targetUrl = `author_view-novel.html?id=${encodeURIComponent(n.id)}`;
      let btnText = "View";

      if (n.status === "draft") {
        targetUrl = `author_edit-draft.html?id=${encodeURIComponent(n.id)}`;
        btnText = "View";
      }

      const viewCell = isDemo
        ? `<span class="btn btn-primary btn-sm" role="button" aria-disabled="true" title="Demo row" style="cursor:default;">${btnText}</span>`
        : `<a class="btn btn-primary btn-sm view-novel-btn" href="${targetUrl}">${btnText}</a>`;

      const isPending = n.status === "pending";
      const archiveCell = isPending
        ? `<button class="btn btn-sm" disabled title="Cannot archive while under admin review" style="opacity:.5;cursor:not-allowed;">Archive</button>`
        : `<button class="btn btn-sm btn-danger archive-novel-btn" data-novel-id="${n.id}">Archive</button>`;

      const tr = document.createElement("tr");
      tr.dataset.id = n.id;
      tr.innerHTML = `
        <td><strong>${escapeHtml(n.title)}</strong></td>
        <td><span class="badge ${badgeCls}">${escapeHtml(n.statusLabel)}</span></td>
        <td>${escapeHtml(n.genre || "—")}</td>
        <td>${n.chapters ?? 0}</td>
        <td>${readsCell}</td>
        <td>${ratingCell}</td>
        <td>
          ${viewCell}
          ${archiveCell}
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // ==========================================
  // REPORTED NOVELS PANEL
  // ==========================================
  function renderReportedPanel() {
    const reportedList = document.getElementById("reportedList");
    if (!reportedList) return;

    let listHtml = "";
    let alertData = null;

    const savedAlert = localStorage.getItem("author_alert_status");
    if (savedAlert) {
      try {
        alertData = JSON.parse(savedAlert);
      } catch {
        alertData = null;
      }

      if (alertData) {
        let toastTitle = "";
        let toastIcon = "";

        if (alertData.status === "warn") {
          toastTitle = "⚠️ You have a new warning from Admin";
          toastIcon = "warning";
        } else if (alertData.status === "ban") {
          toastTitle = "🚫 Your novel has been banned";
          toastIcon = "error";
        } else if (alertData.status === "archive") {
          toastTitle = "📁 Your novel has been archived";
          toastIcon = "info";
        }

        const alreadyNotified = alertData.notified === alertData.status;

        if (toastTitle && !alreadyNotified && typeof Swal !== "undefined") {
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: toastIcon,
            title: toastTitle,
            showConfirmButton: false,
            timer: 4000,
            timerProgressBar: true,
          });

          alertData.notified = alertData.status;
          localStorage.setItem(
            "author_alert_status",
            JSON.stringify(alertData),
          );
        }

        if (alertData.status === "warn") {
          const chapterDisplay = alertData.chapter
            ? `(${alertData.chapter})`
            : "";
          listHtml += `
            <li class="admin-action-item">
              <div class="report-info">
                <span class="report-book">${escapeHtml(alertData.novelTitle)} <strong style="color:var(--foreground);">${chapterDisplay}</strong></span>
                <span class="report-chapter" style="color: var(--destructive); font-weight: 600;">Warning Issued</span>
                <span class="report-reason">${escapeHtml(alertData.reportReason || "Guidelines violation")}</span>
                <span class="report-reason" style="background: transparent; padding-left: 0; color: var(--muted-foreground); font-style: italic; margin-top: 4px;">"${escapeHtml(alertData.reportDetails || "No additional details")}"</span>
              </div>
            </li>
          `;
        } else if (alertData.status === "ban") {
          listHtml += `
            <li class="admin-action-item">
              <div class="report-info">
                <span class="report-book">${escapeHtml(alertData.novelTitle)}</span>
                <span class="report-chapter" style="color: var(--destructive); font-weight: 600;">Account Banned</span>
                <span class="report-reason">${escapeHtml(alertData.reportReason || "Guidelines violation")}</span>
                <button id="inlineAppealBtn" class="alert-action-btn">File an Appeal</button>
              </div>
            </li>
          `;
        } else if (alertData.status === "archive") {
          listHtml += `
            <li class="admin-action-item">
              <div class="report-info">
                <span class="report-book">${escapeHtml(alertData.novelTitle)}</span>
                <span class="report-chapter" style="color: var(--muted-foreground); font-weight: 600;">Novel Archived</span>
                <span class="report-reason" style="background: var(--secondary); color: var(--muted-foreground);">Archived by Admin</span>
                <button id="inlineAppealBtn" class="alert-action-btn">File an Appeal</button>
              </div>
            </li>
          `;
        } else if (alertData.status === "appealed") {
          listHtml += `
            <li class="admin-action-item">
              <div class="report-info">
                <span class="report-book">${escapeHtml(alertData.novelTitle)}</span>
                <span class="report-chapter" style="color: var(--link-hover); font-weight: 600;">Appeal Under Review</span>
                <span class="report-reason" style="background: rgba(59, 111, 145, 0.1); color: var(--link-hover);">Pending Review</span>
              </div>
            </li>
          `;
        }
      }
    }

    const myNovels = loadNovels().filter((n) => !n.archived);
    const reportedNovels = myNovels.filter((n) => n.reported || n.reportReason);

    if (reportedNovels.length > 0) {
      reportedNovels.forEach((n) => {
        listHtml += `
          <li>
            <div class="report-info">
              <span class="report-book">${escapeHtml(n.title)}</span>
              <span class="report-chapter">${escapeHtml(n.reportChapter || "Unknown chapter")}</span>
              <span class="report-reason">${escapeHtml(n.reportReason || "Reported")}</span>
            </div>
          </li>
        `;
      });
    }

    if (listHtml !== "") {
      reportedList.innerHTML = listHtml;
    } else {
      reportedList.innerHTML = `
        <li class="empty-report-state">
          <div class="empty-report-content">
            <span>None of your novels have been reported.</span>
          </div>
        </li>
      `;
    }

    const appealBtn = document.getElementById("inlineAppealBtn");
    if (appealBtn && alertData && typeof Swal !== "undefined") {
      appealBtn.addEventListener("click", function () {
        Swal.fire({
          title: "File an Appeal",
          text: "Explain why you believe this action was a mistake. Our moderation team will review it.",
          input: "textarea",
          inputPlaceholder: "Type your appeal here...",
          showCancelButton: true,
          confirmButtonText: "Submit Appeal",
          confirmButtonColor: "#b8721f",
          cancelButtonColor: "#6b6680",
          inputValidator: (value) => {
            if (!value || value.trim().length < 10) {
              return "Please provide a valid explanation (at least 10 characters).";
            }
          },
        }).then((result) => {
          if (!result.isConfirmed) return;

          alertData.status = "appealed";
          alertData.appealReason = result.value.trim();
          alertData.notified = "appealed";
          localStorage.setItem(
            "author_alert_status",
            JSON.stringify(alertData),
          );

          const actionItem = document.querySelector(".admin-action-item");
          if (actionItem) {
            actionItem.innerHTML = `
              <div class="report-info">
                <span class="report-book">${escapeHtml(alertData.novelTitle)}</span>
                <span class="report-chapter" style="color: var(--link-hover); font-weight: 600;">Appeal Under Review</span>
                <span class="report-reason" style="background: rgba(59, 111, 145, 0.1); color: var(--link-hover);">Pending Review</span>
              </div>
            `;
          }

          Swal.fire({
            icon: "success",
            title: "Appeal Submitted",
            text: "Your appeal has been sent to the moderation team.",
            showConfirmButton: false,
            timer: 2500,
          });
        });
      });
    }
  }

  // ==========================================
  // FILTERS + SORT
  // ==========================================
  const searchInput = document.getElementById("search-novel");
  const statusFilter = document.getElementById("status-filter");
  const sortSelect = document.getElementById("sort-novel");

  function applyFilters() {
    let list = loadNovels().filter((n) => !n.archived);

    const q = (searchInput?.value || "").trim().toLowerCase();
    if (q) list = list.filter((n) => n.title.toLowerCase().includes(q));

    const status = statusFilter?.value || "All";
    if (status !== "All") {
      const map = {
        Ongoing: "published",
        Completed: "completed",
        Draft: "draft",
        "Pending Review": "pending",
        "On Hiatus": "hiatus",
      };
      const wanted = map[status] || status.toLowerCase();
      list = list.filter((n) => n.status === wanted);
    }

    const sort = sortSelect?.value || "Title";
    if (sort === "Title") list.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "Reads")
      list.sort((a, b) => (b.reads || 0) - (a.reads || 0));
    else if (sort === "Rating")
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    renderRows(list);
    updateStats();
  }

  searchInput?.addEventListener("input", applyFilters);
  statusFilter?.addEventListener("change", applyFilters);
  sortSelect?.addEventListener("change", applyFilters);

  applyFilters();
  renderReportedPanel();

  // ==========================================
  // ARCHIVE ACTION
  // ==========================================
  tbody.addEventListener("click", (e) => {
    if (typeof Swal === "undefined") return;

    const archiveBtn = e.target.closest(".archive-novel-btn");
    if (!archiveBtn) return;

    const id = archiveBtn.closest("tr")?.dataset.id;
    if (!id) return;

    const novel = loadNovels().find((n) => String(n.id) === String(id));
    if (!novel) return;

    if (novel.status === "pending") {
      Swal.fire({
        icon: "warning",
        title: "Cannot Archive",
        text: "This novel is currently under admin review. Please wait for approval before archiving.",
        confirmButtonColor: "#b8721f",
      });
      return;
    }

    Swal.fire({
      title: "Are you sure?",
      text: `"${novel.title}" will be moved to your Archive.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, archive it!",
      confirmButtonColor: "#dc2626",
      cancelButtonText: "No, cancel!",
      cancelButtonColor: "#6b6680",
      reverseButtons: true,
    }).then((res) => {
      if (!res.isConfirmed) return;

      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const target = raw.find((n) => String(n.id) === String(id));
      if (target) {
        target.archived = true;
        target.archivedAt = Date.now();
        saveNovels(raw);
      }
      applyFilters();
      renderReportedPanel();
      Swal.fire(
        "Archived!",
        `"${novel.title}" has been moved to your Archive.`,
        "success",
      );
    });
  });
});
