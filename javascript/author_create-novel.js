document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // ELEMENT REFERENCES
  // ==========================================
  const titleInput = document.getElementById("title");
  const subtitleInput = document.getElementById("subtitle");
  const genreSelect = document.getElementById("genre");
  const tagsInput = document.getElementById("tags");
  const synopsisInput = document.getElementById("synopsis");
  const firstChapterInput = document.getElementById("firstChapter");

  const coverUpload = document.querySelector(".cover-upload");
  const saveDraftBtn = document.querySelector(".btn:not(.btn-primary)");
  const publishBtn = document.querySelector(".btn-primary");

  const STORAGE_KEY = "novels";

  // ==========================================
  // SAVE HELPER
  // ==========================================
  function saveNovel(data, status) {
    const novels = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    novels.push({
      ...data,
      id: Date.now(),
      status, // "draft" or "published"
      chapters: 1,
      reads: 0,
      rating: null,
      createdAt: new Date().toISOString(),
      lastEdited: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novels));
  }

  // ==========================================
  // COVER IMAGE UPLOAD + PREVIEW
  // ==========================================
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/png, image/jpeg, image/webp";
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);

  let coverImageDataUrl = null;

  if (coverUpload) {
    coverUpload.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: "error",
          title: "File too large",
          text: "Cover image must be under 5MB.",
          confirmButtonColor: "#b8721f",
        });
        fileInput.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        coverImageDataUrl = e.target.result;
        coverUpload.innerHTML = "";
        coverUpload.style.padding = "0";
        coverUpload.style.border = "1px solid var(--border)";
        coverUpload.style.background = "transparent";

        const img = document.createElement("img");
        img.src = coverImageDataUrl;
        img.alt = "Cover preview";
        img.style.cssText =
          "width:100%;height:180px;object-fit:cover;border-radius:8px;display:block;";
        coverUpload.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  }

  // ==========================================
  // COLLECT FORM DATA
  // ==========================================
  function collectFormData() {
    return {
      title: titleInput.value.trim(),
      subtitle: subtitleInput.value.trim(),
      genre: genreSelect.value,
      tags: tagsInput.value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      synopsis: synopsisInput.value.trim(),
      firstChapter: firstChapterInput.value.trim(),
      coverImage: coverImageDataUrl,
    };
  }

  // ==========================================
  // VALIDATION
  // ==========================================
  function validateForm() {
    const errors = [];

    if (!titleInput.value.trim()) {
      errors.push("Novel Title is required.");
    } else if (titleInput.value.trim().length > 60) {
      errors.push("Novel Title must be 60 characters or less.");
    }

    if (!genreSelect.value) errors.push("Genre is required.");
    if (!synopsisInput.value.trim()) errors.push("Synopsis is required.");
    if (!firstChapterInput.value.trim())
      errors.push("First Chapter is required.");

    return errors;
  }

  function highlightFields(errors) {
    [titleInput, genreSelect, synopsisInput, firstChapterInput].forEach(
      (f) => f && (f.style.borderColor = ""),
    );

    if (errors.some((e) => e.includes("Title")) && titleInput)
      titleInput.style.borderColor = "var(--destructive)";
    if (errors.some((e) => e.includes("Genre")) && genreSelect)
      genreSelect.style.borderColor = "var(--destructive)";
    if (errors.some((e) => e.includes("Synopsis")) && synopsisInput)
      synopsisInput.style.borderColor = "var(--destructive)";
    if (errors.some((e) => e.includes("First Chapter")) && firstChapterInput)
      firstChapterInput.style.borderColor = "var(--destructive)";
  }

  // ==========================================
  // SAVE AS DRAFT
  // ==========================================
  if (saveDraftBtn) {
    saveDraftBtn.addEventListener("click", async () => {
      const confirm = await Swal.fire({
        title: "Save as Draft?",
        text: "You can continue editing this novel later from your Drafts.",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Save Draft",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#b8721f",
      });
      if (!confirm.isConfirmed) return;

      try {
        saveNovel(collectFormData(), "draft");
        Swal.fire({
          icon: "success",
          title: "Draft Saved",
          text: "Your novel has been saved as a draft.",
          confirmButtonColor: "#b8721f",
        }).then(() => {
          window.location.href = "author_draft-novel.html";
        });
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Save Failed",
          text: "Could not save draft. Please try again.",
          confirmButtonColor: "#b8721f",
        });
      }
    });
  }

  // ==========================================
  // PUBLISH
  // ==========================================
  if (publishBtn) {
    publishBtn.addEventListener("click", async () => {
      const errors = validateForm();

      if (errors.length > 0) {
        highlightFields(errors);
        Swal.fire({
          icon: "warning",
          title: "Missing Information",
          html: `<ul style="text-align:left;padding-left:18px;">${errors
            .map((e) => `<li>${e}</li>`)
            .join("")}</ul>`,
          confirmButtonColor: "#b8721f",
        });
        return;
      }

      const confirm = await Swal.fire({
        title: "Publish Novel?",
        text: "Once published, readers will be able to see and read your novel.",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Publish",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#b8721f",
      });
      if (!confirm.isConfirmed) return;

      try {
        saveNovel(collectFormData(), "published");
        Swal.fire({
          icon: "success",
          title: "Novel Published!",
          text: "Your novel is now live for readers to discover.",
          confirmButtonColor: "#b8721f",
        }).then(() => {
          window.location.href = "author_all-novel.html";
        });
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Publish Failed",
          text: "Could not publish novel. Please try again.",
          confirmButtonColor: "#b8721f",
        });
      }
    });
  }

  // ==========================================
  // CLEAR RED BORDERS WHEN TYPING
  // ==========================================
  [titleInput, genreSelect, synopsisInput, firstChapterInput].forEach(
    (field) => {
      if (!field) return;
      const evt = field.tagName === "SELECT" ? "change" : "input";
      field.addEventListener(evt, () => (field.style.borderColor = ""));
    },
  );
});
