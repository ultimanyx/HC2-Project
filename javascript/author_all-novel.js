document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";
  const SEED_FLAG = "novels_seeded_v8"; // Bumped to ensure the fix applies
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
  // ONE-TIME SEED (Dracula + Shadows of the Crown)
  // ==========================================
  function seedStaticRows() {
    if (localStorage.getItem(SEED_FLAG)) return;

    // Clean out old seed data so we don't get duplicates
    let existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    existing = existing.filter((n) => !String(n.id).startsWith("seed-"));

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

      // FIX: Always use an array for chapters. Provide 5 dummy chapters for Dracula.
      let chaptersData = [];
      if (i === 0) {
        chaptersData = [
          {
            number: 1,
            title: "Jonathan Harker's Journal",
            status: "published",
            words: 4120,
            lastUpdated: Date.now() - 2 * 86400000,
          },
          {
            number: 2,
            title: "The Blood is the Life",
            status: "published",
            words: 3850,
            lastUpdated: Date.now() - 5 * 86400000,
          },
          {
            number: 3,
            title: "The Grey Man",
            status: "published",
            words: 3210,
            lastUpdated: Date.now() - 7 * 86400000,
          },
          {
            number: 4,
            title: "A Night in the Castle",
            status: "pending",
            words: 2100,
            lastUpdated: Date.now() - 14 * 86400000,
          },
          {
            number: 5,
            title: "Letters from Mina",
            status: "draft",
            words: 0,
            lastUpdated: Date.now(),
          },
        ];
      }

      return {
        id: `seed-${i}`,
        title: tds[0]?.textContent.trim() || "",
        status: statusMap[statusTxt] || "published",
        genre: tds[2]?.textContent.trim() || "",
        chapters: chaptersData,
        reads: Number((tds[4]?.textContent || "").replace(/,/g, "")) || 0,
        rating: ratingMatch ? parseFloat(ratingMatch[0]) : null,
        archived: false,
      };
    });

    const toAdd = rows.filter((r) => r.title);
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

      const idStr = String(n.id);
      const isDemo =
        /seed-/i.test(idStr) && idStr !== "seed-0" && idStr !== "seed-1";

      const viewCell = isDemo
        ? `<span class="btn btn-primary btn-sm" role="button" aria-disabled="true" title="Demo row — not viewable" style="cursor:default;">View</span>`
        : `<a class="btn btn-primary btn-sm view-novel-btn" href="author_view-novel.html?id=${encodeURIComponent(n.id)}">View</a>`;

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
  // ARCHIVE ACTION
  // ==========================================
  tbody.addEventListener("click", (e) => {
    if (typeof Swal === "undefined") return;

    const archiveBtn = e.target.closest(".archive-novel-btn");

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
          Swal.fire(
            "Archived!",
            `"${novel.title}" has been moved to your Archive.`,
            "success",
          );
        }
      });
      return;
    }
  });
});
