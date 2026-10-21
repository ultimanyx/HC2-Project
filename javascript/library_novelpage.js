/* ============================================================
   LIBRARY HELPERS
   ============================================================ */

const LIBRARY_KEY = "libraryBooks";
const BOOKMARK_KEY = "bookmarkedChapters";

function removeBookmarkForBook(bookId) {
  const data = localStorage.getItem(BOOKMARK_KEY);
  if (!data) return;
  const bookmarks = JSON.parse(data);
  delete bookmarks[bookId];
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

function isInLibrary(bookId) {
  const books = getLibraryBooks();
  for (let i = 0; i < books.length; i++) {
    if (books[i].id === bookId) return true;
  }
  return false;
}

function addBookToLibrary(book) {
  const books = getLibraryBooks();
  if (isInLibrary(book.id)) return false;
  books.push(book);
  saveLibraryBooks(books);
  return true;
}

function removeBookFromLibrary(bookId) {
  const books = getLibraryBooks();
  const updatedBooks = [];
  for (let i = 0; i < books.length; i++) {
    if (books[i].id !== bookId) updatedBooks.push(books[i]);
  }
  if (updatedBooks.length === books.length) return false;
  saveLibraryBooks(updatedBooks);
  return true;
}

function toggleLibraryBook(book) {
  if (isInLibrary(book.id)) {
    removeBookFromLibrary(book.id);
    return "removed";
  }
  addBookToLibrary(book);
  return "added";
}

/* ============================================================
   NOVEL PAGE — DYNAMIC CHAPTER NAVIGATION (ALWAYS 20 PER TABLE)
   ============================================================ */

const chapterSelect = document.getElementById("chapter-number");
const previousButton = document.getElementById("prevBtn");
const nextButton = document.getElementById("nextBtn");
const chapterRows = document.querySelectorAll("#chapter-list tr");

if (chapterSelect && previousButton && nextButton && chapterRows.length > 0) {
  const chapterGroups = [];
  const rowsPerGroup = 10;

  const totalChapters = parseInt(document.body.dataset.totalChapters) || 0;

  let validRowCount = 0;

  for (let i = 0; i < chapterRows.length; i++) {
    const row = chapterRows[i];

    // FIXED: Check if the row has any TEXT inside its links,
    // regardless of whether the href is empty or not.
    const hasText = Array.from(row.querySelectorAll("a")).some((a) => {
      return a.textContent.trim() !== "";
    });

    if (!hasText) {
      // Hide completely empty rows (like the padding row at the bottom)
      row.style.display = "none";
      continue;
    }

    const groupIndex = Math.floor(validRowCount / rowsPerGroup);
    validRowCount++;

    let startChapter = groupIndex * 20 + 1;
    let endChapter = (groupIndex + 1) * 20;

    if (totalChapters > 0 && endChapter > totalChapters) {
      endChapter = totalChapters;
    }

    const groupName = `${startChapter}-${endChapter}`;
    row.dataset.group = groupName;

    if (!chapterGroups.includes(groupName)) {
      chapterGroups.push(groupName);
    }
  }

  chapterSelect.innerHTML = "";
  chapterGroups.forEach((group) => {
    const option = document.createElement("option");
    option.value = group;
    option.textContent = `Chapter: ${group}`;
    chapterSelect.appendChild(option);
  });

  function showChapterGroup(group) {
    for (let i = 0; i < chapterRows.length; i++) {
      chapterRows[i].style.display = "none";
    }
    for (let i = 0; i < chapterRows.length; i++) {
      if (chapterRows[i].dataset.group === group) {
        chapterRows[i].style.display = "";
      }
    }

    chapterSelect.value = group;

    const currentIndex = chapterGroups.indexOf(group);
    previousButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === chapterGroups.length - 1;
  }

  chapterSelect.addEventListener("change", function () {
    showChapterGroup(this.value);
  });

  previousButton.addEventListener("click", function () {
    const currentIndex = chapterGroups.indexOf(chapterSelect.value);
    if (currentIndex > 0) {
      showChapterGroup(chapterGroups[currentIndex - 1]);
    }
  });

  nextButton.addEventListener("click", function () {
    const currentIndex = chapterGroups.indexOf(chapterSelect.value);
    if (currentIndex < chapterGroups.length - 1) {
      showChapterGroup(chapterGroups[currentIndex + 1]);
    }
  });

  showChapterGroup(chapterGroups[0]);
}

/* ============================================================
   NOVEL PAGE — HIGHLIGHT + ICON FOR BOOKMARKED CHAPTER
   ============================================================ */

const bookTitleElement = document.getElementById("titleBook");

function highlightBookmarkedChapter() {
  if (!bookTitleElement) return;

  const bookTitle = bookTitleElement.textContent.trim();
  const bookId = bookTitle.toLowerCase().replace(/\s+/g, "-");

  const chapterLinks = document.querySelectorAll("#chapter-list td a");

  // Reset previous state
  chapterLinks.forEach(function (link) {
    link.classList.remove("bookmarked-chapter-highlight");
    link.classList.remove("chapter-has-bookmark");
    const icon = link.querySelector(".chapter-bookmark-icon");
    if (icon) icon.remove();
  });

  const bookmarksData = localStorage.getItem(BOOKMARK_KEY);
  if (!bookmarksData) return;

  const allBookmarks = JSON.parse(bookmarksData);
  const entry = allBookmarks[bookId];
  if (!entry) return;

  // Normalize legacy / new format into a plain list
  let bookmarks = [];
  if (entry.bookmarks) {
    bookmarks = entry.bookmarks;
  } else if (entry.chapter) {
    bookmarks = [entry];
  }

  if (bookmarks.length === 0) return;

  // Find all bookmarked chapters AND identify the latest one
  const chaptersWithBookmarks = new Set();
  let latestChapter = null;
  let maxTime = -1;

  bookmarks.forEach(function (bm) {
    if (bm && bm.chapter) {
      chaptersWithBookmarks.add(bm.chapter);
      const time = bm.createdAt || 0;
      if (time > maxTime) {
        maxTime = time;
        latestChapter = bm.chapter;
      }
    }
  });

  if (chaptersWithBookmarks.size === 0) return;

  // Apply styles
  chapterLinks.forEach(function (link) {
    const linkText = link.textContent.trim();
    const chapterText = linkText.split(":")[0].trim();

    if (chaptersWithBookmarks.has(chapterText)) {
      // 1. All bookmarked chapters get the icon and flex layout
      link.classList.add("chapter-has-bookmark");

      const img = document.createElement("img");
      img.src = "../icons/bookmark.svg";
      img.alt = "bookmarked chapter";
      img.className = "chapter-bookmark-icon";
      link.prepend(img);

      // 2. Only the LATEST chapter gets the orange pill highlight
      if (chapterText === latestChapter) {
        link.classList.add("bookmarked-chapter-highlight");
      }
    }
  });
}

highlightBookmarkedChapter();

/* ============================================================
   NOVEL PAGE — ADD TO LIBRARY BUTTON
   ============================================================ */

const libraryButton = document.getElementById("add-library-button");

if (libraryButton && bookTitleElement) {
  const bookTitle = bookTitleElement.textContent.trim();

  let bookAuthor = "Unknown";
  const authorElement = document.querySelector(".author");
  if (authorElement) bookAuthor = authorElement.textContent.trim();

  let bookCover = "";
  const coverElement = document.querySelector(".header-container > img");
  if (coverElement) bookCover = coverElement.src;

  let bookRating = "0.0";
  const ratingElement = document.querySelector(".book-rating");
  if (ratingElement)
    bookRating = ratingElement.textContent.replace(/[^0-9.]/g, "");

  const book = {
    id: bookTitle.toLowerCase().replace(/\s+/g, "-"),
    title: bookTitle,
    author: bookAuthor,
    cover: bookCover,
    rating: bookRating,
    progress: 0,
    status: "reading",
  };

  function updateLibraryButton() {
    const added = isInLibrary(book.id);

    if (added) {
      libraryButton.textContent = "Added to Library";
      libraryButton.style.backgroundColor = "#b8721f";
      libraryButton.style.color = "#ffffff";
    } else {
      libraryButton.textContent = "+ Add to Library";
      libraryButton.style.backgroundColor = "";
      libraryButton.style.color = "";
    }
  }

  updateLibraryButton();

  libraryButton.addEventListener("click", function () {
    const result = toggleLibraryBook(book);

    if (result === "removed") {
      removeBookmarkForBook(book.id);
    }

    let title = "";
    let text = "";
    let icon = "";

    if (result === "added") {
      title = "Book Added Successfully!";
      text = 'You added "' + book.title + '" to your library!';
      icon = "success";
    } else {
      title = "Book Removed Successfully!";
      text = 'You removed "' + book.title + '" from your library!';
      icon = "info";
    }

    Swal.fire({
      title: title,
      text: text,
      icon: icon,
    });

    updateLibraryButton();
    highlightBookmarkedChapter();
  });
}

/* ============================================================
   SYNCHRONIZE UI ON BACK/FORWARD NAVIGATION & TAB SWITCHING
   ============================================================ */

window.addEventListener("pageshow", function (event) {
  if (event.persisted) {
    if (typeof updateLibraryButton === "function") updateLibraryButton();
    if (typeof highlightBookmarkedChapter === "function")
      highlightBookmarkedChapter();
  }
});

window.addEventListener("storage", function (e) {
  if (e.key === BOOKMARK_KEY || e.key === LIBRARY_KEY) {
    if (typeof updateLibraryButton === "function") updateLibraryButton();
    if (typeof highlightBookmarkedChapter === "function")
      highlightBookmarkedChapter();
  }
});

/* ============================================================
   LIBRARY PAGE — DISPLAY BOOKS
   ============================================================ */

const bookGrid = document.getElementById("book-grid");

if (bookGrid) {
  const emptyLibrary = document.getElementById("no-book");
  const totalBooks = document.getElementById("totalBooks");
  const readingBooks = document.getElementById("readingBooks");
  const completedBooks = document.getElementById("completedBooks");
  const filterButtons = document.querySelectorAll(".filter-btn");

  let currentFilter = "all";
  function renderLibrary() {
    const books = getLibraryBooks();

    let readingCount = 0;
    let completedCount = 0;

    for (let i = 0; i < books.length; i++) {
      if (books[i].status === "reading") readingCount++;
      if (books[i].status === "completed") completedCount++;
    }

    totalBooks.textContent = books.length;
    readingBooks.textContent = readingCount;
    completedBooks.textContent = completedCount;

    const filteredBooks = [];

    for (let i = 0; i < books.length; i++) {
      if (currentFilter === "all") {
        filteredBooks.push(books[i]);
      } else if (books[i].status === currentFilter) {
        filteredBooks.push(books[i]);
      }
    }

    if (filteredBooks.length === 0) {
      bookGrid.style.display = "none";
      emptyLibrary.hidden = false;
      return;
    }

    bookGrid.style.display = "grid";
    emptyLibrary.hidden = true;

    let html = "";

    for (let i = 0; i < filteredBooks.length; i++) {
      const book = filteredBooks[i];

      let statusClass = "book-status-completed";
      let statusText = "Completed";

      if (book.status === "reading") {
        statusClass = "book-status-reading";
        statusText = "Reading";
      }

      // Dynamically build the URL using book.id
      html += '<a href="' + book.id + '-page.html">';

      html += '  <div class="book-card">';
      html += '    <div class="book-cover">';
      html +=
        '      <img src="' +
        book.cover +
        '" alt="' +
        book.title +
        '" loading="lazy" />';
      html +=
        '      <span class="' + statusClass + '">' + statusText + "</span>";
      html += "    </div>";
      html += '    <div class="book-info">';
      html += '      <h3 class="book-title">' + book.title + "</h3>";
      html += '      <p class="book-author">' + book.author + "</p>";
      html += '      <div class="book-meta">';
      html += '        <span class="book-rating">';
      html += '          <img src="../icons/star-fill.svg" alt="star" />';
      html += "          " + book.rating;
      html += "        </span>";
      html +=
        '        <span class="book-progress">' + book.progress + "%</span>";
      html += "      </div>";
      html += '      <div class="progress-bar">';
      html +=
        '        <div class="progress-fill" style="width: ' +
        book.progress +
        '%"></div>';
      html += "      </div>";
      html += "    </div>";
      html += "  </div>";
      html += "</a>";
    }

    bookGrid.innerHTML = html;
  }

  for (let i = 0; i < filterButtons.length; i++) {
    filterButtons[i].addEventListener("click", function () {
      for (let j = 0; j < filterButtons.length; j++) {
        filterButtons[j].classList.remove("active");
      }
      this.classList.add("active");
      currentFilter = this.dataset.filter;
      renderLibrary();
    });
  }

  renderLibrary();
  window.addEventListener("storage", renderLibrary);
}
