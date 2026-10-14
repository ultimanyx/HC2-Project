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

  function formatDate(ts) {
    if (!ts) return "—";
    const d = new Date(ts);
    if (isNaN(d)) return "—";
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function loadNovels() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]").map((n) => ({
      ...n,
      chapters: Array.isArray(n.chapters)
        ? n.chapters.length
        : Number(n.chapters) || 0,
      archived: !!n.archived,
    }));
  }

  function saveNovels(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  // ==========================================
  // SEED HARDCODED DRAFT ROWS (once)
  // ==========================================
  function seedStaticDrafts() {
    const rows = Array.from(tbody.querySelectorAll("tr")).map((tr, i) => {
      const tds = tr.querySelectorAll("td");
      return {
        id: `draft-seed-${i}`,
        title: tds[0]?.textContent.trim() || "",
        status: "draft",
        genre: "Fantasy",
        chapters: Number(tds[3]?.textContent) || 0,
        reads: 0,
        rating: null,
        lastEdited: Date.now(),
        archived: false,
      };
    });

    const existing = loadNovels();
    const titles = new Set(existing.map((n) => (n.title || "").toLowerCase()));
    const toAdd = rows.filter(
      (r) => r.title && !titles.has(r.title.toLowerCase()),
    );
    if (toAdd.length > 0) saveNovels([...existing, ...toAdd]);
  }

  seedStaticDrafts();

  // ==========================================
  // FILTERS + RENDER
  // ==========================================
  const searchInput = document.getElementById("search-draft");
  const sortSelect = document.getElementById("sort-draft");

  function applyFilters() {
    let list = loadNovels().filter((n) => n.status === "draft" && !n.archived);

    const q = (searchInput?.value || "").trim().toLowerCase();
    if (q) list = list.filter((n) => n.title.toLowerCase().includes(q));

    const sort = sortSelect?.value || "Last Edited";
    if (sort === "Title") list.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "Date Created")
      list.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    else list.sort((a, b) => (b.lastEdited || 0) - (a.lastEdited || 0));

    render(list);
  }

  function render(list) {
    tbody.innerHTML = "";

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center;padding:28px;color:var(--muted-foreground);">
            No drafts.
          </td>
        </tr>`;
      return;
    }

    list.forEach((n) => {
      const tr = document.createElement("tr");
      tr.dataset.id = n.id;
      tr.innerHTML = `
        <td><strong>${escapeHtml(n.title)}</strong></td>
        <td><span class="badge draft">Draft</span></td>
        <td>${formatDate(n.lastEdited)}</td>
        <td>${n.chapters ?? 0}</td>
        <td>
          <a class="btn btn-sm edit-draft-btn" href="author_edit-draft.html?id=${n.id}">Edit</a>
          <button class="btn btn-primary btn-sm publish-draft-btn" data-id="${n.id}">Publish</button>
          <button class="btn btn-sm btn-danger archive-draft-btn" data-id="${n.id}">Archive</button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  searchInput?.addEventListener("input", applyFilters);
  sortSelect?.addEventListener("change", applyFilters);

  applyFilters();

  // ==========================================
  // ACTIONS
  // ==========================================
  tbody.addEventListener("click", (e) => {
    const tr = e.target.closest("tr");
    const id = tr?.dataset.id;
    if (!id) return;

    // ---------- PUBLISH ----------
    if (e.target.classList.contains("publish-draft-btn")) {
      Swal.fire({
        title: "Publish this draft?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Publish",
        confirmButtonColor: "#b8721f",
      }).then((res) => {
        if (!res.isConfirmed) return;
        const updated = loadNovels().map((n) =>
          String(n.id) === String(id)
            ? { ...n, status: "published", lastEdited: Date.now() }
            : n,
        );
        saveNovels(updated);
        applyFilters();
      });
      return;
    }

    // ---------- ARCHIVE ----------
    if (e.target.classList.contains("archive-draft-btn")) {
      Swal.fire({
        title: "Archive this draft?",
        text: "You can restore it later from the Archive page.",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Archive",
        cancelButtonText: "Cancel",
      }).then((res) => {
        if (!res.isConfirmed) return;
        const updated = loadNovels().map((n) =>
          String(n.id) === String(id)
            ? { ...n, archived: true, archivedAt: Date.now() }
            : n,
        );
        saveNovels(updated);
        applyFilters();
      });
    }
  });
});
