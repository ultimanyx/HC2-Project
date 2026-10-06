/* ============================================================
   LIBRARY HELPERS
   ============================================================ */

const LIBRARY_KEY = "libraryBooks";

// Get the list of books from localStorage
function getLibraryBooks() {
  const data = localStorage.getItem(LIBRARY_KEY);

  if (data) {
    return JSON.parse(data);
  }

  return [];
}

// Save the list of books to localStorage
function saveLibraryBooks(books) {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(books));
}

// Check if a book is already in the library
function isInLibrary(bookId) {
  const books = getLibraryBooks();

  for (let i = 0; i < books.length; i++) {
    if (books[i].id === bookId) {
      return true;
    }
  }

  return false;
}

// Add a book to the library
function addBookToLibrary(book) {
  const books = getLibraryBooks();

  if (isInLibrary(book.id)) {
    return false;
  }

  books.push(book);
  saveLibraryBooks(books);
  return true;
}

// Remove a book from the library
function removeBookFromLibrary(bookId) {
  const books = getLibraryBooks();
  const updatedBooks = [];

  for (let i = 0; i < books.length; i++) {
    if (books[i].id !== bookId) {
      updatedBooks.push(books[i]);
    }
  }

  if (updatedBooks.length === books.length) {
    return false;
  }

  saveLibraryBooks(updatedBooks);
  return true;
}

// Add or remove a book (used by the Add to Library button)
function toggleLibraryBook(book) {
  if (isInLibrary(book.id)) {
    removeBookFromLibrary(book.id);
    return "removed";
  }

  addBookToLibrary(book);
  return "added";
}

/* ============================================================
   NOVEL PAGE — CHAPTER NAVIGATION
   ============================================================ */

const chapterSelect = document.getElementById("chapter-number");
const previousButton = document.getElementById("prevBtn");
const nextButton = document.getElementById("nextBtn");
const chapterRows = document.querySelectorAll("#chapter-list tr");

const chapterGroups = ["1-20", "21-40", "41-47"];

if (chapterSelect && previousButton && nextButton && chapterRows.length > 0) {
  function showChapterGroup(group) {
    // Show or hide each chapter row
    for (let i = 0; i < chapterRows.length; i++) {
      if (chapterRows[i].dataset.group === group) {
        chapterRows[i].style.display = "";
      } else {
        chapterRows[i].style.display = "none";
      }
    }

    chapterSelect.value = group;

    // Find which group we are on
    const currentIndex = chapterGroups.indexOf(group);

    // Disable Previous if first group, Next if last group
    if (currentIndex === 0) {
      previousButton.disabled = true;
    } else {
      previousButton.disabled = false;
    }

    if (currentIndex === chapterGroups.length - 1) {
      nextButton.disabled = true;
    } else {
      nextButton.disabled = false;
    }
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

  // Show the first group when the page loads
  showChapterGroup(chapterGroups[0]);
}

/* ============================================================
   NOVEL PAGE — ADD TO LIBRARY BUTTON
   ============================================================ */

const libraryButton = document.getElementById("add-library-button");
const bookTitleElement = document.getElementById("titleBook");

if (libraryButton && bookTitleElement) {
  const bookTitle = bookTitleElement.textContent.trim();

  // Get author from .book-author if it exists
  let bookAuthor = "Unknown";
  const authorElement = document.querySelector(".book-author");
  if (authorElement) {
    bookAuthor = authorElement.textContent.trim();
  }

  // Get cover from the header image if it exists
  let bookCover = "";
  const coverElement = document.querySelector(".header-container > img");
  if (coverElement) {
    bookCover = coverElement.src;
  }

  // Get rating from .book-rating if it exists
  let bookRating = "0.0";
  const ratingElement = document.querySelector(".book-rating");
  if (ratingElement) {
    bookRating = ratingElement.textContent.replace(/[^0-9.]/g, "");
  }

  // Build the book object
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

  libraryButton.addEventListener("click", function () {
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

    Swal.fire({
      title: title,
      text: text,
      icon: icon,
    });

    updateLibraryButton();
  });

  // Set the button state on page load
  updateLibraryButton();
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

    // Count books for the statistics bar
    let readingCount = 0;
    let completedCount = 0;

    for (let i = 0; i < books.length; i++) {
      if (books[i].status === "reading") {
        readingCount++;
      }
      if (books[i].status === "completed") {
        completedCount++;
      }
    }

    totalBooks.textContent = books.length;
    readingBooks.textContent = readingCount;
    completedBooks.textContent = completedCount;

    // Pick the books to show based on the current filter
    const filteredBooks = [];

    for (let i = 0; i < books.length; i++) {
      if (currentFilter === "all") {
        filteredBooks.push(books[i]);
      } else if (books[i].status === currentFilter) {
        filteredBooks.push(books[i]);
      }
    }

    // If there are no books to show, show the empty message
    if (filteredBooks.length === 0) {
      bookGrid.style.display = "none";
      emptyLibrary.hidden = false;
      return;
    }

    bookGrid.style.display = "grid";
    emptyLibrary.hidden = true;

    // Build the HTML for each book card
    let html = "";

    for (let i = 0; i < filteredBooks.length; i++) {
      const book = filteredBooks[i];

      let statusClass = "book-status-completed";
      let statusText = "Completed";

      if (book.status === "reading") {
        statusClass = "book-status-reading";
        statusText = "Reading";
      }

      html += '<a href="novel-page.html?book=' + book.id + '">';
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

  // Filter buttons — click to switch between All / Reading / Completed
  for (let i = 0; i < filterButtons.length; i++) {
    filterButtons[i].addEventListener("click", function () {
      // Turn off "active" on every button
      for (let j = 0; j < filterButtons.length; j++) {
        filterButtons[j].classList.remove("active");
      }

      // Turn on "active" on the clicked button
      this.classList.add("active");

      currentFilter = this.dataset.filter;
      renderLibrary();
    });
  }

  // Show books when the page loads
  renderLibrary();

  // Update the grid if localStorage changes in another tab
  window.addEventListener("storage", renderLibrary);
}
