/* ==========================================================================
   admin_all-novels.js  (simplified)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  const tbody = document.querySelector(".table-card table tbody");
  if (!tbody) return;

  const search = document.getElementById("search-novel");
  const status = document.getElementById("status-filter");
  const sort = document.getElementById("sort-novel");
  const buttons = document.querySelectorAll(".filter-actions .btn");

  // The HTML has two buttons: "Reset" first, "Apply Filter" second.
  const applyBtn = Array.from(buttons).find((b) =>
    /apply/i.test(b.textContent),
  );
  const resetBtn = Array.from(buttons).find((b) =>
    /reset/i.test(b.textContent),
  );

  const rows = () => Array.from(tbody.querySelectorAll("tr"));

  /* ---------- helpers ---------- */
  const text = (row, i) => (row.cells[i]?.textContent || "").trim();
  const title = (row) => text(row, 0);
  const badge = (row) => row.querySelector(".badge")?.textContent.trim() || "";
  const reads = (row) => parseFloat(text(row, 4).replace(/[^\d.]/g, "")) || 0;
  const rating = (row) => parseFloat(text(row, 5).replace(/[^\d.]/g, "")) || 0;

  /* ---------- stats ---------- */
  function updateStats() {
    const all = rows();
    document.getElementById("stat-total").textContent = all.length;
    document.getElementById("stat-pending").textContent = all.filter((r) =>
      /pending/i.test(badge(r)),
    ).length;
  }

  /* ---------- filter + sort ---------- */
  function apply() {
    const q = search.value.trim().toLowerCase();
    const s = status.value.toLowerCase();
    const by = sort.value;

    rows().forEach((row) => {
      const match =
        (!q || title(row).toLowerCase().includes(q)) &&
        (s === "all" || badge(row).toLowerCase() === s);
      row.style.display = match ? "" : "none";
    });

    const cmp =
      by === "Reads"
        ? (a, b) => reads(b) - reads(a)
        : by === "Rating"
          ? (a, b) => rating(b) - rating(a)
          : (a, b) => title(a).localeCompare(title(b));

    rows()
      .sort(cmp)
      .forEach((r) => tbody.appendChild(r));

    updateStats();
  }

  function reset() {
    search.value = "";
    status.value = "All";
    sort.value = "Title";
    rows().forEach((r) => (r.style.display = ""));
    rows()
      .sort((a, b) => title(a).localeCompare(title(b)))
      .forEach((r) => tbody.appendChild(r));
    updateStats();
  }

  /* ---------- archive ---------- */
  tbody.addEventListener("click", function (e) {
    const btn = e.target.closest(".archive-novel-btn");
    if (!btn) return;

    const row = btn.closest("tr");
    const name = title(row);

    Swal.fire({
      title: "Archive this novel?",
      text: `"${name}" will be moved to the archive.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Archive",
      confirmButtonColor: "#c0392b",
    }).then((res) => {
      if (!res.isConfirmed) return;
      row.remove();
      updateStats();
      Swal.fire({
        title: "Archived",
        text: name,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    });
  });

  /* ---------- wire up ---------- */
  applyBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    apply();
  });
  resetBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    reset();
  });
  search?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") apply();
  });

  updateStats();
});
