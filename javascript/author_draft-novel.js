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
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  function saveNovels(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  // ==========================================
  // SEED HARDCODED DRAFT & CLEANUP
  // ==========================================
  function seedHardcodedDraft() {
    let novels = loadNovels();
    let changed = false;

    const filteredNovels = novels.filter((n) => {
      const isDuplicate =
        n.title.toLowerCase() === "the lost kingdom" &&
        String(n.id) !== "draft-seed-0";

      if (isDuplicate) {
        changed = true;
        return false; // Remove it
      }
      return true;
    });

    if (!filteredNovels.some((n) => String(n.id) === "draft-seed-0")) {
      filteredNovels.push({
        id: "draft-seed-0",
        title: "The Lost Kingdom",
        subtitle: "A throne unclaimed",
        genre: "Fantasy",
        synopsis:
          "An heir believed dead. A throne left empty. A kingdom on the brink of war. The Lost Kingdom is the first book in an epic fantasy saga.",
        coverImage: "../image/lostcrown.jpeg",
        status: "draft",
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
            title: "Untitled Chapter",
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

    if (changed) saveNovels(filteredNovels);
  }

  seedHardcodedDraft();

  // ==========================================
  // FILTERS + RENDER
  // ==========================================
  const searchInput = document.getElementById("search-draft");
  const sortSelect = document.getElementById("sort-draft");

  function applyFilters() {
    let list = loadNovels().filter((n) => n.status === "draft" && !n.archived);

    const q = (searchInput?.value || "").trim().toLowerCase();
    if (q) list = list.filter((n) => (n.title || "").toLowerCase().includes(q));

    const sort = sortSelect?.value || "Last Edited";
    if (sort === "Title")
      list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    else if (sort === "Date Created")
      list.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    else list.sort((a, b) => (b.lastEdited || 0) - (a.lastEdited || 0));

    render(list);
  }

  function render(list) {
    const hardcodedRow = tbody.querySelector('tr[data-id="draft-seed-0"]');
    tbody.innerHTML = "";

    const seedIsActive = list.some((n) => String(n.id) === "draft-seed-0");

    if (seedIsActive && hardcodedRow) {
      tbody.appendChild(hardcodedRow);
    }

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="display: table-cell; text-align:center; padding: 48px; color:var(--muted-foreground); width: 100%;">
            No drafts found.
          </td>
        </tr>`;
      return;
    }

    list.forEach((n) => {
      if (String(n.id) === "draft-seed-0") return;

      const chapterCount = Array.isArray(n.chapters)
        ? n.chapters.filter((c) => !c.archived).length
        : 0;

      const tr = document.createElement("tr");
      tr.dataset.id = n.id;

      tr.innerHTML = `
        <td><strong>${escapeHtml(n.title)}</strong></td>
        <td><span class="badge draft">Draft</span></td>
        <td>${n.lastEdited ? formatDate(n.lastEdited) : "Today"}</td>
        <td>${chapterCount}</td>
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

    // ---------- PUBLISH BOOK ----------
    if (e.target.classList.contains("publish-draft-btn")) {
      Swal.fire({
        title: "Publish this book?",
        text: "All chapters inside this book will also be published.",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Publish",
        confirmButtonColor: "#b8721f",
      }).then((res) => {
        if (!res.isConfirmed) return;

        const updated = loadNovels().map((n) => {
          if (String(n.id) === String(id)) {
            // 🚨 THE FIX: Cascading update. Publish the book AND all its chapters.
            const updatedChapters = (n.chapters || []).map((ch) => ({
              ...ch,
              status: "published",
            }));

            return {
              ...n,
              status: "published",
              chapters: updatedChapters,
              lastEdited: Date.now(),
            };
          }
          return n;
        });

        saveNovels(updated);
        applyFilters();

        Swal.fire(
          "Published!",
          "Your novel and all its chapters are now live.",
          "success",
        );
      });
      return;
    }

    // ---------- ARCHIVE BOOK ----------
    if (e.target.classList.contains("archive-draft-btn")) {
      Swal.fire({
        title: "Archive this draft?",
        text: "You can restore it later from the Archive page.",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Archive",
        confirmButtonColor: "#b8721f",
        cancelButtonText: "Cancel",
      }).then((res) => {
        if (!res.isConfirmed) return;

        const updated = loadNovels().map((n) => {
          if (String(n.id) === String(id)) {
            return { ...n, archived: true, archivedAt: Date.now() };
          }
          return n;
        });

        saveNovels(updated);
        applyFilters();

        Swal.fire("Archived!", "Draft moved to Archive.", "success");
      });
    }
  });
});
