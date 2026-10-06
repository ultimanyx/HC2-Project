/* ============================================================
   LIBRARY STORE — add / remove / check books
   ============================================================ */
const LIBRARY_KEY = "libraryBooks";

function getLibraryBooks() {
  return JSON.parse(localStorage.getItem(LIBRARY_KEY)) || [];
}
function saveLibraryBooks(books) {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(books));
}
function isInLibrary(bookId) {
  return getLibraryBooks().some((b) => b.id === bookId);
}
function addBookToLibrary(book) {
  const books = getLibraryBooks();
  if (books.some((b) => b.id === book.id)) return false;
  books.push(book);
  saveLibraryBooks(books);
  return true;
}
function removeBookFromLibrary(bookId) {
  const books = getLibraryBooks();
  const filtered = books.filter((b) => b.id !== bookId);
  if (filtered.length === books.length) return false;
  saveLibraryBooks(filtered);
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
   NOVEL PAGE — chapter navigation (only if elements exist)
   ============================================================ */
const select  = document.getElementById("chapter-number");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const rows    = document.querySelectorAll("#chapter-list tr");
const groups  = ["1-20", "21-40", "41-47"];

if (select && prevBtn && nextBtn && rows.length) {
  function showGroup(group) {
    rows.forEach(function (row) {
      row.style.display = row.dataset.group === group ? "" : "none";
    });
    select.value = group;
    const idx = groups.indexOf(group);
    prevBtn.disabled = idx === 0;
    nextBtn.disabled = idx === groups.length - 1;
  }

  select.addEventListener("change", (e) => showGroup(e.target.value));
  prevBtn.addEventListener("click", () => {
    const i = groups.indexOf(select.value);
    if (i > 0) showGroup(groups[i - 1]);
  });
  nextBtn.addEventListener("click", () => {
    const i = groups.indexOf(select.value);
    if (i < groups.length - 1) showGroup(groups[i + 1]);
  });

  showGroup("1-20");
}

/* ============================================================
   NOVEL PAGE — Add / Remove button (only if elements exist)
   ============================================================ */
const statusBtn  = document.getElementById("add-library-button");
const titleEl    = document.getElementById("titleBook");

if (statusBtn && titleEl) {
  const bookTitle = titleEl.textContent.trim();
  const bookId    = bookTitle.toLowerCase().replace(/\s+/g, "-");

  const bookData = {
    id: bookId,
    title: bookTitle,
    author: document.querySelector(".book-author")?.textContent.trim() || "Unknown",
    cover:  document.querySelector(".book-cover img")?.src || "",
    rating: document.querySelector(".book-rating")?.textContent.replace(/[^0-9.]/g, "") || "0.0",
    progress: 0,
    status: "reading",
  };

  function refreshButton() {
    const inLib = isInLibrary(bookId);
    statusBtn.textContent = inLib ? "Added to Library" : "+ Add to Library";
    statusBtn.style.backgroundColor = inLib ? "#b8721f" : "";
    statusBtn.style.color = inLib ? "#ffffff" : "";
  }

  statusBtn.addEventListener("click", () => {
    const result = toggleLibraryBook(bookData);
    Swal.fire({
      title: result === "added" ? "Book Added Successfully!" : "Book Removed Successfully!",
      text: result === "added"
        ? `You added "${bookTitle}" to your library!`
        : `You removed "${bookTitle}" from your library!`,
      icon: result === "added" ? "success" : "info",
    });
    refreshButton();
  });

  refreshButton();
}

/* ============================================================
   LIBRARY PAGE — render saved books (only if grid exists)
   ============================================================ */
const bookGrid = document.getElementById("book-grid");

if (bookGrid) {
  const noBookDiv        = document.getElementById("no-book");
  const totalBooksEl     = document.getElementById("totalBooks");
  const readingBooksEl   = document.getElementById("readingBooks");
  const completedBooksEl = document.getElementById("completedBooks");
  const filterBtns       = document.querySelectorAll(".filter-btn");
  let currentFilter      = "all";

  function renderLibrary() {
    const books = getLibraryBooks();

    totalBooksEl.textContent     = books.length;
    readingBooksEl.textContent   = books.filter(b => b.status === "reading").length;
    completedBooksEl.textContent = books.filter(b => b.status === "completed").length;

    if (books.length === 0) {
      bookGrid.style.display = "none";
      if (noBookDiv) noBookDiv.hidden = false;
    } else {
      bookGrid.style.display = "grid";
      if (noBookDiv) noBookDiv.hidden = true;
    }

    const filtered = currentFilter === "all"
      ? books
      : books.filter(b => b.status === currentFilter);

    bookGrid.innerHTML = filtered.map(b => `
      <a href="novel-page.html?book=${b.id}">
        <div class="book-card">
          <div class="book-cover">
            <img src="${b.cover}" alt="${b.title}" loading="lazy" />
            <span class="${b.status === "reading" ? "book-status-reading" : "book-status-completed"}">
              ${b.status === "reading" ? "Reading" : "Completed"}
            </span>
          </div>
          <div class="book-info">
            <h3 class="book-title">${b.title}</h3>
            <p class="book-author">${b.author}</p>
            <div class="book-meta">
              <span class="book-rating">
                <img src="../icons/star-fill.svg" alt="star" /> ${b.rating}
              </span>
              <span class="book-progress">${b.progress}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${b.progress}%"></div>
            </div>
          </div>
        </div>
      </a>
    `).join("");
  }

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      renderLibrary();
    });
  });

  renderLibrary();
  window.addEventListener("storage", renderLibrary);
}