document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";
  const params = new URLSearchParams(location.search);
  // Fallback to a demo ID if none is provided
  const novelId = params.get("novelId") || "demo-novel";

  const $ = (id) => document.getElementById(id);
  const SwalOK = typeof Swal !== "undefined";

  const CHAPTER_VIEW_URL = "admin_view-chapter.html";

  const getNovels = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  };
  const saveNovels = (list) =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

  const escapeHtml = (s) =>
    String(s ?? "").replace(
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

  const relativeTime = (ts) => {
    if (!ts) return "—";
    const days = Math.floor((Date.now() - ts) / 86400000);
    if (days <= 0) return "Just now";
    if (days === 1) return "1 day ago";
    if (days < 7) return `${days} days ago`;
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  };

  const chapterStatusMeta = (s) => {
    const k = String(s || "").toLowerCase();
    if (k === "draft") return { label: "Draft", cls: "draft" };
    if (k === "pending") return { label: "Pending Review", cls: "pending" };
    if (k === "broken") return { label: "Broken Content", cls: "paused" };
    if (k === "archived") return { label: "Archived", cls: "completed" };
    return { label: "Published", cls: "active" };
  };

  const tbody = $("chapterTableBody");

  // Helper to extract full novel data from the hardcoded HTML
  const extractDemoNovel = () => {
    const tagsHtml = document.querySelectorAll("#tagsView .tag");
    const tags = Array.from(tagsHtml).map((t) => t.textContent.trim());

    return {
      id: novelId,
      title:
        $("titleView")?.textContent.trim() ||
        document.querySelector(".topbar h1").textContent.trim(),
      subtitle: $("subtitleView")?.textContent.trim() || "",
      synopsis: $("synopsisView")?.textContent.trim() || "",
      tags: tags,
      author: "Sarah J.",
      status: "Ongoing",
      updatedAt: Date.now(),
      chapters: Array.from(tbody.querySelectorAll("tr")).map((tr) => {
        let wordsRaw = tr.querySelector("td:nth-child(4)").textContent.trim();
        let words = wordsRaw === "—" ? 0 : Number(wordsRaw.replace(/,/g, ""));
        if (isNaN(words)) words = 0;

        return {
          number: Number(tr.dataset.chapter),
          title: tr.querySelector("td:nth-child(2)").textContent.trim(),
          words: words,
          status:
            tr.querySelector(".badge")?.textContent.toLowerCase() ||
            "published",
          lastUpdated: Date.now(),
        };
      }),
    };
  };

  /* =============================================================
     CHAPTER-LEVEL: Archive action
     ============================================================= */
  tbody?.addEventListener("click", async (e) => {
    const archiveBtn = e.target.closest(".archive-chapter-btn");
    if (!archiveBtn) return;

    const row = archiveBtn.closest("tr");
    const number = Number(row?.dataset.chapter);
    if (!number) return;

    const title = row.querySelector("td:nth-child(2)").textContent.trim();

    const confirmed = SwalOK
      ? (
          await Swal.fire({
            icon: "warning",
            title: "Archive this chapter?",
            text: `"${title}" will be removed from here and moved to the Archive page.`,
            showCancelButton: true,
            confirmButtonText: "Archive",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#b8721f",
            cancelButtonColor: "#6b6680", // <-- Added consistent cancel color
          })
        ).isConfirmed
      : confirm(`Archive "${title}"?`);
    if (!confirmed) return;

    let fresh = getNovels();
    let freshNovel = fresh.find((n) => String(n.id) === String(novelId));

    // If the novel doesn't exist in localStorage, create it from the hardcoded HTML
    if (!freshNovel) {
      freshNovel = extractDemoNovel();
      fresh.push(freshNovel);
    }

    const idx = freshNovel.chapters.findIndex(
      (ch) => Number(ch.number) === number,
    );
    if (idx === -1) return;

    // Soft delete
    const target = freshNovel.chapters[idx];
    target.previousStatus = target.status || "published";
    target.archived = true;
    target.archivedAt = Date.now();
    target.status = "archived";
    freshNovel.updatedAt = Date.now();

    saveNovels(fresh);

    // Re-render the table so the archived chapter disappears
    render(freshNovel);

    if (SwalOK) {
      Swal.fire({
        icon: "success",
        title: "Archived!",
        text: `"${title}" has been moved to the Archive.`,
        confirmButtonColor: "#b8721f",
      });
    }
  });

  /* =============================================================
     RENDER FUNCTION
     ============================================================= */
  function render(novelData) {
    if (!tbody) return;

    const chapters = Array.isArray(novelData?.chapters)
      ? [...novelData.chapters]
          .filter((ch) => !ch.archived) // Hides archived chapters!
          .sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0))
      : [];

    if (!chapters.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#888;">No chapters yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = chapters
      .map((ch) => {
        const meta = chapterStatusMeta(ch.status);
        const n = Number(ch.number) || 0;
        const viewHref = `${CHAPTER_VIEW_URL}?novelId=${encodeURIComponent(novelId)}&chapter=${n}`;

        // Only show View and Archive buttons
        let actions = `
          <a href="${viewHref}"><button class="btn btn-sm btn-primary">View</button></a>
          <button class="btn btn-sm btn-danger archive-chapter-btn" data-number="${n}">Archive</button>
        `;

        const wordsDisplay = ch.words ? Number(ch.words).toLocaleString() : "—";

        return `
          <tr data-chapter="${n}">
            <td>${n}</td>
            <td><strong>${escapeHtml(ch.title || "Untitled")}</strong></td>
            <td><span class="badge ${meta.cls}">${meta.label}</span></td>
            <td>${wordsDisplay}</td>
            <td>${relativeTime(ch.lastUpdated)}</td>
            <td>${actions}</td>
          </tr>
        `;
      })
      .join("");
  }

  /* =============================================================
     INITIAL LOAD
     ============================================================= */
  const list = getNovels();
  const novel = list.find((n) => String(n.id) === String(novelId));

  // If the novel exists in localStorage, pre-fill the header and render the table
  if (novel) {
    if ($("titleView")) $("titleView").textContent = novel.title || "Untitled";
    if ($("subtitleView")) $("subtitleView").textContent = novel.subtitle || "";
    if ($("synopsisView"))
      $("synopsisView").textContent = novel.synopsis || novel.description || "";

    const coverImg = document.querySelector(".novel-cover img");
    if (coverImg && novel.cover) coverImg.src = novel.cover;

    if ($("novelStatusBadge")) {
      $("novelStatusBadge").textContent = novel.archived
        ? "Archived"
        : novel.status || "Ongoing";
      $("novelStatusBadge").className =
        `badge ${novel.archived ? "completed" : "active"}`;
    }

    // If there are tags saved, overwrite the hardcoded tags
    if (novel.tags && Array.isArray(novel.tags) && $("tagsView")) {
      $("tagsView").innerHTML = novel.tags
        .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
        .join("");
    }

    // Overwrite the hardcoded HTML with actual data, filtering out archived
    render(novel);
  }
});
