document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";
  const urlParams = new URLSearchParams(location.search);
  const editId = urlParams.get("id");
  let existingNovel = null;

  // 🚨 GET CURRENT AUTHOR NAME FROM SESSION
  const currentUser = JSON.parse(
    sessionStorage.getItem("currentUser") ||
      sessionStorage.getItem("currentAuthor") ||
      "{}",
  );
  const authorName = currentUser.username || currentUser.penName || "Author";

  const titleInput = document.getElementById("title");
  const subtitleInput = document.getElementById("subtitle");
  const genreSelect = document.getElementById("genre");
  const synopsisInput = document.getElementById("synopsis");
  const chapterTitleInput = document.getElementById("chapter1Title");
  const chapterInput = document.getElementById("firstChapter");

  const saveDraftBtn = document.querySelector(".btn-draft");
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
        coverUpload.innerHTML = `<img src="${coverImageDataUrl}" style="width:100%;height:100%;object-fit:contain;border-radius:4px;display:block;">`;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ---------- PRE-FILL IF EDITING ---------- */
  if (editId) {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    existingNovel = all.find((n) => String(n.id) === String(editId));

    if (existingNovel) {
      document.querySelector(".topbar h1").textContent = "Edit Novel";
      if (saveDraftBtn) saveDraftBtn.textContent = "Save Updates as Draft";
      if (publishBtn) publishBtn.textContent = "Submit Updates for Review";

      titleInput.value = existingNovel.title || "";
      subtitleInput.value = existingNovel.subtitle || "";
      genreSelect.value = existingNovel.genre || "";
      synopsisInput.value = existingNovel.synopsis || "";

      if (existingNovel.chapters && existingNovel.chapters.length > 0) {
        chapterTitleInput.value = existingNovel.chapters[0].title || "";
        // Strip HTML tags for the plain textarea on the edit page
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML =
          existingNovel.chapters[0].body ||
          existingNovel.chapters[0].content ||
          "";
        chapterInput.value = tempDiv.textContent || tempDiv.innerText || "";
      }

      if (existingNovel.coverImage) {
        coverImageDataUrl = existingNovel.coverImage;
        coverUpload.innerHTML = `<img src="${coverImageDataUrl}" style="width:100%;height:100%;object-fit:contain;border-radius:4px;display:block;">`;
      }
    }
  }

  /* ---------- SAVE NOVEL (CREATE OR UPDATE) ---------- */
  function saveNovel(status) {
    const title = titleInput.value.trim();
    const genre = genreSelect.value;
    const synopsis = synopsisInput.value.trim();

    // 🚨 FIX: Convert raw text line breaks into HTML paragraphs
    const rawChapterBody = chapterInput.value.trim();
    const paragraphs = rawChapterBody.split(/\n\s*\n/);
    const chapterBody = paragraphs
      .map((p) => {
        if (!p.trim()) return "";
        const inner = p.trim().replace(/\n/g, "<br>");
        return `<p>${inner}</p>`;
      })
      .join("");

    if (
      !title ||
      !genre ||
      !synopsis ||
      !rawChapterBody ||
      !coverImageDataUrl
    ) {
      Swal.fire({
        icon: "warning",
        title: "Missing information",
        text: "Title, Genre, Synopsis, First Chapter, and Cover Image are required.",
        confirmButtonColor: "#b8721f",
      });
      return;
    }

    const chapterTitle = (chapterTitleInput?.value || "").trim() || "Chapter 1";
    const chapterWords = rawChapterBody.split(/\s+/).filter(Boolean).length;
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    if (editId && existingNovel) {
      /* ========== UPDATE EXISTING NOVEL ========== */
      const index = all.findIndex((n) => String(n.id) === String(editId));
      if (index !== -1) {
        const updated = all[index];

        updated.title = title;
        updated.subtitle = subtitleInput.value.trim();
        updated.genre = genre;
        updated.synopsis = synopsis;
        updated.status = status;
        updated.coverImage = coverImageDataUrl;
        updated.author = authorName;
        updated.lastEdited = Date.now();

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
          text:
            status === "pending"
              ? "Your novel is pending admin approval."
              : `"${title}" details have been saved.`,
          confirmButtonColor: "#b8721f",
        }).then(() => {
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
        synopsis,
        coverImage: coverImageDataUrl,
        status,
        author: authorName,
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
        title: status === "draft" ? "Draft saved" : "Submitted for Review",
        text:
          status === "draft"
            ? `"${title}" has been saved.`
            : `"${title}" is pending admin approval.`,
        confirmButtonColor: "#b8721f",
      }).then(() => {
        window.location.href = target;
      });
    }
  }

  // Bind the buttons
  saveDraftBtn?.addEventListener("click", () => saveNovel("draft"));
  publishBtn?.addEventListener("click", () => saveNovel("pending"));
});
