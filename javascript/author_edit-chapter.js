document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";
  const params = new URLSearchParams(location.search);
  const novelId = params.get("novelId");
  const chapterParam = params.get("chapter");

  // No id in URL → leave the static demo untouched
  if (!novelId) return;

  const $ = (elId) => document.getElementById(elId);
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

  /* ---------- Locate novel ---------- */
  const list = getNovels();
  const novel = list.find((n) => String(n.id) === String(novelId));
  if (!novel) {
    if (SwalOK) {
      Swal.fire({
        icon: "error",
        title: "Novel not found",
        text: `No novel with id "${novelId}"`,
        confirmButtonColor: "#b8721f",
      }).then(() => (location.href = "author_all-novel.html"));
    }
    return;
  }

  /* ---------- Locate chapter ---------- */
  const chapters = Array.isArray(novel.chapters) ? novel.chapters : [];
  let chapterIndex = -1;

  if (chapterParam != null) {
    const wanted = Number(chapterParam);
    chapterIndex = chapters.findIndex((ch) => Number(ch.number) === wanted);
    if (chapterIndex === -1 && wanted >= 1 && wanted <= chapters.length) {
      chapterIndex = wanted - 1;
    }
  }

  const isNewChapter = chapterIndex === -1;
  const chapter = isNewChapter ? {} : chapters[chapterIndex];

  if (isNewChapter && chapters.length > 0 && chapterParam != null) {
    if (SwalOK) {
      Swal.fire({
        icon: "warning",
        title: "Chapter not found",
        text: `Chapter #${chapterParam} doesn't exist in "${novel.title}".`,
        confirmButtonColor: "#b8721f",
      });
    }
  }

  /* ---------- Prefill form ---------- */
  const titleEl = $("chapterTitle");
  const numEl = $("chapterNumber");
  const noteEl = $("authorNote");
  const contentEl = $("chapterContent");

  const nextNumber = isNewChapter
    ? chapters.reduce((m, ch) => Math.max(m, Number(ch.number) || 0), 0) + 1
    : (chapter.number ?? chapterIndex + 1);

  if (titleEl) titleEl.value = chapter.title || "";
  if (numEl) numEl.value = nextNumber;
  if (noteEl) noteEl.value = chapter.authorNote || chapter.note || "";
  if (contentEl) {
    contentEl.innerHTML = chapter.body || chapter.content || chapter.text || "";
  }

  /* ---------- Meta bar ---------- */
  const chapNumEl = document.querySelector(".chapter-num");
  if (chapNumEl) chapNumEl.textContent = `Chapter ${nextNumber}`;

  const novelNameEl = document.querySelector(".novel-name");
  if (novelNameEl) novelNameEl.textContent = novel.title || "Untitled";

  const statusBadge = $("statusBadge");
  if (statusBadge) {
    const isDraft = chapter.status === "draft";
    statusBadge.textContent = isDraft ? "Draft" : "Published";
    statusBadge.className = `badge ${isDraft ? "draft" : "active"}`;
  }

  const backLink = document.querySelector(".back-link");
  if (backLink)
    backLink.href = `author_view-novel.html?id=${encodeURIComponent(novelId)}`;

  /* ---------- Page title ---------- */
  document.title = isNewChapter
    ? `New Chapter · ${novel.title || "Novel"}`
    : `Edit Chapter ${nextNumber} · ${novel.title || "Novel"}`;

  /* ---------- Word / char / read-time counter ---------- */
  const wordCountEl = $("wordCount");
  const charCountEl = $("charCount");
  const readTimeEl = $("readTime");
  const saveStatusEl = $("saveStatus");

  function updateCounts() {
    const text = contentEl ? contentEl.innerText || "" : "";
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const mins = Math.max(1, Math.ceil(words / 200));

    if (wordCountEl) wordCountEl.textContent = words.toLocaleString();
    if (charCountEl) charCountEl.textContent = chars.toLocaleString();
    if (readTimeEl) readTimeEl.textContent = mins;

    if (saveStatusEl) saveStatusEl.textContent = "Unsaved changes";
  }

  contentEl?.addEventListener("input", updateCounts);
  titleEl?.addEventListener("input", () => {
    if (saveStatusEl) saveStatusEl.textContent = "Unsaved changes";
  });
  updateCounts();

  /* ---------- Toolbar ---------- */
  document.querySelectorAll(".editor-toolbar .tool-btn").forEach((btn) => {
    btn.addEventListener("mousedown", (e) => e.preventDefault()); // preserve selection
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      const value = btn.dataset.value;

      if (btn.id === "clearFormatBtn") {
        document.execCommand("removeFormat", false, null);
      } else if (action === "insertHorizontalRule") {
        document.execCommand("insertHorizontalRule", false, null);
      } else if (action === "formatBlock") {
        document.execCommand("formatBlock", false, `<${value}>`);
      } else if (action) {
        document.execCommand(action, false, null);
      }
      contentEl?.focus();
      updateCounts();
    });
  });

  /* ---------- Collect form data ---------- */
  function readForm() {
    const title = titleEl?.value.trim() || "";
    const num = parseInt(numEl?.value, 10) || 0;
    const bodyHtml = contentEl?.innerHTML.trim() || "";
    const bodyText = contentEl?.innerText.trim() || "";
    const note = noteEl?.value.trim() || "";
    const words = bodyText ? bodyText.split(/\s+/).length : 0;
    return { title, num, bodyHtml, bodyText, note, words };
  }

  /* ---------- Save & Publish ---------- */
  $("saveBtn")?.addEventListener("click", async () => {
    const { title, num, bodyHtml, bodyText, note, words } = readForm();

    if (!title) {
      return SwalOK
        ? Swal.fire({
            icon: "warning",
            title: "Missing title",
            text: "Please enter a chapter title.",
            confirmButtonColor: "#b8721f",
          })
        : alert("Please enter a chapter title.");
    }
    if (!bodyText) {
      return SwalOK
        ? Swal.fire({
            icon: "warning",
            title: "Empty content",
            text: "Please write some chapter content before publishing.",
            confirmButtonColor: "#b8721f",
          })
        : alert("Chapter content is empty.");
    }
    if (!num || num < 1) {
      return SwalOK
        ? Swal.fire({
            icon: "warning",
            title: "Invalid number",
            text: "Chapter number must be 1 or greater.",
            confirmButtonColor: "#b8721f",
          })
        : alert("Chapter number must be 1 or greater.");
    }

    const confirmed = SwalOK
      ? (
          await Swal.fire({
            icon: "question",
            title: "Save & publish this chapter?",
            showCancelButton: true,
            confirmButtonText: "Save",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#b8721f",
          })
        ).isConfirmed
      : confirm("Save & publish this chapter?");

    if (!confirmed) return;

    // Fresh read
    const fresh = getNovels();
    const freshNovel = fresh.find((n) => String(n.id) === String(novelId));
    if (!freshNovel) {
      return SwalOK
        ? Swal.fire({
            icon: "error",
            title: "Novel disappeared",
            text: "Please reload the page.",
            confirmButtonColor: "#b8721f",
          })
        : alert("Novel disappeared.");
    }

    if (!Array.isArray(freshNovel.chapters)) freshNovel.chapters = [];

    const data = {
      number: num,
      title,
      body: bodyHtml,
      authorNote: note,
      words,
      status: "published",
      lastUpdated: Date.now(),
    };

    if (isNewChapter) {
      freshNovel.chapters.push(data);
    } else {
      const idx = freshNovel.chapters.findIndex(
        (ch) => Number(ch.number) === Number(chapter.number),
      );
      if (idx !== -1) {
        freshNovel.chapters[idx] = {
          ...freshNovel.chapters[idx],
          ...data,
        };
      } else {
        freshNovel.chapters.push(data);
      }
    }

    // Re-sort + renumber sequentially
    freshNovel.chapters.sort(
      (a, b) => (Number(a.number) || 0) - (Number(b.number) || 0),
    );
    freshNovel.chapters.forEach((ch, i) => (ch.number = i + 1));

    freshNovel.updatedAt = Date.now();
    saveNovels(fresh);

    if (saveStatusEl) saveStatusEl.textContent = "All changes saved";

    if (SwalOK) {
      await Swal.fire({
        icon: "success",
        title: isNewChapter ? "Chapter created!" : "Chapter saved!",
        text: `"${title}" is now published.`,
        confirmButtonColor: "#b8721f",
      });
    } else {
      alert("Chapter saved.");
    }

    location.href = `author_view-novel.html?id=${encodeURIComponent(novelId)}`;
  });

  /* ---------- Delete chapter ---------- */
  $("deleteBtn")?.addEventListener("click", async () => {
    if (isNewChapter) {
      if (SwalOK) {
        Swal.fire({
          icon: "info",
          title: "Nothing to delete",
          text: "This chapter hasn't been saved yet.",
          confirmButtonColor: "#b8721f",
        }).then(
          () =>
            (location.href = `author_view-novel.html?id=${encodeURIComponent(novelId)}`),
        );
      }
      return;
    }

    const title = titleEl?.value.trim() || `Chapter ${nextNumber}`;

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

    const fresh = getNovels();
    const freshNovel = fresh.find((n) => String(n.id) === String(novelId));
    if (!freshNovel || !Array.isArray(freshNovel.chapters)) return;

    freshNovel.chapters = freshNovel.chapters.filter(
      (ch) => Number(ch.number) !== Number(chapter.number),
    );
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

    location.href = `author_view-novel.html?id=${encodeURIComponent(novelId)}`;
  });
});
