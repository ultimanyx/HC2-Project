document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";
  const params = new URLSearchParams(location.search);
  const novelId = params.get("novelId");
  const chapterParam = params.get("chapter");

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

  /* Adjust these if your project uses underscores in the filenames */
  const VIEW_NOVEL_URL = "admin-view-novel.html";
  const ALL_NOVELS_URL = "admin_all-novels.html";
  const goToViewNovel = (id) =>
    `${VIEW_NOVEL_URL}?novelId=${encodeURIComponent(id)}`;

  /* ---------------------------------------------------------------
     DELETE  (bound first so the button always works)
     --------------------------------------------------------------- */
  $("deleteBtn")?.addEventListener("click", async () => {
    if (!novelId || chapterParam == null) {
      return SwalOK
        ? Swal.fire({
            icon: "info",
            title: "Can't delete from here",
            text: "This page needs ?novelId=...&chapter=... in the URL.",
            confirmButtonColor: "#b8721f",
          })
        : alert("Missing novelId/chapter in URL.");
    }

    const fresh = getNovels();
    const freshNovel = fresh.find((n) => String(n.id) === String(novelId));
    if (!freshNovel || !Array.isArray(freshNovel.chapters)) {
      return SwalOK
        ? Swal.fire({
            icon: "error",
            title: "Chapter not found",
            text: "Could not load this novel's chapters.",
            confirmButtonColor: "#b8721f",
          })
        : alert("Novel not found.");
    }

    const wanted = Number(chapterParam);
    const idx = freshNovel.chapters.findIndex(
      (ch) => Number(ch.number) === wanted,
    );
    if (idx === -1) {
      return SwalOK
        ? Swal.fire({
            icon: "warning",
            title: "Chapter not found",
            text: `Chapter #${chapterParam} doesn't exist.`,
            confirmButtonColor: "#b8721f",
          })
        : alert("Chapter not found.");
    }

    const title = freshNovel.chapters[idx].title || `Chapter ${chapterParam}`;

    const confirmed = SwalOK
      ? (
          await Swal.fire({
            icon: "warning",
            title: "Delete this chapter?",
            text: `"${title}" will be deleted permanently. This cannot be undone.`,
            showCancelButton: true,
            confirmButtonText: "Delete",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#d33",
          })
        ).isConfirmed
      : confirm(`Delete "${title}"?`);
    if (!confirmed) return;

    freshNovel.chapters.splice(idx, 1);
    freshNovel.chapters.forEach((ch, i) => (ch.number = i + 1));
    freshNovel.updatedAt = Date.now();
    saveNovels(fresh);

    if (SwalOK) {
      await Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: `"${title}" has been deleted.`,
        confirmButtonColor: "#b8721f",
      });
    }

    location.href = goToViewNovel(novelId);
  });

  /* ---------------------------------------------------------------
     PREFILL  (read-only; no URL params → leave the static demo alone)
     --------------------------------------------------------------- */
  if (!novelId) return;

  const list = getNovels();
  const novel = list.find((n) => String(n.id) === String(novelId));
  if (!novel) {
    if (SwalOK) {
      Swal.fire({
        icon: "error",
        title: "Novel not found",
        text: `No novel with id "${novelId}"`,
        confirmButtonColor: "#b8721f",
      }).then(() => (location.href = ALL_NOVELS_URL));
    }
    return;
  }

  const chapters = Array.isArray(novel.chapters) ? novel.chapters : [];
  let chapterIndex = -1;
  if (chapterParam != null) {
    const wanted = Number(chapterParam);
    chapterIndex = chapters.findIndex((ch) => Number(ch.number) === wanted);
    if (chapterIndex === -1 && wanted >= 1 && wanted <= chapters.length) {
      chapterIndex = wanted - 1;
    }
  }

  if (chapterIndex === -1) {
    if (SwalOK) {
      Swal.fire({
        icon: "warning",
        title: "Chapter not found",
        text: `Chapter #${chapterParam ?? "(none)"} doesn't exist in "${novel.title || "this novel"}".`,
        confirmButtonColor: "#b8721f",
      }).then(() => (location.href = goToViewNovel(novelId)));
    }
    return;
  }

  const chapter = chapters[chapterIndex];
  const chapterNumber = Number(chapter.number) || chapterIndex + 1;

  /* ----- Fields (textareas use .value, not .innerHTML) ----- */
  const titleEl = $("chapterTitle");
  const numEl = $("chapterNumber");
  const noteEl = $("authorNote");
  const contentEl = $("chapterContent");

  if (titleEl) titleEl.value = chapter.title || "";
  if (numEl) numEl.value = chapterNumber;
  if (noteEl) noteEl.value = chapter.authorNote || chapter.note || "";
  if (contentEl) {
    contentEl.value = chapter.body || chapter.content || chapter.text || "";
  }

  /* ----- Meta bar ----- */
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
    };
    const info = map[s] || map.published;
    statusBadge.textContent = info.label;
    statusBadge.className = `badge ${info.cls}`;
  }

  /* ----- Back link: keep the HTML’s target, append ?novelId ----- */
  const backLink = document.querySelector(".back-link");
  if (backLink) {
    const base = backLink.getAttribute("href") || VIEW_NOVEL_URL;
    const sep = base.includes("?") ? "&" : "?";
    backLink.href = `${base}${sep}novelId=${encodeURIComponent(novelId)}`;
  }

  /* ----- Page title ----- */
  document.title = `Chapter ${chapterNumber} · ${novel.title || "Novel"}`;
});
