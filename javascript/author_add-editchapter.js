document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";

  // Get parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const novelId = urlParams.get("novelId");
  const chapterNum = urlParams.get("chapterNum");

  // If chapterNum exists, we are editing. If not, we are adding.
  const isEditing = !!chapterNum;

  if (!novelId) {
    Swal.fire("Error", "No novel selected.", "error").then(() => {
      window.location.href = "author_all-novel.html";
    });
    return;
  }

  // Load Novel
  let novels = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  let novel = novels.find((n) => String(n.id) === String(novelId));

  if (!novel) {
    Swal.fire("Error", "Novel not found in database.", "error").then(() => {
      window.location.href = "author_all-novel.html";
    });
    return;
  }

  const isBookDraft = novel.status === "draft";

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

  // Set Status Badge based on Novel
  if (isBookDraft) {
    statusBadge.textContent = "Draft Book";
    statusBadge.className = "badge draft";

    saveDraftBtn.style.display = "none";
    saveBtn.textContent = isEditing ? "Save Chapter" : "Add to Draft";
  } else {
    statusBadge.textContent = "Ongoing";
    statusBadge.className = "badge active";
    // If the book is ongoing, we can publish or save as draft.
    saveDraftBtn.style.display = "inline-block";
    saveBtn.textContent = isEditing ? "Save & Publish" : "Publish Chapter";
  }

  // Setup Add vs Edit Mode
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
      contentArea.innerHTML = chapter.content || "";
    } else {
      Swal.fire("Not Found", "Chapter does not exist.", "error").then(() => {
        window.location.href = `author_view-novel.html?id=${novelId}`;
      });
    }
  } else {
    headerTitle.textContent = "Add Chapter";
    pageTitle.textContent = `Add Chapter · ${novel.title}`;
    metaChapterLabel.textContent = `New Chapter`;

    // Auto-increment chapter number based on existing chapters
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

  // Toolbar buttons
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
  // targetStatus can be "published" or "draft"
  function saveChapter(targetStatus) {
    const title = titleInput.value.trim();
    const number = parseInt(numberInput.value, 10);
    const note = noteInput.value.trim();
    const content = contentArea.innerHTML.trim();

    // Validation
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

    // Check for duplicate chapter numbers
    const isDuplicate = novel.chapters.some((c) => {
      const isSameNumber = Number(c.number) === number;
      const isSameChapter =
        isEditing && Number(c.number) === Number(chapterNum);
      return isSameNumber && !isSameChapter;
    });

    if (isDuplicate) {
      Swal.fire(
        "Duplicate Number",
        `Chapter ${number} already exists. Please choose a different number.`,
        "error",
      );
      numberInput.focus();
      return;
    }

    const wordCount = contentArea.innerText.trim()
      ? contentArea.innerText.trim().split(/\s+/).length
      : 0;

    // Create the chapter object with the chosen status
    const chapterData = {
      number: number,
      title: title,
      content: content,
      authorNote: note,
      words: wordCount,
      status: targetStatus, // "published" or "draft"
      lastUpdated: Date.now(),
    };

    if (isEditing) {
      // Update existing chapter
      const idx = novel.chapters.findIndex(
        (c) => String(c.number) === String(chapterNum),
      );
      if (idx !== -1) novel.chapters[idx] = chapterData;
    } else {
      // Add new chapter
      novel.chapters.push(chapterData);
    }

    // Sort chapters by number
    novel.chapters.sort((a, b) => a.number - b.number);
    novel.updatedAt = Date.now();

    // Save back to localStorage
    const novelIndex = novels.findIndex(
      (n) => String(n.id) === String(novelId),
    );
    if (novelIndex !== -1) {
      novels[novelIndex] = novel;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novels));
    }

    // Success Message and Redirect
    const actionText = isEditing ? "Updated" : "Added";
    const statusText =
      targetStatus === "draft" ? "saved as draft" : "published";

    Swal.fire({
      title: `Chapter ${actionText}!`,
      text: `"${title}" has been ${statusText}.`,
      icon: "success",
      confirmButtonText: "Continue",
    }).then(() => {
      // THE FIX: Redirect to the correct page based on whether it's a draft or published book
      if (isBookDraft) {
        window.location.href = `author_edit-draft.html?id=${novelId}`;
      } else {
        window.location.href = `author_view-novel.html?id=${novelId}`;
      }
    });
  }

  // Wire up the buttons
  if (isBookDraft) {
    // If the book is a draft, the main button saves the chapter as a draft.
    saveBtn.addEventListener("click", () => saveChapter("draft"));
  } else {
    // If the book is ongoing, the main button publishes, and the secondary button saves as draft.
    saveBtn.addEventListener("click", () => saveChapter("published"));
    saveDraftBtn.addEventListener("click", () => saveChapter("draft"));
  }
});
