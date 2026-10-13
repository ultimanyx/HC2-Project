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

  function loadNovels() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]").map((n) => ({
      ...n,
      chapters: Array.isArray(n.chapters)
        ? n.chapters.length
        : Number(n.chapters) || 0,
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

    const total = list.length;
    const pending = list.filter((n) => n.status === "pending").length;

    const totalEl = document.getElementById("stat-total");
    const pendingEl = document.getElementById("stat-pending");

    if (totalEl) totalEl.textContent = total;
    if (pendingEl) pendingEl.textContent = pending;
  }

  // ==========================================
  // SEED HARDCODED ROWS INTO localStorage (once)
  // ==========================================
  function seedStaticRows() {
    const rows = Array.from(tbody.querySelectorAll("tr")).map((tr, i) => {
      const tds = tr.querySelectorAll("td");
      const badge = tds[1]?.querySelector(".badge");
      const statusText = badge?.textContent.trim() || "Ongoing";
      const statusMap = {
        Ongoing: "published",
        Completed: "completed",
        Draft: "draft",
        "Pending Review": "pending",
        "On Hiatus": "hiatus",
      };
      const ratingText = tds[5]?.textContent.trim() || "";
      const ratingMatch = ratingText.match(/[\d.]+/);
      return {
        id: `seed-${i}`,
        title: tds[0]?.textContent.trim() || "",
        status: statusMap[statusText] || "published",
        genre: tds[2]?.textContent.trim() || "",
        chapters: Number(tds[3]?.textContent) || 0,
        reads: Number((tds[4]?.textContent || "").replace(/,/g, "")) || 0,
        rating: ratingMatch ? parseFloat(ratingMatch[0]) : null,
        archived: false,
      };
    });

    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const existingTitles = new Set(
      existing.map((n) => (n.title || "").toLowerCase()),
    );
    const toAdd = rows.filter(
      (r) => r.title && !existingTitles.has(r.title.toLowerCase()),
    );
    if (toAdd.length > 0) saveNovels([...existing, ...toAdd]);
  }

  seedStaticRows();

  // ==========================================
  // RENDER
  // ==========================================
  function renderRows(list) {
    tbody.innerHTML = "";

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;padding:28px;color:var(--muted-foreground);">
            No novels match your filters.
          </td>
        </tr>`;
      return;
    }

    list.forEach((n) => {
      const ratingCell = n.rating
        ? `<img src="../icons/star-fill.svg" class="star-rating" alt="star"> ${n.rating}`
        : "";
      const readsCell = n.reads ? n.reads.toLocaleString() : "";
      const badgeCls = badgeClassFor(n.statusLabel);

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
  <a class="btn btn-primary btn-sm view-novel-btn" href="author_view-novel.html?id=${n.id}">View</a>
  <button class="btn btn-sm btn-danger archive-novel-btn" data-novel-id="${n.id}">Archive</button>
</td>
      `;
      tbody.appendChild(tr);
    });
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

  // ==========================================
  // ARCHIVE + DELETE
  // ==========================================
  tbody.addEventListener("click", (e) => {
    const archiveBtn = e.target.closest(".archive-novel-btn");
    const deleteBtn = e.target.closest(".delete-novel-btn");

    if (archiveBtn) {
      const id = archiveBtn.closest("tr")?.dataset.id;
      if (!id) return;

      Swal.fire({
        title: "Archive this novel?",
        text: "You can restore it later from the Archive page.",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Archive",
        cancelButtonText: "Cancel",
      }).then((res) => {
        if (!res.isConfirmed) return;
        const list = loadNovels();
        const novel = list.find((n) => n.id === id);
        if (novel) {
          novel.archived = true;
          novel.archivedAt = Date.now();
          saveNovels(list);
        }
        applyFilters();
      });
      return;
    }

    if (deleteBtn) {
      const id = deleteBtn.closest("tr")?.dataset.id;
      if (!id) return;

      Swal.fire({
        title: "Delete this novel?",
        text: "This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#dc2626",
      }).then((res) => {
        if (!res.isConfirmed) return;
        saveNovels(loadNovels().filter((n) => n.id !== id));
        applyFilters();
      });
    }
  });
});
