document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";
  const tbody = document.querySelector(".table-card tbody");
  if (!tbody) return;

  /* ==========================================
     HELPERS
     ========================================== */
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

  // RAW storage — no mutation, full data preserved
  function readAll() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  function writeAll(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  // VIEW-ONLY projection (never saved back)
  function forDisplay(n) {
    return {
      ...n,
      chapters: Array.isArray(n.chapters)
        ? n.chapters.length
        : Number(n.chapters) || 0,
      archived: !!n.archived,
    };
  }

  /* ==========================================
     STATS
     ========================================== */
  function updateStats() {
    const all = readAll();

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

  /* ==========================================
     RENDER
     ========================================== */
  function render() {
    const archived = readAll()
      .filter((n) => n.archived)
      .map(forDisplay)
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
      tr.dataset.id = String(n.id);
      tr.innerHTML = `
        <td><strong>${escapeHtml(n.title)}</strong></td>
        <td>${n.chapters ?? 0}</td>
        <td>${formatDate(n.archivedAt)}</td>
        <td style="text-align: center">
          <div class="action-group">
            <button type="button" class="btn btn-success restore-novel-btn" data-novel-id="${n.id}">
              <img src="../icons/restore.svg" alt="" class="btn-icon" />
              Restore
            </button>
            <button type="button" class="btn btn-danger delete-novel-btn" data-novel-id="${n.id}">
              <img src="../icons/delete.svg" alt="delete" class="btn-icon" />
              Delete
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    updateStats();
  }

  /* ==========================================
     ACTIONS
     ========================================== */
  tbody.addEventListener("click", (e) => {
    if (typeof Swal === "undefined") {
      console.warn("[archive] SweetAlert2 not loaded.");
      return;
    }

    const restoreBtn = e.target.closest(".restore-novel-btn");
    const deleteBtn = e.target.closest(".delete-novel-btn");

    /* ---------- RESTORE ---------- */
    if (restoreBtn) {
      const id = restoreBtn.closest("tr")?.dataset.id;
      if (!id) return;

      const raw = readAll();
      const target = raw.find((n) => String(n.id) === String(id)); // ← FIX 1
      if (!target) {
        console.warn(
          "[archive] restore: no match",
          id,
          "stored ids:",
          raw.map((n) => n.id),
        );
        return;
      }

      Swal.fire({
        title: "Are you sure?",
        text: `"${target.title}" will be moved back to your library.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, restore it!",
        cancelButtonText: "No, cancel!",
        reverseButtons: true,
      }).then((result) => {
        if (result.isConfirmed) {
          const list = readAll(); // ← FIX 2
          const t = list.find((n) => String(n.id) === String(id));
          if (t) {
            t.archived = false;
            delete t.archivedAt;
            t.restoredAt = Date.now();
            writeAll(list); // raw data preserved
          }
          render();

          Swal.fire({
            title: "Restored!",
            text: `"${target.title}" is back in your library.`,
            icon: "success",
          });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire({
            title: "Cancelled",
            text: "Your novel is still archived :)",
            icon: "error",
          });
        }
      });
      return;
    }

    /* ---------- DELETE ---------- */
    if (deleteBtn) {
      const id = deleteBtn.closest("tr")?.dataset.id;
      if (!id) return;

      const raw = readAll();
      const target = raw.find((n) => String(n.id) === String(id)); // ← FIX 1
      if (!target) {
        console.warn("[archive] delete: no match", id);
        return;
      }

      Swal.fire({
        title: "Are you sure?",
        text: `"${target.title}" will be deleted permanently. You won't be able to revert this!`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "No, cancel!",
        reverseButtons: true,
      }).then((result) => {
        if (result.isConfirmed) {
          const list = readAll();
          writeAll(list.filter((n) => String(n.id) !== String(id))); // ← FIX 1
          render();

          Swal.fire({
            title: "Deleted!",
            text: `"${target.title}" has been deleted.`,
            icon: "success",
          });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire({
            title: "Cancelled",
            text: "Your novel is safe :)",
            icon: "error",
          });
        }
      });
    }
  });

  render();
});
