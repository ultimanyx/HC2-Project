document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";

  const titleInput = document.getElementById("title");
  const subtitleInput = document.getElementById("subtitle");
  const genreSelect = document.getElementById("genre");
  const tagsInput = document.getElementById("tags");
  const synopsisInput = document.getElementById("synopsis");
  const chapterTitleInput = document.getElementById("chapter1Title");
  const chapterInput = document.getElementById("firstChapter");

  const saveDraftBtn = document.querySelector(".btn:not(.btn-primary)");
  const publishBtn = document.querySelector(".btn-primary");

  /* ---------- COVER IMAGE UPLOAD ---------- */
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
        if (typeof Swal !== "undefined") {
          Swal.fire({
            icon: "error",
            title: "Too large",
            text: "Max 5MB.",
            confirmButtonColor: "#b8721f",
          });
        } else {
          alert("Image too large. Max 5MB.");
        }
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

  /* ---------- SAVE NOVEL ---------- */
  function saveNovel(status) {
    const title = titleInput.value.trim();
    const genre = genreSelect.value;
    const synopsis = synopsisInput.value.trim();
    const chapterBody = chapterInput.value.trim();

    if (!title || !genre || !synopsis || !chapterBody) {
      if (typeof Swal !== "undefined") {
        Swal.fire({
          icon: "warning",
          title: "Missing information",
          text: "Title, Genre, Synopsis and First Chapter are required.",
          confirmButtonColor: "#b8721f",
        });
      } else {
        alert("Title, Genre, Synopsis and First Chapter are required.");
      }
      return;
    }

    const chapterTitle = (chapterTitleInput?.value || "").trim() || "Chapter 1";
    const chapterWords = chapterBody.split(/\s+/).filter(Boolean).length;

    const novel = {
      id: Date.now(),
      title,
      subtitle: subtitleInput.value.trim(),
      genre,
      tags: tagsInput.value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      synopsis,
      coverImage: coverImageDataUrl,
      status,
      chapters: [
        {
          number: 1,
          title: chapterTitle,
          body: chapterBody,
          status,
          words: chapterWords,
          lastUpdated: Date.now(),
        },
      ],
      reads: 0,
      rating: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    all.push(novel);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

    const target =
      status === "draft" ? "author_draft-novel.html" : "author_all-novel.html";

    if (typeof Swal !== "undefined") {
      Swal.fire({
        icon: "success",
        title: status === "draft" ? "Draft saved" : "Novel published",
        text: `"${title}" has been ${
          status === "draft" ? "saved as draft" : "published"
        }.`,
        confirmButtonColor: "#b8721f",
      }).then(() => {
        window.location.href = target;
      });
    } else {
      window.location.href = target;
    }
  }

  saveDraftBtn?.addEventListener("click", () => saveNovel("draft"));
  publishBtn?.addEventListener("click", () => saveNovel("published"));
});
