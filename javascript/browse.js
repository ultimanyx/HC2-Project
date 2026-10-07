document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // FILTER CONTROLS
  // ==========================================
  const titleSearchInput = document.getElementById("title-search");
  const genreSelect = document.getElementById("genre");
  const sortSelect = document.getElementById("sort-choice");
  const minRatingInput = document.getElementById("min-rating");

  const applyFilterButton = document.getElementById("apply-filter");
  const resetFilterButton = document.getElementById("reset-filter");

  // ==========================================
  // CARD CONTAINER
  // ==========================================
  const cardContainer = document.querySelector(".card-container");

  if (!cardContainer) return;

  const cardLinks = Array.from(
    cardContainer.querySelectorAll(":scope > a")
  );

  // ==========================================
  // FILTER + SORT FUNCTION
  // ==========================================
  function filterAndSortNovels() {
    const titleQuery = titleSearchInput
      ? titleSearchInput.value.trim().toLowerCase()
      : "";

    const selectedGenre = genreSelect
      ? genreSelect.value.toLowerCase()
      : "all-genre";

    const minRating = minRatingInput
      ? parseFloat(minRatingInput.value) || 0
      : 0;

    const selectedSort = sortSelect
      ? sortSelect.value
      : "popularity";

    const visibleCards = [];

    // ==========================================
    // CHECK EACH NOVEL
    // ==========================================
    cardLinks.forEach((link) => {
      const card = link.querySelector(".novel-card");

      if (!card) return;

      // Novel title
      const titleText =
        card.querySelector("h1")
          ?.textContent
          .trim()
          .toLowerCase() || "";

      // IMPORTANT:
      // Get genre from the actual genre text,
      // NOT from the image folder.
      const genreText =
        card.querySelector("#genre-block h3")
          ?.textContent
          .trim()
          .toLowerCase() || "";

      // Rating
      const ratingText =
        card.querySelector("span p:last-child")
          ?.textContent || "0";

      const rating = parseFloat(ratingText) || 0;

      // ==========================================
      // MATCHING
      // ==========================================
      const matchesTitle =
        !titleQuery || titleText.includes(titleQuery);

      const matchesGenre =
        selectedGenre === "all-genre" || genreText === selectedGenre;

      const matchesRating = rating >= minRating;

      // ==========================================
      // SHOW / HIDE
      // ==========================================
      if (matchesTitle && matchesGenre && matchesRating) {
        link.style.display = "";

        visibleCards.push({
          element: link,
          rating: rating,
          title: titleText
        });
      } else {
        link.style.display = "none";
      }
    });

    // ==========================================
    // SORT
    // ==========================================
    visibleCards.sort((a, b) => {
      if (
        selectedSort === "popularity" ||
        selectedSort === "newest"
      ) {
        return b.rating - a.rating;
      }

      if (selectedSort === "updated") {
        return a.title.localeCompare(b.title);
      }

      return 0;
    });

    // ==========================================
    // UPDATE DOM ORDER
    // ==========================================
    visibleCards.forEach((item) => {
      cardContainer.appendChild(item.element);
    });
  }

  // ==========================================
  // APPLY FILTER
  // ==========================================
  if (applyFilterButton) {
    applyFilterButton.addEventListener("click", filterAndSortNovels);
  }

  // ==========================================
  // RESET FILTER
  // ==========================================
  if (resetFilterButton) {
    resetFilterButton.addEventListener("click", () => {
      // Reset input values
      if (titleSearchInput) titleSearchInput.value = "";
      if (genreSelect) genreSelect.value = "all-genre";
      if (sortSelect) sortSelect.value = "popularity";
      if (minRatingInput) minRatingInput.value = "0";

      // Show all novels and return cards to original DOM position
      cardLinks.forEach((link) => {
        link.style.display = "";
        cardContainer.appendChild(link);
      });
    });
  }

  // ==========================================
  // INITIAL LOAD
  // ==========================================
  filterAndSortNovels();
});