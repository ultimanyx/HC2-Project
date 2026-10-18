document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";
  const params = new URLSearchParams(location.search);
  const novelId = params.get("novelId");
  const chapterNumParam = params.get("chapterNum");

  // ---------- DOM refs ----------
  const titleInput = document.getElementById("chapterTitle");
  const numberInput = document.getElementById("chapterNumber");
  const authorNoteInput = document.getElementById("authorNote");
  const contentEl = document.getElementById("chapterContent");
  const wordCountEl = document.getElementById("wordCount");
  const charCountEl = document.getElementById("charCount");
  const readTimeEl = document.getElementById("readTime");
  const saveDraftBtn = document.getElementById("saveDraftBtn");
  const saveBtn = document.getElementById("saveBtn");
  const deleteBtn = document.getElementById("deleteBtn");
  const saveStatusEl = document.getElementById("saveStatus");
  const statusBadgeEl = document.getElementById("statusBadge");
  const chapterNumLabel = document.querySelector(".chapter-num");
  const novelNameEl = document.querySelector(".novel-name");

  // ---------- Helpers ----------
  function showDemoMessage() {
    Swal.fire({
      icon: "info",
      title: "Demo Preview",
      text: "This is placeholder content. Open this page from a novel's chapter list to add a real chapter.",
      confirmButtonText: "OK",
    });
  }

  function updateCounts() {
    const text = contentEl.innerText || "";
    const chars = text.length;
    const words = text.trim()
      ? text.trim().split(/\s+/).filter(Boolean).length
      : 0;
    const readTime = words > 0 ? Math.max(1, Math.ceil(words / 200)) : 0;
    if (wordCountEl) wordCountEl.textContent = words.toLocaleString();
    if (charCountEl) charCountEl.textContent = chars.toLocaleString();
    if (readTimeEl) readTimeEl.textContent = readTime;
  }

  function markUnsaved() {
    if (saveStatusEl) saveStatusEl.textContent = "Unsaved changes";
  }

  function markSaved() {
    if (saveStatusEl) saveStatusEl.textContent = "All changes saved";
  }

  // ---------- Toolbar (works in every mode) ----------
  document.querySelectorAll(".tool-btn[data-action]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const action = btn.dataset.action;
      const value = btn.dataset.value;
      contentEl.focus();
      if (action === "formatBlock" && value) {
        document.execCommand("formatBlock", false, value);
      } else {
        document.execCommand(action, false, null);
      }
      updateCounts();
      markUnsaved();
    });
  });

  const clearBtn = document.getElementById("clearFormatBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", (e) => {
      e.preventDefault();
      contentEl.focus();
      document.execCommand("removeFormat", false, null);
      updateCounts();
      markUnsaved();
    });
  }

  contentEl?.addEventListener("input", () => {
    updateCounts();
    markUnsaved();
  });
  titleInput?.addEventListener("input", markUnsaved);
  numberInput?.addEventListener("input", markUnsaved);
  authorNoteInput?.addEventListener("input", markUnsaved);

  updateCounts();

  // ---------- DEMO MODE: no novelId at all ----------
  if (!novelId) {
    saveDraftBtn?.addEventListener("click", showDemoMessage);
    saveBtn?.addEventListener("click", showDemoMessage);
    deleteBtn?.addEventListener("click", showDemoMessage);
    return;
  }

  // ---------- Load novel ----------
  const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const novel = raw.find((n) => String(n.id) === String(novelId));

  if (!novel) {
    Swal.fire("Not Found", "This novel doesn't exist.", "error").then(() => {
      window.location.href = "author_draft-novel.html";
    });
    return;
  }

  const chapter =
    Array.isArray(novel.chapters) && chapterNumParam
      ? novel.chapters.find((c) => String(c.number) === String(chapterNumParam))
      : null;

  const isEditMode = !!chapter;

  // ---------- Populate form ----------
  if (isEditMode) {
    // ---- EDIT MODE ----
    titleInput.value = chapter.title || "";
    numberInput.value = chapter.number || 1;
    authorNoteInput.value = chapter.authorNote || "";
    contentEl.innerHTML = chapter.content || "<p><br></p>";

    if (chapterNumLabel)
      chapterNumLabel.textContent = `Chapter ${chapter.number}`;
    if (novelNameEl) novelNameEl.textContent = novel.title || "";
    if (statusBadgeEl) {
      statusBadgeEl.textContent =
        chapter.status === "draft" ? "Draft" : "Published";
      statusBadgeEl.className = `badge ${chapter.status === "draft" ? "draft" : "active"}`;
    }
    markSaved();
  } else {
    // ---- ADD MODE ----
    // Auto-suggest the next chapter number (max existing + 1)
    const nums = Array.isArray(novel.chapters)
      ? novel.chapters.map((c) => Number(c.number) || 0)
      : [];
    numberInput.value = nums.length ? Math.max(...nums) + 1 : 1;

    if (novelNameEl) novelNameEl.textContent = novel.title || "";
    if (chapterNumLabel) chapterNumLabel.textContent = "New Chapter";
    if (statusBadgeEl) {
      statusBadgeEl.textContent = "Draft";
      statusBadgeEl.className = "badge draft";
    }
    // saveStatusEl keeps its "Not saved yet" HTML value
  }

  updateCounts();

  // ---------- Save ----------
  // In add mode, if the user saves once and stays on the page, subsequent
  // saves must UPDATE the chapter we just created, not push a duplicate.
  let savedNumInAddMode = null;

  function save(status, { redirect = false } = {}) {
    const title = titleInput.value.trim();
    const num = parseInt(numberInput.value, 10);

    if (!title) {
      Swal.fire("Missing title", "Please enter a chapter title.", "warning");
      return;
    }
    if (!num || num < 1) {
      Swal.fire(
        "Invalid number",
        "Chapter number must be 1 or greater.",
        "warning",
      );
      return;
    }

    const content = contentEl.innerHTML;
    const words = contentEl.innerText.trim()
      ? contentEl.innerText.trim().split(/\s+/).filter(Boolean).length
      : 0;

    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const nIdx = list.findIndex((n) => String(n.id) === String(novelId));
    if (nIdx < 0) {
      Swal.fire("Not found", "Novel no longer exists.", "error");
      return;
    }

    const chapters = Array.isArray(list[nIdx].chapters)
      ? [...list[nIdx].chapters]
      : [];

    // Which existing chapter (if any) are we replacing?
    const editingNum = isEditMode
      ? parseInt(chapterNumParam, 10)
      : savedNumInAddMode; // null on first save in add mode

    const idx =
      editingNum != null
        ? chapters.findIndex((c) => Number(c.number) === editingNum)
        : -1;

    // Duplicate-number guard (excluding ourselves)
    const duplicate = chapters.find(
      (c) => Number(c.number) === num && Number(c.number) !== editingNum,
    );
    if (duplicate) {
      Swal.fire(
        "Duplicate number",
        `Chapter ${num} already exists. Pick a different number.`,
        "warning",
      );
      return;
    }

    const data = {
      number: num,
      title,
      content,
      authorNote: authorNoteInput.value.trim(),
      words,
      status,
      lastUpdated: Date.now(),
    };

    if (idx >= 0) chapters[idx] = { ...chapters[idx], ...data };
    else chapters.push(data);

    chapters.sort((a, b) => (a.number || 0) - (b.number || 0));

    list[nIdx].chapters = chapters;
    list[nIdx].lastEdited = Date.now();

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      Swal.fire(
        "Couldn't save",
        "Storage quota exceeded. Try removing a large cover image.",
        "error",
      );
      return;
    }

    if (chapterNumLabel) chapterNumLabel.textContent = `Chapter ${num}`;
    if (statusBadgeEl) {
      statusBadgeEl.textContent = status === "draft" ? "Draft" : "Published";
      statusBadgeEl.className = `badge ${status === "draft" ? "draft" : "active"}`;
    }
    markSaved();

    if (!isEditMode) savedNumInAddMode = num;

    Swal.fire({
      icon: "success",
      title: isEditMode ? "Changes Saved" : "Chapter Added",
      text: isEditMode
        ? `"${title}" has been updated.`
        : `"${title}" has been added to the draft.`,
      confirmButtonText: "OK",
    }).then(() => {
      if (redirect) {
        window.location.href = `author_edit-draft.html?id=${encodeURIComponent(novelId)}`;
      }
    });
  }

  // "Add Chapter" — save as draft then redirect to the novel's edit page
  saveBtn?.addEventListener("click", () => {
    const status = isEditMode ? chapter?.status || "draft" : "draft";
    save(status, { redirect: true });
  });

  // ---------- Delete (only exists on the edit page) ----------
  deleteBtn?.addEventListener("click", () => {
    Swal.fire({
      title: "Delete this chapter?",
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#c0392b",
      cancelButtonText: "Cancel",
    }).then((res) => {
      if (!res.isConfirmed) return;
      const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const nIdx = list.findIndex((n) => String(n.id) === String(novelId));
      if (nIdx < 0) return;

      const chapters = Array.isArray(list[nIdx].chapters)
        ? list[nIdx].chapters
        : [];
      const originalNum = parseInt(chapterNumParam, 10);

      list[nIdx].chapters = chapters.filter(
        (c) => Number(c.number) !== originalNum,
      );
      list[nIdx].lastEdited = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Chapter has been removed.",
        confirmButtonText: "OK",
      }).then(() => history.back());
    });
  });
});
