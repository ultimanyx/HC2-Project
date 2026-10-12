document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";
  const novelId = new URLSearchParams(location.search).get("novelId");

  const titleInput = document.getElementById("chapterTitle");
  const numberInput = document.getElementById("chapterNumber");
  const editor = document.getElementById("chapterContent");
  const wordCountEl = document.getElementById("wordCount");
  const charCountEl = document.getElementById("charCount");

  // ---- Word/char counter ----
  function updateCounts() {
    const text = editor.textContent.trim();
    const words = text ? text.split(/\s+/).length : 0;
    if (wordCountEl) wordCountEl.textContent = words;
    if (charCountEl) charCountEl.textContent = text.length;
  }
  editor?.addEventListener("input", updateCounts);

  // ---- Determine save button (draft vs publish) ----
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
        confirmButtonColor: "#b8721f",
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
    novel.chapters = novel.chapters || [];

    const newNumber = Number(numberInput.value) || novel.chapters.length + 1;

    novel.chapters.push({
      number: newNumber,
      title,
      body,
      status,
      words: bodyText.split(/\s+/).length,
      lastUpdated: new Date().toISOString(),
    });

    // If the chapter is published, ensure the novel itself is published
    if (status === "published" && novel.status === "draft") {
      // keep the novel as draft unless the author publishes separately
    }

    novel.lastEdited = new Date().toISOString();
    all[idx] = novel;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

    Swal.fire({
      icon: "success",
      title:
        status === "draft" ? "Chapter saved as draft" : "Chapter published",
      confirmButtonColor: "#b8721f",
    }).then(() => {
      location.href = `author_view-novel.html?id=${novelId}`;
    });
  }

  draftBtn?.addEventListener("click", () => saveChapter("draft"));
  publishBtn?.addEventListener("click", () => saveChapter("published"));
});
