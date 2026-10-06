const BOOKMARK_KEY = "bookmarkedChapters";

const bookmarkButton = document.getElementById("bookmarkBtn");
const bookmarkChapterNumber = document.getElementById("chapter-number");
const bookmarkChapterTitle = document.getElementById("chapter-title");

// Read bookmarks from localStorage
function getBookmarks() {
  const data = localStorage.getItem(BOOKMARK_KEY);
  if (data) {
    return JSON.parse(data);
  }
  return {};
}

// Save bookmarks to localStorage
function saveBookmarks(bookmarks) {
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
}

if (bookmarkButton && bookmarkChapterNumber) {
  // Book info comes from the <body> data attributes
  const bookId = document.body.dataset.bookId;
  const bookTitle = document.body.dataset.bookTitle;
  const bookAuthor = document.body.dataset.bookAuthor;
  const bookCover = document.body.dataset.bookCover;
  const bookRating = document.body.dataset.bookRating;
  const totalChapters = parseInt(document.body.dataset.totalChapters);

  const bookmarkText = bookmarkButton.querySelector(".bookmark-text");

  // "Chapter 12" -> 12
  function getChapterNumber() {
    const text = bookmarkChapterNumber.textContent.trim();
    const match = text.match(/\d+/);
    if (match) {
      return parseInt(match[0]);
    }
    return 1;
  }

  // Chapter 2 of 47 -> (2 / 47) * 100 = 4
  function calculateProgress(chapterNum) {
    if (totalChapters <= 0) {
      return 0;
    }
    const percent = (chapterNum / totalChapters) * 100;
    const rounded = Math.round(percent);
    if (rounded > 100) {
      return 100;
    }
    return rounded;
  }

  // Update the button text/color based on stored bookmark
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

  // When the Bookmark button is clicked
  bookmarkButton.addEventListener("click", function () {
    const bookmarks = getBookmarks();
    const currentChapter = bookmarkChapterNumber.textContent.trim();

    let currentTitle = "";
    if (bookmarkChapterTitle) {
      currentTitle = bookmarkChapterTitle.textContent.trim();
    }

    const existing = bookmarks[bookId];

    // Already bookmarked on this chapter -> remove it
    if (existing && existing.chapter === currentChapter) {
      delete bookmarks[bookId];
      saveBookmarks(bookmarks);

      // Also remove the book from the library
      const library = getLibraryBooks();
      const updatedLibrary = [];

      for (let i = 0; i < library.length; i++) {
        if (library[i].id !== bookId) {
          updatedLibrary.push(library[i]);
        }
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

    // Otherwise add/update the bookmark
    bookmarks[bookId] = {
      chapter: currentChapter,
      title: currentTitle,
    };
    saveBookmarks(bookmarks);

    // Work out the progress percentage
    const chapterNum = getChapterNumber();
    const progress = calculateProgress(chapterNum);

    // Update the library
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
      const newBook = {
        id: bookId,
        title: bookTitle,
        author: bookAuthor,
        cover: bookCover,
        rating: bookRating,
        progress: progress,
        status: "reading",
      };
      addBookToLibrary(newBook);
    }

    Swal.fire({
      title: "Chapter Bookmarked",
      text: currentChapter + " has been saved. Progress: " + progress + "%",
      icon: "success",
    });

    updateBookmarkButton();
  });

  // Run once when the page loads
  updateBookmarkButton();
}
