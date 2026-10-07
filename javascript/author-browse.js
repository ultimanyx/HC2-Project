document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search-novel");
  const statusFilter = document.getElementById("status-filter");
  const sortSelect = document.getElementById("sort-novel");

  const table = document.querySelector(".table-card table");
  const tbody = table.querySelector("tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));

  function filterAndSortNovels() {
    const searchText = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value.toLowerCase();
    const selectedSort = sortSelect.value;

    let visibleRows = [];

    rows.forEach((row) => {
      const title = row.cells[0]?.textContent.trim().toLowerCase() || "";
      const status = row.cells[1]?.textContent.trim().toLowerCase() || "";

      const matchesSearch =
        searchText === "" || title.includes(searchText);

      const matchesStatus =
        selectedStatus === "all statuses" ||
        status === selectedStatus;

      if (matchesSearch && matchesStatus) {
        row.style.display = "";
        visibleRows.push(row);
      } else {
        row.style.display = "none";
      }
    });

    // Sort the visible rows
    visibleRows.sort((a, b) => {
      if (selectedSort === "Title") {
        const titleA = a.cells[0].textContent.trim();
        const titleB = b.cells[0].textContent.trim();

        return titleA.localeCompare(titleB);
      }

      if (selectedSort === "Reads") {
        const readsA = parseInt(
          a.cells[4].textContent.replace(/,/g, "")
        ) || 0;

        const readsB = parseInt(
          b.cells[4].textContent.replace(/,/g, "")
        ) || 0;

        return readsB - readsA;
      }

      if (selectedSort === "Rating") {
        const ratingA =
          parseFloat(a.cells[5].textContent.trim()) || 0;

        const ratingB =
          parseFloat(b.cells[5].textContent.trim()) || 0;

        return ratingB - ratingA;
      }

      // Last Updated
      // Since your current HTML does not have an actual
      // "Last Updated" date, keep the original order.
      return rows.indexOf(a) - rows.indexOf(b);
    });

    // Put sorted rows back into the table
    visibleRows.forEach((row) => {
      tbody.appendChild(row);
    });
  }

  // Search while typing
  searchInput.addEventListener("input", filterAndSortNovels);

  // Filter when status changes
  statusFilter.addEventListener("change", filterAndSortNovels);

  // Sort when sort option changes
  sortSelect.addEventListener("change", filterAndSortNovels);

  // Run once when page loads
  filterAndSortNovels();
});