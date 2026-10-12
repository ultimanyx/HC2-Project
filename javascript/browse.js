document.addEventListener("DOMContentLoaded", () => {
  const titleSearchInput = document.getElementById("title-search");
  const genreSelect = document.getElementById("genre");
  const sortSelect = document.getElementById("sort-choice");

  const applyFilterButton = document.getElementById("apply-filter");
  const resetFilterButton = document.getElementById("reset-filter");

  const cardContainer = document.querySelector(".card-container");

  if (!cardContainer) return;

  const cardLinks = Array.from(cardContainer.querySelectorAll(":scope > a"));

  function debounce(func, delay = 150) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  }

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

      // Rating filter removed – all ratings are allowed

      if (matchesTitle && matchesGenre) {
        link.style.display = "";

        visibleCards.push({
          element: link,
          title: titleText,
          // We still need rating for sorting, so we read it
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

  const debouncedFilter = debounce(filterAndSortNovels, 150);

  if (titleSearchInput) {
    titleSearchInput.addEventListener("input", debouncedFilter);
  }

  if (applyFilterButton) {
    applyFilterButton.addEventListener("click", filterAndSortNovels);
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

  filterAndSortNovels();
});
