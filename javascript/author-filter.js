document.addEventListener("DOMContentLoaded", function () {

  // =========================
  // GET FILTER ELEMENTS
  // =========================

  const periodFilter = document.getElementById("period");
  const bookFilter = document.getElementById("book-filter");
  const applyButton = document.getElementById("apply-filter");
  const resetButton = document.getElementById("reset-filter");


  // =========================
  // GET TABLE ROWS
  // =========================

  const rows = Array.from(
    document.querySelectorAll(".table-card tbody tr")
  );


  // =========================
  // APPLY FILTER
  // =========================

  applyButton.addEventListener("click", function () {

    const selectedPeriod = periodFilter.value.trim().toLowerCase();
    const selectedBook = bookFilter.value.trim().toLowerCase();

    rows.forEach(function (row) {

      // Get book title from first column
      const bookTitle = row.cells[0].textContent.trim().toLowerCase();

      // Get period from data-period
      const rowPeriod = row.dataset.period.trim().toLowerCase();

      // Check selected book
      const matchesBook =
        selectedBook === "all novels" ||
        bookTitle === selectedBook;

      // Check selected period
      const matchesPeriod =
        selectedPeriod === "all time" ||
        rowPeriod === selectedPeriod;

      // Show or hide row
      if (matchesBook && matchesPeriod) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }

    });

  });


  // =========================
  // RESET FILTER
  // =========================

  resetButton.addEventListener("click", function () {

    // Reset dropdowns
    periodFilter.value = "All Time";
    bookFilter.value = "All Novels";

    // Show all rows
    rows.forEach(function (row) {
      row.style.display = "";
    });

  });

});