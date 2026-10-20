document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("search-user");
  const statusFilter = document.getElementById("status-filter");
  const tableBody = document.querySelector(".table-card table tbody");

  // --- 1. Search & Filter Logic ---
  function filterTable() {
    const query = searchInput.value.toLowerCase();
    const status = statusFilter.value.toLowerCase();
    const rows = tableBody.querySelectorAll("tr");

    rows.forEach((row) => {
      const username = row.cells[1] ? row.cells[1].innerText.toLowerCase() : "";
      const email = row.cells[2] ? row.cells[2].innerText.toLowerCase() : "";
      const badge = row.querySelector(".badge");
      const badgeText = badge ? badge.innerText.toLowerCase() : "";

      const matchesSearch = username.includes(query) || email.includes(query);
      const matchesStatus = status === "all" || badgeText.includes(status);

      if (matchesSearch && matchesStatus) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  }

  if (searchInput) searchInput.addEventListener("input", filterTable);
  if (statusFilter) statusFilter.addEventListener("change", filterTable);

  // --- 2. Ban / Unban Logic ---
  if (tableBody) {
    tableBody.addEventListener("click", function (e) {
      const btn = e.target.closest("button");
      if (!btn) return;

      const row = btn.closest("tr");
      const username = row.cells[1].innerText.trim();
      const badge = row.querySelector(".badge");

      // Check if the button is Ban or Unban based on its class
      const isBanAction = btn.classList.contains("btn-danger");

      if (isBanAction) {
        // --- BAN FLOW ---
        Swal.fire({
          title: "Ban User?",
          text: `Are you sure you want to ban "${username}"? They will no longer be able to access the platform.`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, ban user",
          confirmButtonColor: "#dc2626", // Destructive red
          cancelButtonColor: "#6b6680",
          reverseButtons: true,
        }).then((result) => {
          if (result.isConfirmed) {
            // Update Badge
            if (badge) {
              badge.className = "badge banned";
              badge.textContent = "Banned";
            }

            // Update Button
            btn.className = "btn btn-success btn-sm";
            btn.textContent = "Unban";

            // System Feedback - CENTERED
            Swal.fire({
              icon: "success",
              title: "User Banned",
              text: `"${username}" has been successfully banned.`,
              confirmButtonColor: "#b8721f",
            });

            // Re-apply filter in case the status filter is active
            filterTable();
          }
        });
      } else {
        // --- UNBAN FLOW ---
        Swal.fire({
          title: "Unban User?",
          text: `Are you sure you want to restore access for "${username}"?`,
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Yes, unban user",
          confirmButtonColor: "#3f7d4f", // Success green
          cancelButtonColor: "#6b6680",
          reverseButtons: true,
        }).then((result) => {
          if (result.isConfirmed) {
            // Update Badge
            if (badge) {
              badge.className = "badge active";
              badge.textContent = "Active";
            }

            // Update Button
            btn.className = "btn btn-danger btn-sm";
            btn.textContent = "Ban";

            // System Feedback - CENTERED
            Swal.fire({
              icon: "success",
              title: "User Unbanned",
              text: `"${username}" has been successfully unbanned.`,
              confirmButtonColor: "#b8721f",
            });

            // Re-apply filter in case the status filter is active
            filterTable();
          }
        });
      }
    });
  }
});
