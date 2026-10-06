/* ============================================================
   LIBRARY
   ============================================================ */

const LIBRARY_KEY = "libraryBooks";

function getLibraryBooks() {
  return JSON.parse(localStorage.getItem(LIBRARY_KEY)) || [];
}

function saveLibraryBooks(books) {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(books));
}

function isInLibrary(bookId) {
  return getLibraryBooks().some((book) => book.id === bookId);
}

function addBookToLibrary(book) {
  const books = getLibraryBooks();

  if (isInLibrary(book.id)) {
    return false;
  }

  books.push(book);
  saveLibraryBooks(books);
  return true;
}

function removeBookFromLibrary(bookId) {
  const books = getLibraryBooks();
  const updatedBooks = books.filter((book) => book.id !== bookId);

  if (updatedBooks.length === books.length) {
    return false;
  }

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
   NOVEL PAGE — CHAPTER NAVIGATION
   ============================================================ */

const chapterSelect = document.getElementById("chapter-number");
const previousButton = document.getElementById("prevBtn");
const nextButton = document.getElementById("nextBtn");
const chapterRows = document.querySelectorAll("#chapter-list tr");

const chapterGroups = ["1-20", "21-40", "41-47"];

if (chapterSelect && previousButton && nextButton && chapterRows.length > 0) {
  function showChapterGroup(group) {
    chapterRows.forEach((row) => {
      row.style.display = row.dataset.group === group ? "" : "none";
    });

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
   NOVEL PAGE — LIBRARY BUTTON
   ============================================================ */

const libraryButton = document.getElementById("add-library-button");
const bookTitleElement = document.getElementById("titleBook");

if (libraryButton && bookTitleElement) {
  const bookTitle = bookTitleElement.textContent.trim();

  const book = {
    id: bookTitle.toLowerCase().replace(/\s+/g, "-"),
    title: bookTitle,
    author:
      document.querySelector(".book-author")?.textContent.trim() || "Unknown",
    cover: document.querySelector(".header-container > img")?.src || "",
    rating:
      document
        .querySelector(".book-rating")
        ?.textContent.replace(/[^0-9.]/g, "") || "0.0",
    progress: 0,
    status: "reading",
  };

  function updateLibraryButton() {
    const added = isInLibrary(book.id);

    libraryButton.textContent = added ? "Added to Library" : "+ Add to Library";

    libraryButton.style.backgroundColor = added ? "#b8721f" : "";

    libraryButton.style.color = added ? "#ffffff" : "";
  }

  libraryButton.addEventListener("click", function () {
    const result = toggleLibraryBook(book);

    Swal.fire({
      title:
        result === "added"
          ? "Book Added Successfully!"
          : "Book Removed Successfully!",

      text:
        result === "added"
          ? `You added "${book.title}" to your library!`
          : `You removed "${book.title}" from your library!`,

      icon: result === "added" ? "success" : "info",
    });

    updateLibraryButton();
  });

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

    // Update statistics
    totalBooks.textContent = books.length;

    readingBooks.textContent = books.filter(
      (book) => book.status === "reading",
    ).length;

    completedBooks.textContent = books.filter(
      (book) => book.status === "completed",
    ).length;

    // Show or hide empty-library message
    const filteredBooks =
      currentFilter === "all"
        ? books
        : books.filter((book) => book.status === currentFilter);

    if (filteredBooks.length === 0) {
      bookGrid.style.display = "none";
      emptyLibrary.hidden = false;
      return;
    }
    bookGrid.style.display = "grid";
    emptyLibrary.hidden = true;

    // Display books
    bookGrid.innerHTML = filteredBooks
      .map(
        (book) => `
        <a href="novel-page.html?book=${book.id}">
          <div class="book-card">

            <div class="book-cover">
              <img
                src="${book.cover}"
                alt="${book.title}"
                loading="lazy"
              />
              <span class="${
                book.status === "reading"
                  ? "book-status-reading"
                  : "book-status-completed"
              }">
                ${book.status === "reading" ? "Reading" : "Completed"}
              </span>
            </div>

            <div class="book-info">
              <h3 class="book-title">${book.title}</h3>

              <p class="book-author">
                ${book.author}
              </p>

              <div class="book-meta">
                <span class="book-rating">
                  <img
                    src="../icons/star-fill.svg"
                    alt="star"
                  />
                  ${book.rating}
                </span>

                <span class="book-progress">
                  ${book.progress}%
                </span>
              </div>

              <div class="progress-bar">
                <div
                  class="progress-fill"
                  style="width: ${book.progress}%"
                ></div>
              </div>
            </div>

          </div>
        </a>
      `,
      )
      .join("");
  }

  // Filter buttons
  filterButtons.forEach((button) => {
    button.addEventListener("click", function () {
      filterButtons.forEach((btn) => {
        btn.classList.remove("active");
      });
      this.classList.add("active");
      currentFilter = this.dataset.filter;
      renderLibrary();
    });
  });

  // Initial display
  renderLibrary();

  // Update when localStorage changes
  window.addEventListener("storage", renderLibrary);
}
