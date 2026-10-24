/* ============================================================
   LIBRARY HELPERS & HARDCODED RATINGS
   ============================================================ */

const LIBRARY_KEY = "libraryBooks";
const BOOKMARK_KEY = "bookmarkedChapters";

// Hardcoded ratings matching browse.html exactly
const HARDCODED_RATINGS = {
  "a-tale-of-two-cities": "4.7",
  "pride-and-prejudice": "4.8",
  "treasure-island": "4.3",
  frankenstein: "4.6",
  dracula: "4.8",
  emma: "4.5",
  "jane-eyre": "4.7",
  "sense-and-sensibility": "4.6",
  "wuthering-heights": "4.5",
  "a-farewell-to-arms": "4.5",
  "quo-vadis": "4.4",
  "a-tangled-tale": "4.2",
};

// Helper to create a perfect ID from titles (handles "Pride & Prejudice" -> "pride-and-prejudice")
function getBookId(title) {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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
   NOVEL PAGE — DYNAMIC CHAPTER NAVIGATION
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
    const hasText = Array.from(row.querySelectorAll("a")).some(
      (a) => a.textContent.trim() !== "",
    );

    if (!hasText) {
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
    if (currentIndex > 0) showChapterGroup(chapterGroups[currentIndex - 1]);
  });
  nextButton.addEventListener("click", function () {
    const currentIndex = chapterGroups.indexOf(chapterSelect.value);
    if (currentIndex < chapterGroups.length - 1)
      showChapterGroup(chapterGroups[currentIndex + 1]);
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
  const bookId = getBookId(bookTitle);
  const chapterLinks = document.querySelectorAll("#chapter-list td a");

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

  let bookmarks = [];
  if (entry.bookmarks) bookmarks = entry.bookmarks;
  else if (entry.chapter) bookmarks = [entry];
  if (bookmarks.length === 0) return;

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

  chapterLinks.forEach(function (link) {
    const linkText = link.textContent.trim();
    const chapterText = linkText.split(":")[0].trim();

    if (chaptersWithBookmarks.has(chapterText)) {
      link.classList.add("chapter-has-bookmark");
      const img = document.createElement("img");
      img.src = "../icons/bookmark.svg";
      img.alt = "bookmarked chapter";
      img.className = "chapter-bookmark-icon";
      link.prepend(img);
      if (chapterText === latestChapter)
        link.classList.add("bookmarked-chapter-highlight");
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
  const bookId = getBookId(bookTitle);

  let bookAuthor = "Unknown";
  const authorElement = document.querySelector(".author");
  if (authorElement) bookAuthor = authorElement.textContent.trim();

  let bookCover = "";
  const coverElement = document.querySelector(".header-container > img");
  if (coverElement) bookCover = coverElement.src;

  function updateLibraryButton() {
    const added = isInLibrary(bookId);
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
    // 1. Get the hardcoded rating based on the book ID
    let bookRating = HARDCODED_RATINGS[bookId] || "0.0";

    // 2. If the user manually rated it via the modal, that overrides everything
    const userSavedRating = localStorage.getItem(`book_rating_${bookId}`);
    if (userSavedRating) {
      bookRating = parseFloat(userSavedRating).toFixed(1);
    }

    const book = {
      id: bookId,
      title: bookTitle,
      author: bookAuthor,
      cover: bookCover,
      rating: bookRating,
      progress: 0,
      status: "reading",
    };

    const result = toggleLibraryBook(book);

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

    Swal.fire({ title: title, text: text, icon: icon });
    updateLibraryButton();
    highlightBookmarkedChapter();
  });
}

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
      if (currentFilter === "all" || books[i].status === currentFilter) {
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

      let statusClass =
        book.status === "reading"
          ? "book-status-reading"
          : "book-status-completed";
      let statusText = book.status === "reading" ? "Reading" : "Completed";

      // Force the hardcoded rating from the dictionary
      let displayRating = HARDCODED_RATINGS[book.id] || book.rating || "0.0";

      // If they rated it in the modal, use the new one
      const liveUserRating = localStorage.getItem(`book_rating_${book.id}`);
      if (liveUserRating) {
        displayRating = parseFloat(liveUserRating).toFixed(1);
      }

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
      html += "          " + displayRating;
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
      for (let j = 0; j < filterButtons.length; j++)
        filterButtons[j].classList.remove("active");
      this.classList.add("active");
      currentFilter = this.dataset.filter;
      renderLibrary();
    });
  }

  renderLibrary();
  window.addEventListener("storage", renderLibrary);
}
