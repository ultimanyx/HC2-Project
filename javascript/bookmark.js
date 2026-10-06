const BOOKMARK_KEY = "bookmarkedChapters";
const LIBRARY_KEY = "libraryBooks";

const bookmarkButton = document.getElementById("bookmarkBtn");
const bookmarkChapterNumber = document.getElementById("chapter-number");
const bookmarkChapterTitle = document.getElementById("chapter-title");

// ---- Bookmarks ----
function getBookmarks() {
  const data = localStorage.getItem(BOOKMARK_KEY);
  if (data) return JSON.parse(data);
  return {};
}

function saveBookmarks(bookmarks) {
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
}

// ---- Library (self-contained copies) ----
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

if (bookmarkButton && bookmarkChapterNumber) {
  const bookId = document.body.dataset.bookId;
  const bookTitle = document.body.dataset.bookTitle;
  const bookAuthor = document.body.dataset.bookAuthor;
  const bookCover = document.body.dataset.bookCover;
  const bookRating = document.body.dataset.bookRating;
  const totalChapters = parseInt(document.body.dataset.totalChapters);

  const bookmarkText = bookmarkButton.querySelector(".bookmark-text");

  function getChapterNumber() {
    const text = bookmarkChapterNumber.textContent.trim();
    const match = text.match(/\d+/);
    if (match) return parseInt(match[0]);
    return 1;
  }

  function calculateProgress(chapterNum) {
    if (totalChapters <= 0) return 0;
    const percent = (chapterNum / totalChapters) * 100;
    const rounded = Math.round(percent);
    if (rounded > 100) return 100;
    return rounded;
  }

  function updateBookmarkButton() {
    const bookmarks = getBookmarks();
    const bookmark = bookmarks[bookId];
    const currentChapter = bookmarkChapterNumber.textContent.trim();

    if (bookmark && bookmark.chapter === currentChapter) {
      bookmarkButton.classList.add("bookmarked");
      bookmarkText.textContent = "Bookmarked";
    } else {
      bookmarkButton.classList.remove("bookmarked");
      bookmarkText.textContent = "Bookmark";
    }
  }

  bookmarkButton.addEventListener("click", function () {
    const bookmarks = getBookmarks();
    const currentChapter = bookmarkChapterNumber.textContent.trim();

    let currentTitle = "";
    if (bookmarkChapterTitle) {
      currentTitle = bookmarkChapterTitle.textContent.trim();
    }

    const existing = bookmarks[bookId];

    // ---- Remove bookmark + remove from library ----
    if (existing && existing.chapter === currentChapter) {
      delete bookmarks[bookId];
      saveBookmarks(bookmarks);

      const library = getLibraryBooks();
      const updatedLibrary = [];
      for (let i = 0; i < library.length; i++) {
        if (library[i].id !== bookId) updatedLibrary.push(library[i]);
      }
      saveLibraryBooks(updatedLibrary);

      Swal.fire({
        title: "Bookmark Removed",
        text: currentChapter + " has been removed from your library.",
        icon: "info",
      });

      updateBookmarkButton();
      return;
    }

    // ---- Add bookmark + add/update library ----
    bookmarks[bookId] = {
      chapter: currentChapter,
      title: currentTitle,
    };
    saveBookmarks(bookmarks);

    const chapterNum = getChapterNumber();
    const progress = calculateProgress(chapterNum);

    const library = getLibraryBooks();
    let found = false;
    for (let i = 0; i < library.length; i++) {
      if (library[i].id === bookId) {
        library[i].progress = progress;
        found = true;
        break;
      }
    }

    if (found) {
      saveLibraryBooks(library);
    } else {
      addBookToLibrary({
        id: bookId,
        title: bookTitle,
        author: bookAuthor,
        cover: bookCover,
        rating: bookRating,
        progress: progress,
        status: "reading",
      });
    }

    Swal.fire({
      title: "Chapter Bookmarked",
      text: currentChapter + " has been saved. Progress: " + progress + "%",
      icon: "success",
    });

    updateBookmarkButton();
  });

  // React to changes made in another tab
  window.addEventListener("storage", function (e) {
    if (e.key === BOOKMARK_KEY) updateBookmarkButton();
  });

  updateBookmarkButton();
}
