document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";
  const params = new URLSearchParams(location.search);
  const novelId = params.get("novelId") || "demo-novel";
  const chapterParam = params.get("chapter") || "1";

  const $ = (id) => document.getElementById(id);
  const SwalOK = typeof Swal !== "undefined";

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

  const VIEW_NOVEL_URL = "admin-view-novel.html";
  const goToViewNovel = (id) =>
    `${VIEW_NOVEL_URL}?novelId=${encodeURIComponent(id)}`;

  /* ---------------------------------------------------------------
     ARCHIVE BUTTON
     --------------------------------------------------------------- */
  $("deleteBtn")?.addEventListener("click", async () => {
    let fresh = getNovels();
    let freshNovel = fresh.find((n) => String(n.id) === String(novelId));

    if (!freshNovel) {
      return SwalOK
        ? Swal.fire({
            icon: "error",
            title: "Novel not found",
            confirmButtonColor: "#b8721f",
          })
        : alert("Novel not found.");
    }

    const idx = freshNovel.chapters.findIndex(
      (ch) => Number(ch.number) === Number(chapterParam),
    );
    if (idx === -1) return;

    const target = freshNovel.chapters[idx];
    const title = target.title || `Chapter ${chapterParam}`;

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
            cancelButtonColor: "#6b6680",
          })
        ).isConfirmed
      : confirm(`Archive "${title}"?`);

    if (!confirmed) return;

    target.previousStatus = target.status || "published";
    target.archived = true;
    target.archivedAt = Date.now();
    target.status = "archived";
    freshNovel.updatedAt = Date.now();

    saveNovels(fresh);

    if (SwalOK) {
      await Swal.fire({
        icon: "success",
        title: "Archived!",
        text: `"${title}" has been moved to the Archive.`,
        confirmButtonColor: "#b8721f",
      });
    }

    location.href = goToViewNovel(novelId);
  });

  /* ---------------------------------------------------------------
     PREFILL
     --------------------------------------------------------------- */
  const list = getNovels();
  const novel = list.find((n) => String(n.id) === String(novelId));

  if (novel) {
    const chapters = Array.isArray(novel.chapters) ? novel.chapters : [];
    const chapter = chapters.find(
      (ch) => Number(ch.number) === Number(chapterParam),
    );

    if (chapter) {
      const chapterNumber = Number(chapter.number) || 1;

      const titleEl = $("chapterTitle");
      const numEl = $("chapterNumber");
      const noteEl = $("authorNote");
      const contentEl = $("chapterContent");

      if (titleEl) titleEl.value = chapter.title || "";
      if (numEl) numEl.value = chapterNumber;
      if (noteEl) noteEl.value = chapter.authorNote || chapter.note || "";

      // Inject the body
      if (contentEl) {
        contentEl.value = chapter.body || chapter.content || chapter.text || "";
      }

      const chapNumEl = document.querySelector(".chapter-num");
      if (chapNumEl) chapNumEl.textContent = `Chapter ${chapterNumber}`;

      const novelNameEl = document.querySelector(".novel-name");
      if (novelNameEl) novelNameEl.textContent = novel.title || "Untitled";

      const statusBadge = $("statusBadge");
      if (statusBadge) {
        const s = String(chapter.status || "").toLowerCase();
        const map = {
          draft: { label: "Draft", cls: "draft" },
          pending: { label: "Pending Review", cls: "pending" },
          broken: { label: "Broken Content", cls: "paused" },
          published: { label: "Published", cls: "active" },
          archived: { label: "Archived", cls: "completed" },
        };
        const info = map[s] || map.published;
        statusBadge.textContent = info.label;
        statusBadge.className = `badge ${info.cls}`;
      }

      document.title = `Chapter ${chapterNumber} · ${novel.title || "Novel"}`;
    }
  }

  /* ----- Back link ----- */
  const backLink = document.querySelector(".back-link");
  if (backLink) {
    const base = backLink.getAttribute("href") || VIEW_NOVEL_URL;
    const sep = base.includes("?") ? "&" : "?";
    backLink.href = `${base}${sep}novelId=${encodeURIComponent(novelId)}`;
  }
});
