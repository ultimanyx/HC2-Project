document.addEventListener("DOMContentLoaded", function () {
  const tableBody = document.getElementById("reportTableBody");
  const periodFilter = document.getElementById("period");
  const monthPickerGroup = document.getElementById("monthPickerGroup");
  const monthFilter = document.getElementById("monthFilter");
  const itemFilter = document.getElementById("item-filter");
  const formatFilter = document.getElementById("format");
  const applyBtn = document.getElementById("applyBtn");
  const resetBtn = document.getElementById("resetBtn");

  // --- 1. Show/Hide Month Picker based on Dropdown ---
  if (periodFilter) {
    periodFilter.addEventListener("change", function () {
      if (this.value === "specific") {
        monthPickerGroup.style.display = "flex"; // Show the month picker
      } else {
        monthPickerGroup.style.display = "none"; // Hide it
        monthFilter.value = ""; // Clear previous selection
      }
    });
  }

  // --- 2. Filter Logic ---
  function filterTable() {
    if (!tableBody) return;

    const selectedPeriod = periodFilter.value;
    const selectedMonth = monthFilter.value;
    const selectedItem = itemFilter.value.toLowerCase();
    const selectedFormat = formatFilter.value.toLowerCase();

    const rows = tableBody.querySelectorAll("tr");

    rows.forEach((row) => {
      const rowMonth = row.getAttribute("data-month");
      // Format is at index 2 (0: Date, 1: Campaign, 2: Format)
      const rowFormat = row.cells[2].textContent.trim().toLowerCase();
      // Campaign name is at index 1
      const rowItem = row.cells[1].textContent.trim().toLowerCase();

      // Check Format
      const matchesFormat =
        selectedFormat === "all" || rowFormat === selectedFormat;

      //  Check Item/Campaign
      const matchesItem = selectedItem === "all" || rowItem === selectedItem;

      // Check Date
      let matchesDate = true;

      if (selectedPeriod === "specific") {
        matchesDate = rowMonth === selectedMonth;
      } else if (selectedPeriod === "last30") {
        matchesDate = rowMonth === "2026-10";
      } else if (selectedPeriod === "lastyear") {
        matchesDate = rowMonth.startsWith("2026"); // All 2026 data
      } else if (selectedPeriod === "all") {
        matchesDate = true; // Show everything
      }

      // Show/Hide Row
      if (matchesFormat && matchesItem && matchesDate) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  }

  // --- 3. Apply Button ---
  if (applyBtn) {
    applyBtn.addEventListener("click", function (e) {
      e.preventDefault();

      // Validation: If "Specific Month" is selected, ensure a month is picked
      if (periodFilter.value === "specific" && !monthFilter.value) {
        alert("Please select a specific month from the date picker.");
        return;
      }

      filterTable();
    });
  }

  // --- 4. Reset Button ---
  if (resetBtn) {
    resetBtn.addEventListener("click", function (e) {
      e.preventDefault();

      // Reset dropdowns
      periodFilter.value = "all";
      itemFilter.value = "all";
      formatFilter.value = "all";

      // Hide and clear month picker
      monthPickerGroup.style.display = "none";
      monthFilter.value = "";

      filterTable();
    });
  }
});
