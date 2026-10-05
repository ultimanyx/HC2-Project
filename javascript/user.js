const select = document.getElementById("chapter-number");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const rows = document.querySelectorAll("#chapter-list tr");
const groups = ["1-20", "21-40", "41-47"];

function showGroup(group) {
  // Show only rows belonging to the selected group
  rows.forEach(function (row) {
    row.style.display = row.dataset.group === group ? "" : "none";
  });

  // Sync the dropdown
  select.value = group;

  // Enable/disable Previous & Next
  const idx = groups.indexOf(group);
  prevBtn.disabled = idx === 0;
  nextBtn.disabled = idx === groups.length - 1;
}

// Dropdown change
select.addEventListener("change", function (event) {
  showGroup(event.target.value);
});

// Previous button
prevBtn.addEventListener("click", function () {
  const idx = groups.indexOf(select.value);
  if (idx > 0) {
    showGroup(groups[idx - 1]);
  }
});

// Next button
nextBtn.addEventListener("click", function () {
  const idx = groups.indexOf(select.value);
  if (idx < groups.length - 1) {
    showGroup(groups[idx + 1]);
  }
});

// Initial render
showGroup("1-20");

// Add to Library button
const statusBtn = document.getElementById("add-library-button");
const bookTitle = document.getElementById("titleBook").textContent;

statusBtn.addEventListener("click", function () {
  if (statusBtn.textContent === "+ Add to Library") {
    statusBtn.textContent = "Added to Library";
    statusBtn.style.backgroundColor = "#b8721f";
    statusBtn.style.color = "#ffffff";
    Swal.fire({
      title: "Book Added Successfully!",
      text: `You added "${bookTitle}" to your library!`,
      icon: "success",
    });
  } else {
    statusBtn.textContent = "+ Add to Library";
    statusBtn.style.backgroundColor = "";
    Swal.fire({
      title: "Book Removed Successfully!",
      text: `You removed "${bookTitle}" from your library!`,
      icon: "info",
    });
  }
});
