const BOOKMARK_KEY = "bookmarkedChapters";
const LIBRARY_KEY = "libraryBooks";

const bookmarkButton = document.getElementById("bookmarkBtn");
const bookmarkChapterNumber = document.getElementById("chapter-number");
const bookmarkChapterTitle = document.getElementById("chapter-title");

/* ============================================================
   STORAGE
   ============================================================ */

function getBookmarks() {
  const data = localStorage.getItem(BOOKMARK_KEY);
  if (data) return JSON.parse(data);
  return {};
}

function saveBookmarks(bookmarks) {
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
}

function getLibraryBooks() {
  const data = localStorage.getItem(LIBRARY_KEY);
  if (data) return JSON.parse(data);
  return [];
}

function saveLibraryBooks(books) {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(books));
}

function addBookToLibrary(book) {
  const books = getLibraryBooks();
  for (let i = 0; i < books.length; i++) {
    if (books[i].id === book.id) return false;
  }
  books.push(book);
  saveLibraryBooks(books);
  return true;
}

function removeFromLibrary(bookId) {
  const library = getLibraryBooks();
  const updated = library.filter(function (b) {
    return b.id !== bookId;
  });
  saveLibraryBooks(updated);
}

/* ============================================================
   PER-BOOK BOOKMARK LIST (with legacy migration)
   ============================================================ */

/** Returns an array of bookmark objects for a book. */
function getBookBookmarks(bookId) {
  const all = getBookmarks();
  const entry = all[bookId];
  if (!entry) return [];

  // Legacy shape: { chapter, title, position }
  if (entry.chapter && !entry.bookmarks) {
    return [
      {
        id: "legacy_" + bookId,
        chapter: entry.chapter,
        title: entry.title,
        position: entry.position,
        createdAt: 0,
      },
    ];
  }

  return entry.bookmarks || [];
}

/** Writes an array of bookmark objects for a book. */
function setBookBookmarks(bookId, list) {
  const all = getBookmarks();
  all[bookId] = { bookmarks: list };
  saveBookmarks(all);
}

/** Bookmarks that belong to a particular chapter. */
function getChapterBookmarks(bookId, chapterName) {
  return getBookBookmarks(bookId).filter(function (bm) {
    return bm.chapter === chapterName;
  });
}

/** The newest bookmark for a book (by createdAt). */
function getLatestBookmark(bookId) {
  const list = getBookBookmarks(bookId);
  if (!list.length) return null;
  let latest = list[0];
  for (let i = 1; i < list.length; i++) {
    if ((list[i].createdAt || 0) > (latest.createdAt || 0)) {
      latest = list[i];
    }
  }
  return latest;
}

/* ============================================================
   HIGHLIGHT HELPERS
   ============================================================ */

function clearExistingHighlight() {
  document.querySelectorAll(".reading-highlight").forEach(function (el) {
    const parent = el.parentNode;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
    parent.normalize();
  });
  document.querySelectorAll(".reading-highlight-block").forEach(function (el) {
    el.classList.remove("reading-highlight-block");
  });
}

function applyHighlightRange(paragraph, startOffset, length) {
  if (!paragraph || length <= 0) return false;

  const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
  let charCount = 0;
  let startNode = null,
    startOff = 0;
  let endNode = null,
    endOff = 0;
  let node;

  while ((node = walker.nextNode())) {
    const len = node.nodeValue.length;
    if (!startNode && charCount + len > startOffset) {
      startNode = node;
      startOff = startOffset - charCount;
    }
    if (!endNode && charCount + len >= startOffset + length) {
      endNode = node;
      endOff = startOffset + length - charCount;
      break;
    }
    charCount += len;
  }

  if (!startNode || !endNode) return false;

  try {
    const range = document.createRange();
    range.setStart(startNode, startOff);
    range.setEnd(endNode, endOff);
    const mark = document.createElement("mark");
    mark.className = "reading-highlight";
    range.surroundContents(mark);
    return true;
  } catch (e) {
    paragraph.classList.add("reading-highlight-block");
    return true;
  }
}

/* ============================================================
   SELECTION CAPTURE
   ============================================================ */

function captureSelection() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return { error: "empty" };
  if (sel.isCollapsed) return { error: "empty" };

  const range = sel.getRangeAt(0);
  const content = document.getElementById("chapter-content");
  if (!content) return { error: "outside" };
  if (!content.contains(range.commonAncestorContainer))
    return { error: "outside" };

  let startP = range.startContainer;
  while (startP && startP.nodeName !== "P") startP = startP.parentNode;
  let endP = range.endContainer;
  while (endP && endP.nodeName !== "P") endP = endP.parentNode;

  if (!startP || !endP) return { error: "outside" };
  if (startP !== endP) return { error: "multi" };

  const paragraphs = content.querySelectorAll("p");
  const paragraphIndex = Array.prototype.indexOf.call(paragraphs, startP);
  if (paragraphIndex === -1) return { error: "outside" };

  const preRange = document.createRange();
  preRange.selectNodeContents(startP);
  preRange.setEnd(range.startContainer, range.startOffset);
  const startOffset = preRange.toString().length;
  const length = range.toString().length;

  if (length <= 0) return { error: "empty" };

  return { paragraphIndex, startOffset, length };
}

/* ============================================================
   RESTORE — HIGHLIGHT EVERY BOOKMARK IN THIS CHAPTER
   ============================================================ */

function restoreBookmarkHighlights() {
  if (!bookmarkChapterNumber) return;

  const bookId = document.body.dataset.bookId;
  const currentChapter = bookmarkChapterNumber.textContent.trim();
  const chapterBms = getChapterBookmarks(bookId, currentChapter);

  clearExistingHighlight();
  if (!chapterBms.length) return;

  const content = document.getElementById("chapter-content");
  if (!content) return;
  const paragraphs = content.querySelectorAll("p");

  // Apply oldest first so the latest wins in overlapping cases
  const sorted = chapterBms.slice().sort(function (a, b) {
    return (a.createdAt || 0) - (b.createdAt || 0);
  });

  let latestP = null;

  sorted.forEach(function (bm, idx) {
    if (!bm.position) return;
    const p = paragraphs[bm.position.paragraphIndex];
    if (!p) return;

    let ok = false;

    if (
      typeof bm.position.startOffset === "number" &&
      typeof bm.position.length === "number"
    ) {
      ok = applyHighlightRange(p, bm.position.startOffset, bm.position.length);
    } else if (bm.position.snippet) {
      const text = p.textContent;
      const i = text.lastIndexOf(bm.position.snippet);
      if (i !== -1) {
        ok = applyHighlightRange(p, i, bm.position.snippet.length);
      }
    }

    if (ok && idx === sorted.length - 1) {
      latestP = p;
    }
  });

  if (latestP) {
    setTimeout(function () {
      const target = latestP.querySelector(".reading-highlight") || latestP;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  }
}

/* ============================================================
   LIBRARY SYNC — progress follows the LATEST bookmark
   ============================================================ */

function extractChapterNumber(chapterName) {
  const match = chapterName.match(/\d+/);
  return match ? parseInt(match[0]) : 1;
}

function syncLibraryWithBookmark(bookId, bookMeta) {
  const latest = getLatestBookmark(bookId);

  if (!latest) {
    removeFromLibrary(bookId);
    return;
  }

  const totalChapters = parseInt(document.body.dataset.totalChapters) || 0;
  const chapterNum = extractChapterNumber(latest.chapter);

  let progress = 0;
  if (totalChapters > 0) {
    progress = Math.round((chapterNum / totalChapters) * 100);
    if (progress > 100) progress = 100;
    if (progress < 0) progress = 0;
  }

  const library = getLibraryBooks();
  let found = false;
  for (let i = 0; i < library.length; i++) {
    if (library[i].id === bookId) {
      library[i].progress = progress;
      library[i].status = "reading";
      found = true;
      break;
    }
  }

  if (found) {
    saveLibraryBooks(library);
  } else if (bookMeta) {
    addBookToLibrary({
      id: bookId,
      title: bookMeta.title,
      author: bookMeta.author,
      cover: bookMeta.cover,
      rating: bookMeta.rating,
      progress: progress,
      status: "reading",
    });
  }
}

/* ============================================================
   MAIN LOGIC
   ============================================================ */

if (bookmarkButton && bookmarkChapterNumber) {
  const bookId = document.body.dataset.bookId;
  const bookMeta = {
    title: document.body.dataset.bookTitle,
    author: document.body.dataset.bookAuthor,
    cover: document.body.dataset.bookCover,
    rating: document.body.dataset.bookRating,
  };

  const bookmarkText = bookmarkButton.querySelector(".bookmark-text");

  let isSelectingBookmark = false;
  let pointerDownInContent = false;
  let hintEl = null;

  /* ---- Button state ---- */
  function updateBookmarkButton() {
    if (isSelectingBookmark) {
      bookmarkButton.classList.add("selecting");
      bookmarkButton.classList.remove("bookmarked");
      bookmarkText.textContent = "Select text…";
      return;
    }

    bookmarkButton.classList.remove("selecting");

    const currentChapter = bookmarkChapterNumber.textContent.trim();
    const chapterBms = getChapterBookmarks(bookId, currentChapter);

    if (chapterBms.length > 0) {
      bookmarkButton.classList.add("bookmarked");
      bookmarkText.textContent =
        chapterBms.length === 1
          ? "Bookmarked"
          : `Bookmarked (${chapterBms.length})`;
    } else {
      bookmarkButton.classList.remove("bookmarked");
      bookmarkText.textContent = "Bookmark";
    }
  }

  /* ---- Hint banner ---- */
  function showHint(text) {
    if (!hintEl) {
      hintEl = document.createElement("div");
      hintEl.className = "bookmark-hint";
      document.body.appendChild(hintEl);
    }
    hintEl.textContent = text;
    void hintEl.offsetWidth;
    hintEl.classList.add("active");
  }

  function hideHint() {
    if (hintEl) hintEl.classList.remove("active");
  }

  function enterSelectMode() {
    isSelectingBookmark = true;
    updateBookmarkButton();
    showHint("Select the text you want to bookmark");
  }

  function exitSelectMode() {
    isSelectingBookmark = false;
    hideHint();
    updateBookmarkButton();
  }

  /* ---- Save one new bookmark from selection ---- */
  function saveBookmarkWithSelection(position) {
    const currentChapter = bookmarkChapterNumber.textContent.trim();
    const currentTitle = bookmarkChapterTitle
      ? bookmarkChapterTitle.textContent.trim()
      : "";

    const list = getBookBookmarks(bookId);
    list.push({
      id: "bm_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
      chapter: currentChapter,
      title: currentTitle,
      position: position,
      createdAt: Date.now(),
    });
    setBookBookmarks(bookId, list);

    // Library progress follows the latest bookmark
    syncLibraryWithBookmark(bookId, bookMeta);

    // Swap the native selection for our persistent <mark>
    window.getSelection().removeAllRanges();

    exitSelectMode();
    restoreBookmarkHighlights();

    const latest = getLatestBookmark(bookId);
    const latestChapterNum = latest ? extractChapterNumber(latest.chapter) : 0;
    const totalChapters = parseInt(document.body.dataset.totalChapters) || 0;
    const libProgress =
      totalChapters > 0
        ? Math.min(100, Math.round((latestChapterNum / totalChapters) * 100))
        : 0;

    Swal.fire({
      title: "Bookmark Saved",
      text:
        currentChapter +
        " · new bookmark added. Library progress: " +
        libProgress +
        "%",
      icon: "success",
    });
  }

  /* ---- Remove all bookmarks for THIS chapter only ---- */
  function removeAllBookmarksForChapter() {
    const currentChapter = bookmarkChapterNumber.textContent.trim();
    const remaining = getBookBookmarks(bookId).filter(function (bm) {
      return bm.chapter !== currentChapter;
    });

    if (remaining.length === 0) {
      const all = getBookmarks();
      delete all[bookId];
      saveBookmarks(all);
    } else {
      setBookBookmarks(bookId, remaining);
    }

    // Progress follows the *new* latest bookmark (or library removed)
    syncLibraryWithBookmark(bookId, null);

    clearExistingHighlight();
    updateBookmarkButton();

    Swal.fire({
      title: "Bookmarks Removed",
      text: "All bookmarks on " + currentChapter + " were removed.",
      icon: "info",
    });
  }

  /* ---- Capture a valid selection ---- */
  function tryCaptureSelection() {
    const result = captureSelection();
    if (!result) return;
    if (result.error === "empty") return;

    if (result.error === "outside") {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "warning",
        title: "Select text inside the chapter",
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      });
      return;
    }

    if (result.error === "multi") {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "warning",
        title: "Please select within a single paragraph",
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      });
      return;
    }

    saveBookmarkWithSelection({
      paragraphIndex: result.paragraphIndex,
      startOffset: result.startOffset,
      length: result.length,
    });
  }

  /* ============================================================
     EVENT WIRING
     ============================================================ */

  bookmarkButton.addEventListener("click", function () {
    if (isSelectingBookmark) {
      exitSelectMode();
      return;
    }

    const currentChapter = bookmarkChapterNumber.textContent.trim();
    const chapterBms = getChapterBookmarks(bookId, currentChapter);

    // No bookmarks on this chapter → enter select mode
    if (chapterBms.length === 0) {
      enterSelectMode();
      return;
    }

    // Has bookmarks → ask what to do
    Swal.fire({
      title: "Chapter Bookmarks",
      html:
        "You have <strong>" +
        chapterBms.length +
        "</strong> bookmark" +
        (chapterBms.length !== 1 ? "s" : "") +
        " on this chapter.",
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: "Add Another",
      denyButtonText: "Remove All",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#b8721f",
      denyButtonColor: "#dc2626",
      cancelButtonColor: "#6b6680",
    }).then(function (result) {
      if (result.isConfirmed) enterSelectMode();
      else if (result.isDenied) removeAllBookmarksForChapter();
    });
  });

  document.addEventListener("pointerdown", function (e) {
    const content = document.getElementById("chapter-content");
    pointerDownInContent = !!(content && content.contains(e.target));
  });

  document.addEventListener("pointerup", function () {
    if (!isSelectingBookmark) return;
    if (!pointerDownInContent) return;
    setTimeout(tryCaptureSelection, 20);
  });

  document.addEventListener("keydown", function (e) {
    if (isSelectingBookmark && e.key === "Escape") exitSelectMode();
  });

  window.addEventListener("storage", function (e) {
    if (e.key === BOOKMARK_KEY) {
      if (isSelectingBookmark) exitSelectMode();
      updateBookmarkButton();
      restoreBookmarkHighlights();
    }
  });

  window.addEventListener("pageshow", function (e) {
    if (e.persisted) {
      updateBookmarkButton();
      restoreBookmarkHighlights();
    }
  });

  /* ---- Init ---- */
  updateBookmarkButton();
  restoreBookmarkHighlights();
}
