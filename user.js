const select = document.getElementById("chapter-number");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const rows = document.querySelectorAll("#chapter-list tr");
const groups = ["1-20", "21-40", "41-47"];

function showGroup(group) {
  // Show only rows belonging to the selected group
  rows.forEach((row) => {
    row.style.display = row.dataset.group === group ? "" : "none";
  });

  // Sync the dropdown
  select.value = group;

  // Enable/disable Prev & Next at the ends
  const idx = groups.indexOf(group);
  prevBtn.disabled = idx === 0;
  nextBtn.disabled = idx === groups.length - 1;
}

// Dropdown change
select.addEventListener("change", (e) => showGroup(e.target.value));

// Previous button
prevBtn.addEventListener("click", () => {
  const idx = groups.indexOf(select.value);
  if (idx > 0) showGroup(groups[idx - 1]);
});

// Next button
nextBtn.addEventListener("click", () => {
  const idx = groups.indexOf(select.value);
  if (idx < groups.length - 1) showGroup(groups[idx + 1]);
});

// Initial render
showGroup("1-20");
