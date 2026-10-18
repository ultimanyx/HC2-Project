document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";
  const SEED_FLAG = "novels_seeded_v2";
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
    const pending = list.filter((n) => n.status === "pending").length;
    const totalEl = document.getElementById("stat-total");
    const pendingEl = document.getElementById("stat-pending");
    if (totalEl) totalEl.textContent = list.length;
    if (pendingEl) pendingEl.textContent = pending;
  }

  // ==========================================
  // ONE-TIME SEED
  // ==========================================
  function seedStaticRows() {
    if (localStorage.getItem(SEED_FLAG)) return;

    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const existingIds = new Set(existing.map((n) => String(n.id)));

    const rows = Array.from(tbody.querySelectorAll("tr")).map((tr, i) => {
      const tds = tr.querySelectorAll("td");
      const badge = tds[1]?.querySelector(".badge");
      const statusTxt = badge?.textContent.trim() || "Ongoing";
      const statusMap = {
        Ongoing: "published",
        Completed: "completed",
        Draft: "draft",
        "Pending Review": "pending",
        "On Hiatus": "hiatus",
      };
      const ratingTxt = tds[5]?.textContent.trim() || "";
      const ratingMatch = ratingTxt.match(/[\d.]+/);
      return {
        id: `seed-${i}`,
        title: tds[0]?.textContent.trim() || "",
        status: statusMap[statusTxt] || "published",
        genre: tds[2]?.textContent.trim() || "",
        chapters: Number(tds[3]?.textContent) || 0,
        reads: Number((tds[4]?.textContent || "").replace(/,/g, "")) || 0,
        rating: ratingMatch ? parseFloat(ratingMatch[0]) : null,
        archived: false,
      };
    });

    // Skip rows whose deterministic id already exists in storage.
    const toAdd = rows.filter((r) => r.title && !existingIds.has(r.id));

    if (toAdd.length > 0) saveNovels([...existing, ...toAdd]);
    localStorage.setItem(SEED_FLAG, "1");
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

      // Only seed-0 is fully viewable; others show a disabled pill.
      const idStr = String(n.id);
      const isDemo = /seed-/i.test(idStr) && idStr !== "seed-0";
      const viewCell = isDemo
        ? `<span class="btn btn-primary btn-sm" role="button"
                 aria-disabled="true"
                 title="Demo row — not viewable"
                 style="cursor:default;">View</span>`
        : `<a class="btn btn-primary btn-sm view-novel-btn"
                 href="author_view-novel.html?id=${encodeURIComponent(n.id)}">View</a>`;

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
          <button class="btn btn-sm btn-danger archive-novel-btn"
                  data-novel-id="${n.id}">Archive</button>
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
    if (typeof Swal === "undefined") {
      console.warn("[all-novels] SweetAlert2 not loaded — check script order.");
      return;
    }

    const archiveBtn = e.target.closest(".archive-novel-btn");
    const deleteBtn = e.target.closest(".delete-novel-btn");

    if (archiveBtn) {
      const id = archiveBtn.closest("tr")?.dataset.id;
      if (!id) return;
      const novel = loadNovels().find((n) => String(n.id) === String(id));
      if (!novel) return;

      Swal.fire({
        title: "Are you sure?",
        text: `"${novel.title}" will be moved to your Archive.`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, archive it!",
        cancelButtonText: "No, cancel!",
        reverseButtons: true,
      }).then((res) => {
        if (res.isConfirmed) {
          const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
          const target = raw.find((n) => String(n.id) === String(id));
          if (target) {
            target.archived = true;
            target.archivedAt = Date.now();
            saveNovels(raw);
          }
          applyFilters();
          Swal.fire({
            title: "Archived!",
            text: `"${novel.title}" has been moved to your Archive.`,
            icon: "success",
          });
        } else if (res.dismiss === Swal.DismissReason.cancel) {
          Swal.fire({
            title: "Cancelled",
            text: "Your novel is safe :)",
            icon: "error",
          });
        }
      });
      return;
    }

    if (deleteBtn) {
      const id = deleteBtn.closest("tr")?.dataset.id;
      if (!id) return;
      const novel = loadNovels().find((n) => String(n.id) === String(id));
      if (!novel) return;

      Swal.fire({
        title: "Are you sure?",
        text: `"${novel.title}" will be deleted permanently. You won't be able to revert this!`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "No, cancel!",
        reverseButtons: true,
      }).then((res) => {
        if (res.isConfirmed) {
          const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
          saveNovels(raw.filter((n) => String(n.id) !== String(id)));
          applyFilters();
          Swal.fire({
            title: "Deleted!",
            text: `"${novel.title}" has been deleted.`,
            icon: "success",
          });
        } else if (res.dismiss === Swal.DismissReason.cancel) {
          Swal.fire({
            title: "Cancelled",
            text: "Your novel is safe :)",
            icon: "error",
          });
        }
      });
    }
  });
});
