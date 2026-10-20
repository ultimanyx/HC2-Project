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

  // --- 2. Ban and Unban Logic ---
  if (tableBody) {
    tableBody.addEventListener("click", function (e) {
      const btn = e.target.closest("button");
      if (!btn) return;

      const row = btn.closest("tr");
      const authorName = row.cells[1].innerText.trim();
      const badge = row.querySelector(".badge");

      // --- BAN FLOW ---
      if (btn.classList.contains("ban-btn")) {
        Swal.fire({
          title: "Ban Author?",
          text: `Are you sure you want to ban "${authorName}"? They will no longer be able to publish novels.`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, ban author",
          confirmButtonColor: "#dc2626",
          cancelButtonColor: "#6b6680",
          reverseButtons: true,
        }).then((result) => {
          if (result.isConfirmed) {
            // Update Badge
            if (badge) {
              badge.className = "badge banned";
              badge.textContent = "Banned";
            }

            // Update Button (Switch to Unban)
            btn.className = "btn btn-success btn-sm unban-btn";
            btn.textContent = "Unban";

            // System Feedback - CENTERED
            Swal.fire({
              icon: "success",
              title: "Author Banned",
              text: `"${authorName}" has been successfully banned.`,
              confirmButtonColor: "#b8721f",
            });

            filterTable();
          }
        });
      }

      // --- UNBAN FLOW ---
      if (btn.classList.contains("unban-btn")) {
        Swal.fire({
          title: "Unban Author?",
          text: `Are you sure you want to restore access for "${authorName}"?`,
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Yes, unban author",
          confirmButtonColor: "#3f7d4f",
          cancelButtonColor: "#6b6680",
          reverseButtons: true,
        }).then((result) => {
          if (result.isConfirmed) {
            // Update Badge
            if (badge) {
              badge.className = "badge active";
              badge.textContent = "Active";
            }

            // Update Button (Switch to Ban)
            btn.className = "btn btn-danger btn-sm ban-btn";
            btn.textContent = "Ban";

            // System Feedback - CENTERED
            Swal.fire({
              icon: "success",
              title: "Author Unbanned",
              text: `"${authorName}" has been successfully unbanned.`,
              confirmButtonColor: "#b8721f",
            });

            filterTable();
          }
        });
      }
    });
  }
});
