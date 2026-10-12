document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";

  const titleInput = document.getElementById("title");
  const subtitleInput = document.getElementById("subtitle");
  const genreSelect = document.getElementById("genre");
  const tagsInput = document.getElementById("tags");
  const synopsisInput = document.getElementById("synopsis");
  const chapterInput = document.getElementById("firstChapter");

  const saveDraftBtn = document.querySelector(".btn:not(.btn-primary)");
  const publishBtn = document.querySelector(".btn-primary");

  // ---- COVER IMAGE (unchanged) ----
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/png, image/jpeg, image/webp";
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);

  let coverImageDataUrl = null;
  const coverUpload = document.querySelector(".cover-upload");

  if (coverUpload) {
    coverUpload.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({ icon: "error", title: "Too large", text: "Max 5MB." });
        fileInput.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        coverImageDataUrl = e.target.result;
        coverUpload.innerHTML = `<img src="${coverImageDataUrl}" style="width:100%;height:180px;object-fit:cover;border-radius:8px;display:block;">`;
      };
      reader.readAsDataURL(file);
    });
  }

  function saveNovel(status) {
    const title = titleInput.value.trim();
    const genre = genreSelect.value;

    if (
      !title ||
      !genre ||
      !synopsisInput.value.trim() ||
      !chapterInput.value.trim()
    ) {
      Swal.fire({
        icon: "warning",
        title: "Missing information",
        text: "Title, Genre, Synopsis and First Chapter are required.",
        confirmButtonColor: "#b8721f",
      });
      return;
    }

    const novel = {
      id: Date.now(),
      title,
      subtitle: subtitleInput.value.trim(),
      genre,
      tags: tagsInput.value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      synopsis: synopsisInput.value.trim(),
      coverImage: coverImageDataUrl,
      status,
      chapters: [
        {
          number: 1,
          title: "Chapter 1",
          body: chapterInput.value.trim(),
          status,
          words: chapterInput.value.trim().split(/\s+/).length,
          lastUpdated: new Date().toISOString(),
        },
      ],
      reads: 0,
      rating: null,
      createdAt: new Date().toISOString(),
      lastEdited: new Date().toISOString(),
    };

    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    all.push(novel);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

    Swal.fire({
      icon: "success",
      title: status === "draft" ? "Draft saved" : "Novel published",
      confirmButtonColor: "#b8721f",
    }).then(() => {
      window.location.href =
        status === "draft"
          ? "author_draft-novel.html"
          : "author_all-novel.html";
    });
  }

  saveDraftBtn?.addEventListener("click", () => saveNovel("draft"));
  publishBtn?.addEventListener("click", () => saveNovel("published"));
});
