document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";
  const urlParams = new URLSearchParams(location.search);
  const editId = urlParams.get("id");
  let existingNovel = null;

  const titleInput = document.getElementById("title");
  const subtitleInput = document.getElementById("subtitle");
  const genreSelect = document.getElementById("genre");
  const tagsInput = document.getElementById("tags");
  const synopsisInput = document.getElementById("synopsis");
  const chapterTitleInput = document.getElementById("chapter1Title");
  const chapterInput = document.getElementById("firstChapter");

  // These are the buttons you pointed out
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
        Swal.fire({ icon: "error", title: "Too large", text: "Max 5MB." });
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

  /* ---------- PRE-FILL IF EDITING ---------- */
  if (editId) {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    existingNovel = all.find((n) => String(n.id) === String(editId));

    if (existingNovel) {
      // Change page title & button text
      document.querySelector(".topbar h1").textContent = "Edit Novel";
      if (saveDraftBtn) saveDraftBtn.textContent = "Save Updates as Draft";
      if (publishBtn) publishBtn.textContent = "Publish Updates";

      // Fill the form fields
      titleInput.value = existingNovel.title || "";
      subtitleInput.value = existingNovel.subtitle || "";
      genreSelect.value = existingNovel.genre || "";
      tagsInput.value = Array.isArray(existingNovel.tags)
        ? existingNovel.tags.join(", ")
        : "";
      synopsisInput.value = existingNovel.synopsis || "";

      // Fill Chapter 1 (if it exists)
      if (existingNovel.chapters && existingNovel.chapters.length > 0) {
        chapterTitleInput.value = existingNovel.chapters[0].title || "";
        chapterInput.value = existingNovel.chapters[0].body || "";
      }

      // Fill Cover Image
      if (existingNovel.coverImage) {
        coverImageDataUrl = existingNovel.coverImage;
        coverUpload.innerHTML = `<img src="${coverImageDataUrl}" style="width:100%;height:180px;object-fit:cover;border-radius:8px;display:block;">`;
      }
    }
  }

  /* ---------- SAVE NOVEL (CREATE OR UPDATE) ---------- */
  function saveNovel(status) {
    const title = titleInput.value.trim();
    const genre = genreSelect.value;
    const synopsis = synopsisInput.value.trim();
    const chapterBody = chapterInput.value.trim();

    // Validation
    if (!title || !genre || !synopsis || !chapterBody || !coverImageDataUrl) {
      Swal.fire({
        icon: "warning",
        title: "Missing information",
        text: "Title, Genre, Synopsis, First Chapter, and Cover Image are required.",
        confirmButtonColor: "#b8721f",
      });
      return;
    }

    const chapterTitle = (chapterTitleInput?.value || "").trim() || "Chapter 1";
    const chapterWords = chapterBody.split(/\s+/).filter(Boolean).length;
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    if (editId && existingNovel) {
      /* ========== UPDATE EXISTING NOVEL ========== */
      const index = all.findIndex((n) => String(n.id) === String(editId));
      if (index !== -1) {
        const updated = all[index];

        // Update main details
        updated.title = title;
        updated.subtitle = subtitleInput.value.trim();
        updated.genre = genre;
        updated.tags = tagsInput.value
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        updated.synopsis = synopsis;
        updated.status = status;
        updated.coverImage = coverImageDataUrl;
        updated.lastEdited = Date.now();

        // Update only the FIRST chapter's text (leaves the rest of the table intact)
        if (!Array.isArray(updated.chapters)) updated.chapters = [];
        if (updated.chapters.length > 0) {
          updated.chapters[0].title = chapterTitle;
          updated.chapters[0].body = chapterBody;
          updated.chapters[0].words = chapterWords;
          updated.chapters[0].status = status;
          updated.chapters[0].lastUpdated = Date.now();
        } else {
          updated.chapters.push({
            number: 1,
            title: chapterTitle,
            body: chapterBody,
            status,
            words: chapterWords,
            lastUpdated: Date.now(),
          });
        }

        all[index] = updated;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: `"${title}" details have been saved.`,
          confirmButtonColor: "#b8721f",
        }).then(() => {
          // Return to the View page to see the changes
          window.location.href = `author_view-novel.html?id=${editId}`;
        });
      }
    } else {
      /* ========== CREATE NEW NOVEL ========== */
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
        lastEdited: Date.now(),
      };

      all.push(novel);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

      const target =
        status === "draft"
          ? "author_draft-novel.html"
          : "author_all-novel.html";

      Swal.fire({
        icon: "success",
        title: status === "draft" ? "Draft saved" : "Novel published",
        text: `"${title}" has been saved.`,
        confirmButtonColor: "#b8721f",
      }).then(() => {
        window.location.href = target;
      });
    }
  }

  // Bind the buttons you specified
  saveDraftBtn?.addEventListener("click", () => saveNovel("draft"));
  publishBtn?.addEventListener("click", () => saveNovel("published"));
});
