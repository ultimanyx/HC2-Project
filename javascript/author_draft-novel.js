document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";
  const tbody = document.querySelector(".table-card tbody");
  if (!tbody) return;

  // ==========================================
  // 1. CAPTURE THE PRE-BUILT (HARDCODED) ROWS
  // ==========================================
  const staticRows = Array.from(tbody.querySelectorAll("tr")).map((tr, i) => {
    const tds = tr.querySelectorAll("td");
    return {
      id: `static-${i}`,
      isStatic: true,
      title: tds[0]?.textContent.trim() || "",
      statusLabel: "Draft",
      lastEditedText: tds[2]?.textContent.trim() || "—",
      chapters: Number(tds[3]?.textContent) || 0,
    };
  });

  // Rows hidden during this session (only affects static rows)
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

  function formatDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    const now = new Date();
    const dayDiff = Math.floor((now - d) / 86400000);
    const time = d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (dayDiff === 0) return `Today, ${time}`;
    if (dayDiff === 1) return `Yesterday, ${time}`;
    return d.toLocaleDateString();
  }

  function loadSavedDrafts() {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return all
      .filter((n) => n.status === "draft")
      .map((n) => ({
        ...n,
        isStatic: false,
        statusLabel: "Draft",
        lastEditedText: formatDate(n.lastEdited || n.createdAt),
      }));
  }

  function getAllDrafts() {
    return [...staticRows, ...loadSavedDrafts()];
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
          <td colspan="5" style="text-align:center;padding:28px;color:var(--muted-foreground);">
            No drafts match your search.
          </td>
        </tr>`;
      return;
    }

    visible.forEach((n) => {
      const tr = document.createElement("tr");
      tr.dataset.id = n.id;
      tr.dataset.isStatic = n.isStatic ? "true" : "false";
      tr.innerHTML = `
        <td><strong>${escapeHtml(n.title)}</strong></td>
        <td><span class="badge paused">${escapeHtml(n.statusLabel)}</span></td>
        <td>${escapeHtml(n.lastEditedText)}</td>
        <td>${n.chapters ?? 1}</td>
        <td>
          <button class="btn btn-sm edit-draft-btn" data-id="${n.id}">Edit</button>
          <button class="btn btn-primary btn-sm publish-draft-btn" data-id="${n.id}">Publish</button>
          <button class="btn btn-sm btn-danger delete-draft-btn" data-id="${n.id}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // ==========================================
  // FILTERS + SORT
  // ==========================================
  const searchInput = document.getElementById("search-draft");
  const sortSelect = document.getElementById("sort-draft");

  function applyFilters() {
    let list = getAllDrafts();

    const q = (searchInput?.value || "").trim().toLowerCase();
    if (q) list = list.filter((n) => n.title.toLowerCase().includes(q));

    const sort = sortSelect?.value || "Last Edited";
    if (sort === "Title") {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "Date Created") {
      // static rows don't have createdAt, so push them to the end
      list.sort((a, b) => {
        if (a.isStatic && !b.isStatic) return 1;
        if (b.isStatic && !a.isStatic) return -1;
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
    } else {
      // Last Edited – only saved drafts have a timestamp, so
      // saved drafts rise to the top while static rows stay put at the bottom
      list.sort((a, b) => {
        if (a.isStatic && !b.isStatic) return 1;
        if (b.isStatic && !a.isStatic) return -1;
        const aT = new Date(a.lastEdited || a.createdAt || 0).getTime();
        const bT = new Date(b.lastEdited || b.createdAt || 0).getTime();
        return bT - aT;
      });
    }

    renderRows(list);
  }

  searchInput?.addEventListener("input", applyFilters);
  sortSelect?.addEventListener("change", applyFilters);

  // Initial render
  applyFilters();

  // ==========================================
  // ACTIONS
  // ==========================================
  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const tr = btn.closest("tr");
    const id = tr?.dataset.id;
    const isStatic = tr?.dataset.isStatic === "true";
    if (!id) return;

    // ---------- PUBLISH ----------
    if (btn.classList.contains("publish-draft-btn")) {
      if (isStatic) {
        Swal.fire({
          icon: "info",
          title: "Pre-built draft",
          text: "This is a demo row from the HTML. It can't be published from here — create a new novel to test publishing.",
          confirmButtonColor: "#b8721f",
        });
        return;
      }

      Swal.fire({
        title: "Publish this draft?",
        text: "It will move to All Novels and be visible to readers.",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Publish",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#b8721f",
      }).then((res) => {
        if (!res.isConfirmed) return;

        const numericId = Number(id);
        const updated = JSON.parse(
          localStorage.getItem(STORAGE_KEY) || "[]",
        ).map((n) =>
          n.id === numericId
            ? {
                ...n,
                status: "published",
                lastEdited: new Date().toISOString(),
              }
            : n,
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        Swal.fire({
          icon: "success",
          title: "Published!",
          text: "Your novel is now live.",
          confirmButtonColor: "#b8721f",
        }).then(() => applyFilters());
      });
    }

    // ---------- DELETE ----------
    if (btn.classList.contains("delete-draft-btn")) {
      Swal.fire({
        title: "Delete this draft?",
        text: "This cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#dc2626",
      }).then((res) => {
        if (!res.isConfirmed) return;

        if (isStatic) {
          // Hide for this session only
          hiddenIds.add(id);
        } else {
          const numericId = Number(id);
          const updated = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]",
          ).filter((n) => n.id !== numericId);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }

        applyFilters();
      });
    }

    // ---------- EDIT ----------
    if (btn.classList.contains("edit-draft-btn")) {
      if (isStatic) {
        Swal.fire({
          icon: "info",
          title: "Pre-built draft",
          text: "This is a demo row from the HTML. Create a new novel first to test editing.",
          confirmButtonColor: "#b8721f",
        });
        return;
      }
      window.location.href = `author_edit-draft.html?id=${id}`;
    }
  });
});
