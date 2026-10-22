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

  // Flatten all archived novels AND archived chapters
  function getArchivedItems() {
    const novels = readAll();
    let items = [];

    novels.forEach((n) => {
      // 1. Check if the whole novel is archived
      if (n.archived) {
        items.push({
          type: "novel",
          novelId: n.id,
          novelTitle: n.title,
          displayTitle: n.title,
          archivedAt: n.archivedAt || Date.now(),
        });
      }
      // 2. If the novel is NOT archived, check for archived chapters inside it
      else if (Array.isArray(n.chapters)) {
        n.chapters.forEach((c) => {
          if (c.archived) {
            items.push({
              type: "chapter",
              novelId: n.id,
              novelTitle: n.title,
              chapterNum: c.number,
              displayTitle: `${n.title} - Ch. ${c.number}: ${c.title}`,
              archivedAt: c.archivedAt || Date.now(),
            });
          }
        });
      }
    });

    return items.sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0));
  }

  /* ==========================================
     STATS
     ========================================== */
  function updateStats() {
    const items = getArchivedItems();
    const archivedEl = document.getElementById("stat-archived");
    if (archivedEl) archivedEl.textContent = items.length;
  }

  /* ==========================================
     RENDER
     ========================================== */
  function render() {
    const items = getArchivedItems();
    tbody.innerHTML = "";

    if (items.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center;padding:28px;color:var(--muted-foreground);">
            No archived items. Your archive is empty.
          </td>
        </tr>`;
      updateStats();
      return;
    }

    items.forEach((item) => {
      const tr = document.createElement("tr");
      tr.dataset.type = item.type;
      tr.dataset.novelId = String(item.novelId);
      tr.dataset.chapterNum = item.chapterNum ? String(item.chapterNum) : "";

      // Badge for Novel vs Chapter
      const badgeHTML =
        item.type === "novel"
          ? `<span class="badge" style="background:#e0e7ff; color:#3730a3;">Novel</span>`
          : `<span class="badge" style="background:#fce7f3; color:#9d174d;">Chapter</span>`;

      tr.innerHTML = `
        <td>${badgeHTML}</td>
        <td><strong>${escapeHtml(item.displayTitle)}</strong></td>
        <td>${formatDate(item.archivedAt)}</td>
        <td style="text-align: center">
          <div class="action-group">
            <button type="button" class="btn btn-success restore-btn">
              <img src="../icons/restore.svg" alt="" class="btn-icon" />
              Restore
            </button>
            <button type="button" class="btn btn-danger delete-btn">
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
    if (typeof Swal === "undefined") return;

    const restoreBtn = e.target.closest(".restore-btn");
    const deleteBtn = e.target.closest(".delete-btn");

    const tr = e.target.closest("tr");
    if (!tr) return;

    const type = tr.dataset.type;
    const novelId = tr.dataset.novelId;
    const chapterNum = tr.dataset.chapterNum;

    /* ---------- RESTORE ---------- */
    if (restoreBtn) {
      Swal.fire({
        title: "Restore Item?",
        text: `This ${type} will be moved back to your library.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#2f5d3a",
        confirmButtonText: "Yes, restore it!",
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          const novels = readAll();
          const novel = novels.find((n) => String(n.id) === String(novelId));

          if (novel) {
            if (type === "novel") {
              novel.archived = false;
              delete novel.archivedAt;
            } else if (type === "chapter" && Array.isArray(novel.chapters)) {
              const chapter = novel.chapters.find(
                (c) => String(c.number) === String(chapterNum),
              );
              if (chapter) {
                chapter.archived = false;
                delete chapter.archivedAt;
              }
            }
            writeAll(novels);
          }

          render();
          Swal.fire("Restored!", `The ${type} is back.`, "success");
        }
      });
      return;
    }

    /* ---------- PERMANENTLY DELETE ---------- */
    if (deleteBtn) {
      Swal.fire({
        title: "Permanently Delete?",
        text: `This ${type} will be deleted forever. You cannot undo this!`,
        icon: "error",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        confirmButtonText: "Yes, delete permanently",
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          let novels = readAll();

          if (type === "novel") {
            novels = novels.filter((n) => String(n.id) !== String(novelId));
          } else if (type === "chapter") {
            const novel = novels.find((n) => String(n.id) === String(novelId));
            if (novel && Array.isArray(novel.chapters)) {
              novel.chapters = novel.chapters.filter(
                (c) => String(c.number) !== String(chapterNum),
              );
            }
          }

          writeAll(novels);
          render();
          Swal.fire(
            "Deleted!",
            `The ${type} has been permanently deleted.`,
            "success",
          );
        }
      });
    }
  });

  render();
});
