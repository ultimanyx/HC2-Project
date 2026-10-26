document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("search-user");
  const statusFilter = document.getElementById("status-filter");
  const tableBody = document.getElementById("authorTableBody"); // Correct ID

  const statTotal = document.getElementById("stat-total");
  const statActive = document.getElementById("stat-active");
  const statNew = document.getElementById("stat-new");

  // --- 0. Seed Demo Authors ---
  function seedDemoAuthors() {
    let users = JSON.parse(localStorage.getItem("users")) || [];

    const demoAuthors = [
      {
        id: "a-001",
        username: "J.K. Rowling",
        email: "jkrowling@example.com",
        password: "password",
        role: "author",
        status: "active",
        joined: new Date("2026-01-12").getTime(),
      },
      {
        id: "a-002",
        username: "Stephen King",
        email: "stephen@example.com",
        password: "password",
        role: "author",
        status: "active",
        joined: new Date("2026-02-03").getTime(),
      },
      {
        id: "a-003",
        username: "Sarah J. Maas",
        email: "sarah@example.com",
        password: "password",
        role: "author",
        status: "active",
        joined: new Date("2025-12-20").getTime(),
      },
      {
        id: "a-004",
        username: "George R.R. Martin",
        email: "george@example.com",
        password: "password",
        role: "author",
        status: "active",
        joined: new Date("2025-11-05").getTime(),
      },
      {
        id: "a-005",
        username: "J.R.R. Tolkien",
        email: "jrrtolkien@example.com",
        password: "password",
        role: "author",
        status: "active",
        joined: new Date("2025-10-15").getTime(),
      },
      {
        id: "u-100",
        username: "Bram Stoker",
        email: "bramstoker@gmail.com",
        password: "bramstoker",
        role: "author",
        status: "active",
        joined: new Date("2026-09-11").getTime(),
      },
    ];

    let modified = false;
    demoAuthors.forEach((demo) => {
      const existingIndex = users.findIndex((u) => u.id === demo.id);
      if (existingIndex === -1) {
        users.push(demo);
        modified = true;
      }
    });

    if (modified) {
      localStorage.setItem("users", JSON.stringify(users));
    }
  }

  seedDemoAuthors();

  // --- 1. Load and Render Authors ---
  function loadAndRenderUsers() {
    let allUsers = JSON.parse(localStorage.getItem("users")) || [];

    let needsSave = false;
    allUsers.forEach((u, i) => {
      if (!u.id) {
        u.id = "u-" + (Date.now() + i);
        needsSave = true;
      }
      if (!u.status) {
        u.status = "active";
        needsSave = true;
      }
      if (!u.joined) {
        u.joined = Date.now();
        needsSave = true;
      }
    });
    if (needsSave) localStorage.setItem("users", JSON.stringify(allUsers));

    // Filter for authors only AND exclude archived ones
    const users = allUsers.filter((u) => u.role === "author" && !u.archived);

    // Update Stats
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.status === "active").length;
    const thirtyDaysAgo = Date.now() - 30 * 86400000;
    const newUsers = users.filter((u) => u.joined > thirtyDaysAgo).length;

    if (statTotal) statTotal.textContent = totalUsers.toLocaleString();
    if (statActive) statActive.textContent = activeUsers.toLocaleString();
    if (statNew) statNew.textContent = newUsers.toLocaleString();

    if (!tableBody) return;
    tableBody.innerHTML = "";

    if (users.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:28px;color:var(--muted-foreground);">No authors found.</td></tr>`;
      return;
    }

    users.forEach((user) => {
      const tr = document.createElement("tr");
      tr.dataset.userId = user.id;

      const isBanned = user.status === "banned";
      const badgeClass = isBanned ? "banned" : "active";
      const badgeText = isBanned ? "Banned" : "Active";
      const btnClass = isBanned ? "btn-success" : "btn-danger";
      const btnText = isBanned ? "Unban" : "Ban";

      const joinedDate = new Date(user.joined).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      let displayId = user.id.replace("u-", "").replace("a-", "");
      if (displayId.length > 6) displayId = displayId.slice(-4);

      tr.innerHTML = `
        <td>#${escapeHtml(displayId)}</td>
        <td><strong>${escapeHtml(user.username)}</strong></td>
        <td>${escapeHtml(user.email)}</td>
        <td><span class="badge ${badgeClass}">${badgeText}</span></td>
        <td>${joinedDate}</td>
        <td>
          <div class="action-buttons">
            <button class="btn ${btnClass} btn-sm action-btn" data-action="${isBanned ? "unban" : "ban"}">
              ${btnText}
            </button>
            <button class="btn btn-archive btn-sm archive-btn">
              Archive
            </button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    filterTable();
  }

  function escapeHtml(str) {
    return String(str ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }

  // --- 2. Search & Filter ---
  function filterTable() {
    if (!searchInput || !statusFilter || !tableBody) return;
    const query = searchInput.value.toLowerCase();
    const status = statusFilter.value.toLowerCase();
    const rows = tableBody.querySelectorAll("tr");

    rows.forEach((row) => {
      if (row.cells.length < 6) return;
      const username = row.cells[1] ? row.cells[1].innerText.toLowerCase() : "";
      const email = row.cells[2] ? row.cells[2].innerText.toLowerCase() : "";
      const badge = row.querySelector(".badge");
      const badgeText = badge ? badge.innerText.toLowerCase() : "";

      const matchesSearch = username.includes(query) || email.includes(query);
      const matchesStatus = status === "all" || badgeText === status;

      row.style.display = matchesSearch && matchesStatus ? "" : "none";
    });
  }

  if (searchInput) searchInput.addEventListener("input", filterTable);
  if (statusFilter) statusFilter.addEventListener("change", filterTable);

  // --- 3. Ban/Unban/Archive Logic ---
  if (tableBody) {
    tableBody.addEventListener("click", function (e) {
      const btn = e.target.closest(".action-btn");
      const archiveBtn = e.target.closest(".archive-btn");

      if (!btn && !archiveBtn) return;

      const row = btn ? btn.closest("tr") : archiveBtn.closest("tr");
      const id = row.dataset.userId;
      const username = row.cells[1].innerText.trim();

      // Handle Archive
      if (archiveBtn) {
        Swal.fire({
          title: "Archive Author?",
          text: `Are you sure you want to archive "${username}"? They will be moved to the Archive page.`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, archive",
          confirmButtonColor: "#d33",
          cancelButtonColor: "#6b6680",
          reverseButtons: true,
        }).then((result) => {
          if (result.isConfirmed) {
            archiveUser(id);
            Swal.fire({
              icon: "success",
              title: "Author Archived",
              text: `"${username}" has been moved to Archive.`,
              confirmButtonColor: "#b8721f",
            });
          }
        });
        return;
      }

      // Handle Ban/Unban
      const action = btn.dataset.action;
      if (action === "ban") {
        Swal.fire({
          title: "Ban Author?",
          text: `Are you sure you want to ban "${username}"?`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, ban author",
          confirmButtonColor: "#dc2626",
          cancelButtonColor: "#6b6680",
          reverseButtons: true,
        }).then((result) => {
          if (result.isConfirmed) {
            updateUserStatus(id, "banned");
            Swal.fire({
              icon: "success",
              title: "Author Banned",
              text: `"${username}" has been successfully banned.`,
              confirmButtonColor: "#b8721f",
            });
          }
        });
      } else {
        Swal.fire({
          title: "Unban Author?",
          text: `Are you sure you want to restore access for "${username}"?`,
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Yes, unban author",
          confirmButtonColor: "#3f7d4f",
          cancelButtonColor: "#6b6680",
          reverseButtons: true,
        }).then((result) => {
          if (result.isConfirmed) {
            updateUserStatus(id, "active");
            Swal.fire({
              icon: "success",
              title: "Author Unbanned",
              text: `"${username}" has been successfully unbanned.`,
              confirmButtonColor: "#b8721f",
            });
          }
        });
      }
    });
  }

  function updateUserStatus(id, newStatus) {
    let users = JSON.parse(localStorage.getItem("users")) || [];
    const index = users.findIndex((u) => String(u.id) === String(id));
    if (index !== -1) {
      users[index].status = newStatus;
      localStorage.setItem("users", JSON.stringify(users));
      loadAndRenderUsers();
    }
  }

  function archiveUser(id) {
    let users = JSON.parse(localStorage.getItem("users")) || [];
    const index = users.findIndex((u) => String(u.id) === String(id));
    if (index !== -1) {
      users[index].archived = true;
      users[index].archivedAt = Date.now();
      users[index].status = "archived";
      localStorage.setItem("users", JSON.stringify(users));
      loadAndRenderUsers();
    }
  }

  window.addEventListener("focus", () => {
    loadAndRenderUsers();
  });

  loadAndRenderUsers();
});
