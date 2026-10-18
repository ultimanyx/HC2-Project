document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";
  const novelId = new URLSearchParams(location.search).get("novelId");

  const titleInput = document.getElementById("chapterTitle");
  const numberInput = document.getElementById("chapterNumber");
  const editor = document.getElementById("chapterContent");
  const wordCountEl = document.getElementById("wordCount");
  const charCountEl = document.getElementById("charCount");

  // ---- Word / char counter ----
  function updateCounts() {
    const text = editor.textContent.trim();
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    if (wordCountEl) wordCountEl.textContent = words;
    if (charCountEl) charCountEl.textContent = text.length;
  }
  editor?.addEventListener("input", updateCounts);
  updateCounts();

  // ---- Compute the next chapter number for a novel ----
  function getNextChapterNumber(novel) {
    if (!novel) return 1;
    if (Array.isArray(novel.chapters)) {
      if (novel.chapters.length === 0) return 1;
      const max = novel.chapters.reduce(
        (m, c) => Math.max(m, Number(c.number) || 0),
        0,
      );
      return max + 1;
    }
    return (Number(novel.chapters) || 0) + 1;
  }

  // ---- Pre-fill the chapter number input ----
  let currentNovel = null;
  if (novelId) {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    currentNovel = all.find((n) => String(n.id) === String(novelId)) || null;
    if (currentNovel) {
      numberInput.value = getNextChapterNumber(currentNovel);
    }
  }

  // ---- Save buttons ----
  const draftBtn = document.getElementById("saveDraftBtn");
  const publishBtn = document.getElementById("saveBtn");

  function saveChapter(status) {
    if (!novelId) {
      Swal.fire({
        icon: "error",
        title: "No novel selected",
        text: "Open this page from a novel.",
      });
      return;
    }

    const title = titleInput.value.trim();
    const body = editor.innerHTML.trim();
    const bodyText = editor.textContent.trim();

    if (!title || !bodyText) {
      Swal.fire({
        icon: "warning",
        title: "Missing content",
        text: "Chapter title and content are required.",
      });
      return;
    }

    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const idx = all.findIndex((n) => String(n.id) === String(novelId));
    if (idx === -1) {
      Swal.fire({ icon: "error", title: "Novel not found" });
      return;
    }

    const novel = all[idx];

    // Ensure it's an array
    if (!Array.isArray(novel.chapters)) novel.chapters = [];

    const chosen = Number(numberInput.value);
    const newNumber =
      Number.isFinite(chosen) && chosen >= 1
        ? chosen
        : getNextChapterNumber(novel);

    // Duplicate guard
    if (novel.chapters.some((c) => Number(c.number) === newNumber)) {
      Swal.fire({
        icon: "warning",
        title: "Chapter number already in use",
        text: `Chapter ${newNumber} already exists.`,
      });
      return;
    }

    // Push the new chapter
    novel.chapters.push({
      number: newNumber,
      title,
      body, // view page uses `body`
      content: body, // edit page uses `content`
      status,
      words: bodyText.split(/\s+/).filter(Boolean).length,
      lastUpdated: Date.now(),
    });

    // Sort them correctly
    novel.chapters.sort(
      (a, b) => (Number(a.number) || 0) - (Number(b.number) || 0),
    );

    novel.lastEdited = Date.now();
    all[idx] = novel;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

    Swal.fire({
      icon: "success",
      title:
        status === "draft" ? "Chapter saved as draft" : "Chapter published",
      text: `Chapter ${newNumber} added.`,
    }).then(() => {
      location.href = `author_view-novel.html?id=${novelId}`;
    });
  }

  draftBtn?.addEventListener("click", () => saveChapter("draft"));
  publishBtn?.addEventListener("click", () => saveChapter("published"));
});
