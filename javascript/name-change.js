document.addEventListener("DOMContentLoaded", function () {
  console.log("--- Name Change Script Loaded ---");

  // ==========================================
  // 1. CHECK FOR READER (Home Page)
  // ==========================================
  const savedReader = sessionStorage.getItem("currentReader");
  const readerNameElement = document.getElementById("readerName");

  console.log("Reader Session Found:", savedReader);
  console.log("Reader HTML Element Found:", readerNameElement);

  if (savedReader && readerNameElement) {
    try {
      const reader = JSON.parse(savedReader);
      if (reader && reader.username) {
        readerNameElement.textContent = `Welcome, ${reader.username}`;
        console.log("Successfully updated reader name to:", reader.username);
      }
    } catch (e) {
      console.error("Error reading reader session data:", e);
    }
  }

  // ==========================================
  // 2. CHECK FOR AUTHOR (Author Dashboard)
  // ==========================================
  const savedAuthor = sessionStorage.getItem("currentAuthor");
  const authorNameElement = document.getElementById("authorName");
  const authorAvatarElement = document.getElementById("authorAvatar");

  console.log("Author Session Found:", savedAuthor);
  console.log("Author HTML Element Found:", authorNameElement);

  if (savedAuthor && authorNameElement) {
    try {
      const author = JSON.parse(savedAuthor);

      // Use penName if it exists and isn't empty, otherwise use username
      const displayName =
        author.penName && author.penName.trim() !== ""
          ? author.penName
          : author.username;

      if (displayName) {
        authorNameElement.textContent = displayName;

        if (authorAvatarElement) {
          const nameParts = displayName.trim().split(" ");
          let initials = "";

          if (nameParts.length > 0 && nameParts[0] !== "") {
            initials += nameParts[0].charAt(0).toUpperCase();
          }
          if (nameParts.length > 1 && nameParts[nameParts.length - 1] !== "") {
            initials += nameParts[nameParts.length - 1].charAt(0).toUpperCase();
          }

          authorAvatarElement.textContent = initials;
          console.log(
            "Successfully updated author name and avatar to:",
            displayName,
            initials,
          );
        }
      }
    } catch (e) {
      console.error("Error reading author session data:", e);
    }
  }
});
