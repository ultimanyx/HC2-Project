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
   NOVEL PAGE — DYNAMIC CHAPTER NAVIGATION
   ============================================================ */

const chapterSelect = document.getElementById("chapter-number");
const previousButton = document.getElementById("prevBtn");
const nextButton = document.getElementById("nextBtn");
const chapterRows = document.querySelectorAll("#chapter-list tr");

if (chapterSelect && previousButton && nextButton && chapterRows.length > 0) {
  // 1. Get total chapters from the body data attribute, or count rows as fallback
  const bodyElement = document.body;
  let totalChapters = parseInt(bodyElement.dataset.totalChapters) || 0;

  if (totalChapters === 0) {
    // Fallback: If no data attribute, just count unique chapter rows
    totalChapters = chapterRows.length;
  }

  // 2. Generate the groups dynamically (e.g., 1-20, 21-40, 41-60, etc.)
  const chapterGroups = [];
  const groupSize = 20; // Set to 20 chapters per page group

  for (let i = 1; i <= totalChapters; i += groupSize) {
    let end = i + groupSize - 1;
    if (end > totalChapters) end = totalChapters;
    chapterGroups.push(`${i}-${end}`);
  }

  // 3. Build the dropdown options dynamically
  chapterSelect.innerHTML = "";
  chapterGroups.forEach((group, index) => {
    const option = document.createElement("option");
    option.value = group;
    option.textContent = `Chapter: ${group}`;
    chapterSelect.appendChild(option);
  });

  // 4. Function to switch between groups
  function showChapterGroup(group) {
    // Hide all rows first
    for (let i = 0; i < chapterRows.length; i++) {
      chapterRows[i].style.display = "none";
    }

    // Show rows that match the selected group
    for (let i = 0; i < chapterRows.length; i++) {
      if (chapterRows[i].dataset.group === group) {
        chapterRows[i].style.display = "";
      }
    }

    chapterSelect.value = group;

    // Disable/Enable Previous and Next buttons based on the current group's index
    const currentIndex = chapterGroups.indexOf(group);

    previousButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === chapterGroups.length - 1;
  }

  // 5. Event Listeners
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

  // Initialize the first group (e.g., 1-20)
  showChapterGroup(chapterGroups[0]);
}

/* ============================================================
   NOVEL PAGE — HIGHLIGHT BOOKMARKED CHAPTER
   ============================================================ */

const bookTitleElement = document.getElementById("titleBook");

function highlightBookmarkedChapter() {
  if (!bookTitleElement) return;

  const bookTitle = bookTitleElement.textContent.trim();
  const bookId = bookTitle.toLowerCase().replace(/\s+/g, "-");

  // First, remove any existing highlights
  const chapterLinks = document.querySelectorAll("#chapter-list td a");
  chapterLinks.forEach(function (link) {
    link.classList.remove("bookmarked-chapter-highlight");
  });

  // Check if this book has a bookmark
  const bookmarksData = localStorage.getItem(BOOKMARK_KEY);

  if (bookmarksData) {
    const bookmarks = JSON.parse(bookmarksData);
    const bookmark = bookmarks[bookId];

    if (bookmark && bookmark.chapter) {
      chapterLinks.forEach(function (link) {
        const linkText = link.textContent.trim();
        const chapterText = linkText.split(":")[0].trim();

        if (chapterText === bookmark.chapter) {
          link.classList.add("bookmarked-chapter-highlight");
        }
      });
    }
  }
}

// Call on initial page load
highlightBookmarkedChapter();

/* ============================================================
   NOVEL PAGE — ADD TO LIBRARY BUTTON
   ============================================================ */

const libraryButton = document.getElementById("add-library-button");

if (libraryButton && bookTitleElement) {
  const bookTitle = bookTitleElement.textContent.trim();

  let bookAuthor = "Unknown";
  const authorElement = document.querySelector(".book-author");
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

  // Call on initial load
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

// Call when page is restored from Back-Forward Cache (BFCache)
window.addEventListener("pageshow", function (event) {
  if (event.persisted) {
    if (typeof updateLibraryButton === "function") updateLibraryButton();
    if (typeof highlightBookmarkedChapter === "function")
      highlightBookmarkedChapter();
  }
});

// Call if localStorage changes in another tab
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

      html += '<a href="a-tale-of-two-cities-page.html?book=' + book.id + '">';
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