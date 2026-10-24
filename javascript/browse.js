document.addEventListener("DOMContentLoaded", () => {
  const titleSearchInput = document.getElementById("title-search");
  const genreSelect = document.getElementById("genre");
  const sortSelect = document.getElementById("sort-choice");

  const applyFilterButton = document.getElementById("apply-filter");
  const resetFilterButton = document.getElementById("reset-filter");

  const cardContainer = document.querySelector(".card-container");

  if (!cardContainer) return;

  // Store the original order of the cards as they are in the HTML
  const originalCards = Array.from(
    cardContainer.querySelectorAll(":scope > a"),
  );

  function filterAndSortNovels() {
    const titleQuery = titleSearchInput
      ? titleSearchInput.value.trim().toLowerCase()
      : "";

    const selectedGenre = genreSelect
      ? genreSelect.value.toLowerCase()
      : "all-genre";

    const selectedSort = sortSelect ? sortSelect.value : "popularity";

    const visibleCards = [];

    originalCards.forEach((link) => {
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
        link.style.display = ""; // Show

        visibleCards.push({
          element: link,
          title: titleText,
          rating:
            parseFloat(
              card.querySelector("span p:last-child")?.textContent || "0",
            ) || 0,
        });
      } else {
        link.style.display = "none"; // Hide
      }
    });

    // Sort logic
    visibleCards.sort((a, b) => {
      if (selectedSort === "popularity" || selectedSort === "newest") {
        return b.rating - a.rating;
      }
      if (selectedSort === "updated") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    // Re-append the visible cards in the new sorted order
    visibleCards.forEach((item) => {
      cardContainer.appendChild(item.element);
    });
  }

  // 1. ONLY apply filter when the button is clicked
  if (applyFilterButton) {
    applyFilterButton.addEventListener("click", filterAndSortNovels);
  }

  // 2. Allow pressing "Enter" in the search box
  if (titleSearchInput) {
    titleSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        filterAndSortNovels();
      }
    });
  }

  // 3. Reset button restores original order and clears fields
  if (resetFilterButton) {
    resetFilterButton.addEventListener("click", () => {
      if (titleSearchInput) titleSearchInput.value = "";
      if (genreSelect) genreSelect.value = "all-genre";
      if (sortSelect) sortSelect.value = "popularity";

      originalCards.forEach((link) => {
        link.style.display = "";
        cardContainer.appendChild(link);
      });
    });
  }
});
