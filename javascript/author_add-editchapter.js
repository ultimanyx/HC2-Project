document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";

  const urlParams = new URLSearchParams(window.location.search);
  const novelId = urlParams.get("novelId");
  const chapterNum = urlParams.get("chapterNum");
  const isEditing = !!chapterNum;

  if (!novelId) {
    Swal.fire("Error", "No novel selected.", "error").then(() => {
      window.location.href = "author_all-novel.html";
    });
    return;
  }

  let novels = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  let novel = novels.find((n) => String(n.id) === String(novelId));

  if (!novel) {
    Swal.fire("Error", "Novel not found in database.", "error").then(() => {
      window.location.href = "author_all-novel.html";
    });
    return;
  }

  const isBookDraft = novel.status === "draft";
  const isBookPending = novel.status === "pending";

  // ---------- DOM Elements ----------
  const headerTitle = document.getElementById("headerTitle");
  const pageTitle = document.getElementById("pageTitle");
  const metaChapterLabel = document.getElementById("metaChapterLabel");
  const metaNovelName = document.getElementById("metaNovelName");
  const statusBadge = document.getElementById("statusBadge");

  const titleInput = document.getElementById("chapterTitle");
  const numberInput = document.getElementById("chapterNumber");
  const noteInput = document.getElementById("authorNote");
  const contentArea = document.getElementById("chapterContent");

  const saveBtn = document.getElementById("saveBtn");
  const saveDraftBtn = document.getElementById("saveDraftBtn");

  const wordCountEl = document.getElementById("wordCount");
  const charCountEl = document.getElementById("charCount");
  const readTimeEl = document.getElementById("readTime");

  // ---------- Initialize UI ----------
  metaNovelName.textContent = novel.title;

  if (isBookDraft) {
    statusBadge.textContent = "Draft Book";
    statusBadge.className = "badge draft";
    saveDraftBtn.style.display = "none";
    saveBtn.textContent = isEditing ? "Save Chapter" : "Add to Draft";
  } else if (isBookPending) {
    statusBadge.textContent = "Pending Review";
    statusBadge.className = "badge pending";
    saveDraftBtn.style.display = "inline-block";
    saveBtn.textContent = isEditing
      ? "Save Chapter for Review"
      : "Submit Chapter for Review";
  } else {
    statusBadge.textContent = "Ongoing";
    statusBadge.className = "badge active";
    saveDraftBtn.style.display = "inline-block";
    saveBtn.textContent = isEditing
      ? "Submit Changes for Review"
      : "Submit Chapter for Review";
  }

  if (isEditing) {
    headerTitle.textContent = "Edit Chapter";
    pageTitle.textContent = `Edit Chapter · ${novel.title}`;
    metaChapterLabel.textContent = `Editing Chapter ${chapterNum}`;

    const chapter = novel.chapters?.find(
      (c) => String(c.number) === String(chapterNum),
    );
    if (chapter) {
      titleInput.value = chapter.title || "";
      numberInput.value = chapter.number || 1;
      noteInput.value = chapter.authorNote || "";

      // Check if the content is plain text (no HTML tags) and format it
      let rawContent = chapter.content || chapter.body || "";

      if (!rawContent.includes("<p>") && !rawContent.includes("<br>")) {
        const paragraphs = rawContent.split(/\n\s*\n/);
        rawContent = paragraphs
          .map((p) => {
            if (!p.trim()) return "";
            return `<p>${p.trim().replace(/\n/g, "<br>")}</p>`;
          })
          .join("");
      }

      contentArea.innerHTML = rawContent;
    } else {
      Swal.fire("Not Found", "Chapter does not exist.", "error").then(() => {
        window.location.href = `author_view-novel.html?id=${novelId}`;
      });
    }
  } else {
    headerTitle.textContent = "Add Chapter";
    pageTitle.textContent = `Add Chapter · ${novel.title}`;
    metaChapterLabel.textContent = `New Chapter`;
    const nextNum = (novel.chapters?.length || 0) + 1;
    numberInput.value = nextNum;
  }

  // ---------- Editor Logic ----------
  function updateCounts() {
    const text = contentArea.innerText.trim();
    const chars = text.length;
    const words = text ? text.split(/\s+/).length : 0;
    const readTime = Math.ceil(words / 200);

    wordCountEl.textContent = words;
    charCountEl.textContent = chars;
    readTimeEl.textContent = readTime;
  }

  updateCounts();
  contentArea.addEventListener("input", updateCounts);

  // Intercept paste to keep paragraph line breaks
  contentArea.addEventListener("paste", function (e) {
    e.preventDefault();
    let text = (e.originalEvent || e).clipboardData.getData("text/plain");
    text = text.replace(/\r\n/g, "\n");
    const paragraphs = text.split(/\n\s*\n/);
    let html = paragraphs
      .map((p) => {
        if (!p.trim()) return "";
        const inner = p.trim().replace(/\n/g, "<br>");
        return `<p>${inner}</p>`;
      })
      .join("");
    document.execCommand("insertHTML", false, html);
  });

  document.querySelectorAll(".tool-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const action = btn.dataset.action;
      const value = btn.dataset.value || null;

      if (btn.id === "clearFormatBtn") {
        document.execCommand("removeFormat", false, null);
      } else if (action) {
        document.execCommand(action, false, value);
        contentArea.focus();
      }
    });
  });

  // ---------- Save Logic ----------
  function saveChapter(targetStatus) {
    const title = titleInput.value.trim();
    const number = parseInt(numberInput.value, 10);
    const note = noteInput.value.trim();
    const content = contentArea.innerHTML.trim();

    if (!title) {
      Swal.fire("Missing Title", "Please enter a chapter title.", "warning");
      titleInput.focus();
      return;
    }
    if (!content || content === "<br>") {
      Swal.fire(
        "Missing Content",
        "Please write some chapter content.",
        "warning",
      );
      contentArea.focus();
      return;
    }
    if (isNaN(number) || number < 1) {
      Swal.fire(
        "Invalid Number",
        "Please enter a valid chapter number.",
        "warning",
      );
      numberInput.focus();
      return;
    }

    if (!Array.isArray(novel.chapters)) novel.chapters = [];

    const isDuplicate = novel.chapters.some((c) => {
      const isSameNumber = Number(c.number) === number;
      const isSameChapter =
        isEditing && Number(c.number) === Number(chapterNum);
      return isSameNumber && !isSameChapter;
    });

    if (isDuplicate) {
      Swal.fire(
        "Duplicate Number",
        `Chapter ${number} already exists.`,
        "error",
      );
      numberInput.focus();
      return;
    }

    const wordCount = contentArea.innerText.trim()
      ? contentArea.innerText.trim().split(/\s+/).length
      : 0;

    let effectiveStatus = "draft";
    let statusMessage = "saved as draft";

    if (targetStatus === "published") {
      effectiveStatus = "pending";
      statusMessage = "submitted for admin review";
    }

    const chapterData = {
      number: number,
      title: title,
      content: content,
      body: content,
      authorNote: note,
      words: wordCount,
      status: effectiveStatus,
      lastUpdated: Date.now(),
    };

    if (isEditing) {
      const idx = novel.chapters.findIndex(
        (c) => String(c.number) === String(chapterNum),
      );
      if (idx !== -1) novel.chapters[idx] = chapterData;
    } else {
      novel.chapters.push(chapterData);
    }

    novel.chapters.sort((a, b) => a.number - b.number);
    novel.updatedAt = Date.now();

    const novelIndex = novels.findIndex(
      (n) => String(n.id) === String(novelId),
    );
    if (novelIndex !== -1) {
      novels[novelIndex] = novel;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novels));
    }

    // 🚨 AUTOMATIC RESOLVE: Clear the warning because the author took action
    localStorage.removeItem("author_alert_status");

    const actionText = isEditing ? "Updated" : "Added";

    Swal.fire({
      title: `Chapter ${actionText}!`,
      text: `"${title}" has been ${statusMessage}.`,
      icon: "success",
      confirmButtonText: "Continue",
    }).then(() => {
      if (isBookDraft) {
        window.location.href = `author_edit-draft.html?id=${novelId}`;
      } else {
        window.location.href = `author_view-novel.html?id=${novelId}`;
      }
    });
  }

  saveBtn.addEventListener("click", () => saveChapter("published"));
  saveDraftBtn.addEventListener("click", () => saveChapter("draft"));
});
