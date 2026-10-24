document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".weeklycards-rows");
  if (!container) return;

  const novels = JSON.parse(localStorage.getItem("novels") || "[]");

  const newBooks = novels
    .filter((n) => {
      if (n.status !== "published" || n.archived || n.deletedByAuthor)
        return false;

      if (n.id === "seed-0" || n.id === "dracula" || n.systemSeeded)
        return false;

      const hardcodedIds = [
        "a-tale-of-two-cities",
        "pride-and-prejudice",
        "treasure-island",
        "frankenstein",
        "emma",
        "jane-eyre",
        "sense-and-sensibility",
        "wuthering-heights",
        "a-farewell-to-arms",
        "quo-vadis",
        "a-tangled-tale",
      ];
      if (hardcodedIds.includes(n.id)) return false;

      return true;
    })
    // Sort from Oldest to Newest so when we loop, the newest ends up first on the left
    .sort(
      (a, b) =>
        (a.createdAt || a.updatedAt || 0) - (b.createdAt || b.updatedAt || 0),
    );

  // 🚨 FIX: Loop through ALL new books, not just newBooks[0]
  newBooks.forEach((book) => {
    const targetUrl = `reader.html?id=${book.id}`;

    // Prevent duplicates if the book is already in the row
    if (container.querySelector(`a[href="${targetUrl}"]`)) return;

    const newLink = document.createElement("a");
    newLink.href = targetUrl;
    const imgSrc = book.coverImage || "../image/logo.png";
    const authorName = book.author || "Unknown Author";

    newLink.innerHTML = `
      <div class="weekly-card">
        <img src="${imgSrc}" alt="${book.title}" />
        <h3>${book.title}</h3>
        <p>by ${authorName}</p>
      </div>
    `;

    // Add it to the very beginning (left side)
    container.insertBefore(newLink, container.firstChild);

    // If we now have more than 4 books, remove the rightmost one
    if (container.children.length > 4) {
      container.removeChild(container.lastElementChild);
    }
  });
});
