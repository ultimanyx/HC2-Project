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
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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
  // STATS
  // ==========================================
  function updateStats() {
    const all = loadNovels();

    const archivedCount = all.filter((n) => n.archived).length;

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const restoredThisMonth = all.filter(
      (n) => n.restoredAt && n.restoredAt >= monthStart.getTime(),
    ).length;

    const archivedEl = document.getElementById("stat-archived");
    const restoredEl = document.getElementById("stat-restored");
    if (archivedEl) archivedEl.textContent = archivedCount;
    if (restoredEl) restoredEl.textContent = restoredThisMonth;
  }

  // ==========================================
  // RENDER
  // ==========================================
  function render() {
    const archived = loadNovels()
      .filter((n) => n.archived)
      .sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0));

    tbody.innerHTML = "";

    if (archived.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center;padding:28px;color:var(--muted-foreground);">
            No archived novels.
          </td>
        </tr>`;
      updateStats();
      return;
    }

    archived.forEach((n) => {
      const tr = document.createElement("tr");
      tr.dataset.id = n.id;
      tr.innerHTML = `
        <td><strong>${escapeHtml(n.title)}</strong></td>
        <td>${n.chapters ?? 0}</td>
        <td>${formatDate(n.archivedAt)}</td>
        <td>
          <button type="button" class="btn btn-primary btn-sm restore-novel-btn" data-novel-id="${n.id}">Restore</button>
          <button type="button" class="btn btn-danger btn-sm delete-novel-btn" data-novel-id="${n.id}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    updateStats();
  }

  // ==========================================
  // ACTIONS
  // ==========================================
  tbody.addEventListener("click", (e) => {
    const restoreBtn = e.target.closest(".restore-novel-btn");
    const deleteBtn = e.target.closest(".delete-novel-btn");

    // ---------- RESTORE ----------
    if (restoreBtn) {
      const id = restoreBtn.closest("tr")?.dataset.id;
      if (!id) return;

      const list = loadNovels();
      const novel = list.find((n) => n.id === id);
      if (novel) {
        novel.archived = false;
        delete novel.archivedAt;
        novel.restoredAt = Date.now();
        saveNovels(list);
      }
      render();
      return;
    }

    // ---------- DELETE ----------
    if (deleteBtn) {
      const id = deleteBtn.closest("tr")?.dataset.id;
      if (!id) return;

      Swal.fire({
        title: "Delete permanently?",
        text: "This cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#dc2626",
      }).then((res) => {
        if (!res.isConfirmed) return;
        saveNovels(loadNovels().filter((n) => n.id !== id));
        render();
      });
    }
  });

  render();
});
