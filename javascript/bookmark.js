const BOOKMARK_KEY = "bookmarkedChapters";

const bookmarkButton = document.getElementById("bookmarkBtn");
const chapterNumber = document.getElementById("chapter-number");
const chapterTitle = document.getElementById("chapter-title");

if (bookmarkButton && chapterNumber) {
  // Get the novel ID from the HTML
  const bookId = document.body.dataset.bookId;

  function getBookmarks() {
    return JSON.parse(localStorage.getItem(BOOKMARK_KEY)) || {};
  }

  function saveBookmarks(bookmarks) {
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
  }

  function updateBookmarkButton() {
    const bookmarks = getBookmarks();
    const bookmark = bookmarks[bookId];

    const currentChapter = chapterNumber.textContent.trim();

    const bookmarkText = bookmarkButton.querySelector(".bookmark-text");

    if (bookmark && bookmark.chapter === currentChapter) {
      bookmarkButton.classList.add("bookmarked");

      if (bookmarkText) {
        bookmarkText.textContent = "Bookmarked";
      }
    } else {
      bookmarkButton.classList.remove("bookmarked");

      if (bookmarkText) {
        bookmarkText.textContent = "Bookmark";
      }
    }
  }

  bookmarkButton.addEventListener("click", function () {
    const bookmarks = getBookmarks();

    const currentChapter = chapterNumber.textContent.trim();

    const currentTitle = chapterTitle ? chapterTitle.textContent.trim() : "";

    const existingBookmark = bookmarks[bookId];

    // Remove bookmark
    if (existingBookmark && existingBookmark.chapter === currentChapter) {
      delete bookmarks[bookId];

      saveBookmarks(bookmarks);

      Swal.fire({
        title: "Bookmark Removed",
        text: `${currentChapter} has been removed.`,
        icon: "info",
      });
    } else {
      // Add or update bookmark
      bookmarks[bookId] = {
        chapter: currentChapter,
        title: currentTitle,
      };

      saveBookmarks(bookmarks);

      Swal.fire({
        title: "Chapter Bookmarked",
        text: `${currentChapter} has been saved.`,
        icon: "success",
      });
    }

    updateBookmarkButton();
  });

  // Check bookmark when the page loads
  updateBookmarkButton();
}
