document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";
  const tbody = document.querySelector(".table-card tbody");
  if (!tbody) return;

  // ==========================================
  // 1. CAPTURE THE PRE-BUILT (HARDCODED) ROWS
  // ==========================================
  const staticRows = Array.from(tbody.querySelectorAll("tr")).map((tr, i) => {
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
      id: `static-${i}`,
      isStatic: true,
      title: tds[0]?.textContent.trim() || "",
      status: statusMap[statusText] || "published",
      statusLabel: statusText,
      genre: tds[2]?.textContent.trim() || "",
      chapters: Number(tds[3]?.textContent) || 0,
      reads: Number((tds[4]?.textContent || "").replace(/,/g, "")) || 0,
      rating: ratingMatch ? parseFloat(ratingMatch[0]) : null,
    };
  });

  // Session-only list of hidden rows (so "Delete" on a static row hides it
  // just for this visit, without touching localStorage)
  const hiddenIds = new Set();

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

  function loadSavedNovels() {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    // Ensure each saved novel has a statusLabel
    return saved.map((n) => ({
      ...n,
      isStatic: false,
      statusLabel: labelForStatus(n.status),
    }));
  }

  function getAllNovels() {
    return [...staticRows, ...loadSavedNovels()];
  }

  // ==========================================
  // RENDER
  // ==========================================
  function renderRows(list) {
    tbody.innerHTML = "";

    const visible = list.filter((n) => !hiddenIds.has(n.id));

    if (visible.length === 0) {
      tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align:center;padding:28px;color:var(--muted-foreground);">
              No novels match your filters.
            </td>
          </tr>`;
      return;
    }

    visible.forEach((n) => {
      const ratingCell = n.rating
        ? `<img src="../icons/star-fill.svg" class="star-rating" alt="star"> ${n.rating}`
        : "";
      const readsCell = n.reads ? n.reads.toLocaleString() : "";
      const badgeCls = badgeClassFor(n.statusLabel);

      const tr = document.createElement("tr");
      tr.dataset.id = n.id;
      tr.dataset.isStatic = n.isStatic ? "true" : "false";
      tr.innerHTML = `
          <td><strong>${escapeHtml(n.title)}</strong></td>
          <td><span class="badge ${badgeCls}">${escapeHtml(n.statusLabel)}</span></td>
          <td>${escapeHtml(n.genre || "—")}</td>
          <td>${n.chapters ?? 1}</td>
          <td>${readsCell}</td>
          <td>${ratingCell}</td>
          <td>
          <a class="btn btn-primary btn-sm view-novel-btn" href="author_view-novel.html?id=${n.id}">View</a>
            <button class="btn btn-sm btn-danger delete-novel-btn" data-novel-id="${n.id}">Delete</button>
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
    let list = getAllNovels();

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
  }

  searchInput?.addEventListener("input", applyFilters);
  statusFilter?.addEventListener("change", applyFilters);
  sortSelect?.addEventListener("change", applyFilters);

  // Initial render
  applyFilters();

  // ==========================================
  // DELETE
  // ==========================================
  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest(".delete-novel-btn");
    if (!btn) return;

    const tr = btn.closest("tr");
    const id = tr?.dataset.id;
    const isStatic = tr?.dataset.isStatic === "true";

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

      if (isStatic) {
        // Just hide it for this session
        hiddenIds.add(id);
      } else {
        // Remove from localStorage
        const numericId = Number(id);
        const updated = JSON.parse(
          localStorage.getItem(STORAGE_KEY) || "[]",
        ).filter((n) => n.id !== numericId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }

      applyFilters();
    });
  });
});
