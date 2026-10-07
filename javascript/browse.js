document.addEventListener("DOMContentLoaded", () => {
  // 1. Select Filter Controls
  const titleSearchInput = document.querySelector(".filter .filter-group input[type='text']");
  const searchButton = document.querySelector(".filter .filter-group button");
  const genreSelect = document.getElementById("genre");
  const sortSelect = document.getElementById("sort-choice");
  const minRatingInput = document.getElementById("min-rating");

  // 2. Select Cards & Parent Container
  const cardContainer = document.querySelector(".card-container");
  const cardLinks = Array.from(cardContainer.querySelectorAll("a"));

  // 3. Main Filter & Sort Handler
  function filterAndSortNovels() {
    const titleQuery = titleSearchInput ? titleSearchInput.value.trim().toLowerCase() : "";
    const selectedGenre = genreSelect ? genreSelect.value.toLowerCase() : "all-genre";
    const minRating = minRatingInput ? parseFloat(minRatingInput.value) || 0 : 0;
    const selectedSort = sortSelect ? sortSelect.value : "popularity";

    const visibleCards = [];

    cardLinks.forEach((link) => {
      const card = link.querySelector(".novel-card");
      if (!card) return;

      // Extract Data from Card
      const titleText = card.querySelector("h1")?.textContent.toLowerCase() || "";
      const ratingText = card.querySelector("span p:last-child")?.textContent || "0";
      const rating = parseFloat(ratingText) || 0;

      // Derive Genre from Image File Path (since genre isn't in data-attributes yet)
      const imgSrc = card.querySelector("img.cover")?.getAttribute("src")?.toLowerCase() || "";

      // Matching Logic
      const matchesTitle = !titleQuery || titleText.includes(titleQuery);
      const matchesRating = rating >= minRating;
      
      // Matches selected genre option or checks path directory
      const matchesGenre =
        selectedGenre === "all-genre" ||
        imgSrc.includes(selectedGenre) ||
        (selectedGenre === "sci-fi" && (imgSrc.includes("sci-fi") || imgSrc.includes("scifi")));

      if (matchesTitle && matchesGenre && matchesRating) {
        link.style.display = ""; // Show card
        visibleCards.push({ element: link, rating, title: titleText });
      } else {
        link.style.display = "none"; // Hide card
      }
    });

    // Sort Visible Cards
    visibleCards.sort((a, b) => {
      if (selectedSort === "newest" || selectedSort === "popularity") {
        return b.rating - a.rating; // Default highest rating first
      } else if (selectedSort === "updated") {
        return a.title.localeCompare(b.title); // Alphabetical fallback
      }
      return 0;
    });

    // Re-append to update DOM order
    visibleCards.forEach((item) => cardContainer.appendChild(item.element));
  }

  // 4. Attach Event Listeners
  if (titleSearchInput) {
    titleSearchInput.addEventListener("input", filterAndSortNovels);
  }

  if (searchButton) {
    searchButton.addEventListener("click", filterAndSortNovels);
  }

  if (genreSelect) {
    genreSelect.addEventListener("change", filterAndSortNovels);
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", filterAndSortNovels);
  }

  if (minRatingInput) {
    minRatingInput.addEventListener("input", filterAndSortNovels);
  }
});