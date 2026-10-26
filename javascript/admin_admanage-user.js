document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("search-user");
  const statusFilter = document.getElementById("status-filter");
  const tableBody = document.getElementById("userTableBody");

  const statTotal = document.getElementById("stat-total");
  const statActive = document.getElementById("stat-active");
  const statNew = document.getElementById("stat-new");

  // --- 0. CLEANUP DUPLICATES ---
  function cleanupDuplicateUsers() {
    let users = JSON.parse(localStorage.getItem("users")) || [];
    const uniqueUsers = Array.from(
      new Map(users.map((user) => [user.id, user])).values(),
    );
    if (users.length !== uniqueUsers.length) {
      localStorage.setItem("users", JSON.stringify(uniqueUsers));
    }
  }

  // --- 1. Seed Demo Readers ---
  function seedDemoReaders() {
    let users = JSON.parse(localStorage.getItem("users")) || [];

    const demoReaders = [
      {
        id: "u-001",
        username: "John Smith",
        email: "john@gmail.com",
        password: "john123",
        role: "reader",
        status: "active",
        joined: new Date("2026-01-12").getTime(),
      },
      {
        id: "u-002",
        username: "Jane Reader",
        email: "jane@gmail.com",
        password: "jane123",
        role: "reader",
        status: "active",
        joined: new Date("2026-02-03").getTime(),
      },
      {
        id: "u-003",
        username: "Emma Reader",
        email: "emma@gmail.com",
        password: "emma123",
        role: "reader",
        status: "active",
        joined: new Date("2025-10-15").getTime(),
      },
    ];

    let modified = false;
    demoReaders.forEach((demo) => {
      const existingIndex = users.findIndex((u) => u.id === demo.id);
      // ONLY add them if they don't exist.
      if (existingIndex === -1) {
        users.push(demo);
        modified = true;
      }
    });

    if (modified) {
      localStorage.setItem("users", JSON.stringify(users));
    }
  }

  cleanupDuplicateUsers();
  seedDemoReaders();

  // --- 2. Load and Render Readers ---
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

    // Filter for readers only AND exclude archived ones
    const users = allUsers.filter((u) => u.role === "reader" && !u.archived);

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
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:28px;color:var(--muted-foreground);">No readers found.</td></tr>`;
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

      let displayId = user.id.replace("u-", "");
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
          title: "Archive Reader?",
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
              title: "User Archived",
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
          title: "Ban Reader?",
          text: `Are you sure you want to ban "${username}"?`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, ban user",
          confirmButtonColor: "#dc2626",
          cancelButtonColor: "#6b6680",
          reverseButtons: true,
        }).then((result) => {
          if (result.isConfirmed) {
            updateUserStatus(id, "banned");
            Swal.fire({
              icon: "success",
              title: "User Banned",
              text: `"${username}" has been successfully banned.`,
              confirmButtonColor: "#b8721f",
            });
          }
        });
      } else {
        Swal.fire({
          title: "Unban Reader?",
          text: `Are you sure you want to restore access for "${username}"?`,
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Yes, unban user",
          confirmButtonColor: "#3f7d4f",
          cancelButtonColor: "#6b6680",
          reverseButtons: true,
        }).then((result) => {
          if (result.isConfirmed) {
            updateUserStatus(id, "active");
            Swal.fire({
              icon: "success",
              title: "User Unbanned",
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
    } else {
      console.error("User not found for archiving:", id);
    }
  }

  // Listen for changes in other tabs
  window.addEventListener("storage", (e) => {
    if (e.key === "users") {
      loadAndRenderUsers();
    }
  });

  loadAndRenderUsers();
});
