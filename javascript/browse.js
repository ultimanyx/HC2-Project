document.addEventListener("DOMContentLoaded", () => {
  const cardContainer = document.querySelector(".card-container");
  if (!cardContainer) return;

  // ==========================================
  // 1. INJECT NEW BOOKS INTO THE PAGE
  // ==========================================
  function injectNewBooks() {
    const novels = JSON.parse(localStorage.getItem("novels") || "[]");

    const newBooks = novels
      .filter((n) => {
        // Must be published and not archived
        if (n.status !== "published" || n.archived || n.deletedByAuthor)
          return false;

        // Ignore the system seeds that are already hardcoded in the HTML
        if (n.id === "seed-0" || n.id === "dracula" || n.systemSeeded)
          return false;

        // Ignore the other hardcoded books so they don't duplicate
        const hardcodedIds = [
          "a-tale-of-two-cities",
          "pride-and-prejudice",
          "treasure-island",
          "frankenstein",
          "emma",
          "jane-eyre",
          "sense-and-sensibility",
          "wuthering-heights",
          "a-farewell-to-arms",
          "quo-vadis",
          "a-tangled-tale",
        ];
        if (hardcodedIds.includes(n.id)) return false;

        return true;
      })
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    newBooks.forEach((book) => {
      if (cardContainer.querySelector(`a[href="reader.html?id=${book.id}"]`))
        return;

      const genreLower = (book.genre || "action").toLowerCase();
      const primaryGenre = genreLower.split(" ")[0].replace("&", "").trim();
      const iconPath = `../icons/${primaryGenre}.svg`;
      const fallbackIcon = `../icons/book-half.svg`;

      const a = document.createElement("a");
      a.href = `reader.html?id=${book.id}`;
      a.innerHTML = `
        <div class="novel-card">
          <img src="${book.coverImage || "../image/logo.png"}" alt="${book.title}" class="cover" />
          <span id="genre-block">
            <img src="${iconPath}" alt="${book.genre} icon" onerror="this.src='${fallbackIcon}'" />
            <h3 id="genre">${book.genre || "General"}</h3>
          </span>
          <h1>${book.title}</h1>
          <span class="card-footer">
            <p>Author: ${book.author || "Unknown"}</p>
            <img src="../icons/star-fill.svg" alt="star" class="star" />
            <p id="rating">${book.rating || "0.0"}</p>
          </span>
        </div>
      `;

      cardContainer.appendChild(a);
    });
  }

  injectNewBooks();

  // ==========================================
  // 2. FILTERING & SORTING
  // ==========================================
  const titleSearchInput = document.getElementById("title-search");
  const genreSelect = document.getElementById("genre");
  const sortSelect = document.getElementById("sort-choice");
  const applyFilterButton = document.getElementById("apply-filter");
  const resetFilterButton = document.getElementById("reset-filter");

  const cardLinks = Array.from(cardContainer.querySelectorAll(":scope > a"));

  function filterAndSortNovels() {
    const titleQuery = titleSearchInput
      ? titleSearchInput.value.trim().toLowerCase()
      : "";
    const selectedGenre = genreSelect
      ? genreSelect.value.toLowerCase()
      : "all-genre";
    const selectedSort = sortSelect ? sortSelect.value : "popularity";
    const visibleCards = [];

    cardLinks.forEach((link) => {
      const card = link.querySelector(".novel-card");
      if (!card) return;

      const titleText =
        card.querySelector("h1")?.textContent.trim().toLowerCase() || "";
      const genreText =
        card
          .querySelector("#genre-block h3")
          ?.textContent.trim()
          .toLowerCase() || "";

      const matchesTitle = !titleQuery || titleText.includes(titleQuery);
      const matchesGenre =
        selectedGenre === "all-genre" || genreText === selectedGenre;

      if (matchesTitle && matchesGenre) {
        link.style.display = "";
        visibleCards.push({
          element: link,
          title: titleText,
          rating:
            parseFloat(
              card.querySelector("span p:last-child")?.textContent || "0",
            ) || 0,
        });
      } else {
        link.style.display = "none";
      }
    });

    visibleCards.sort((a, b) => {
      if (selectedSort === "popularity" || selectedSort === "newest") {
        return b.rating - a.rating;
      }
      if (selectedSort === "updated") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    visibleCards.forEach((item) => {
      cardContainer.appendChild(item.element);
    });
  }

  if (applyFilterButton)
    applyFilterButton.addEventListener("click", filterAndSortNovels);
  if (titleSearchInput) {
    titleSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        filterAndSortNovels();
      }
    });
  }

  if (resetFilterButton) {
    resetFilterButton.addEventListener("click", () => {
      if (titleSearchInput) titleSearchInput.value = "";
      if (genreSelect) genreSelect.value = "all-genre";
      if (sortSelect) sortSelect.value = "popularity";

      cardLinks.forEach((link) => {
        link.style.display = "";
        cardContainer.appendChild(link);
      });
    });
  }
});
