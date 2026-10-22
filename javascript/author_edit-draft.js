document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";
  const urlParams = new URLSearchParams(window.location.search);

  // Default to "draft-seed-0" (The Lost Kingdom) if no ID is passed
  const id = urlParams.get("id") || "draft-seed-0";

  let novels = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

  // Seed the hardcoded book if it doesn't exist in local storage yet
  if (!novels.some((n) => String(n.id) === "draft-seed-0")) {
    novels.push({
      id: "draft-seed-0",
      title: "The Lost Kingdom",
      subtitle: "A throne unclaimed",
      genre: "Fantasy",
      synopsis:
        "An heir believed dead. A throne left empty. A kingdom on the brink of war. The Lost Kingdom is the first book in an epic fantasy saga.",
      coverImage: "../image/lostcrown.jpeg",
      status: "draft",
      chapters: [
        {
          number: 1,
          title: "Prologue: The Empty Throne",
          status: "draft",
          words: 1120,
          lastUpdated: Date.now() - 86400000,
        },
        {
          number: 2,
          title: "A Kingdom Without a King",
          status: "draft",
          words: 1890,
          lastUpdated: Date.now() - 172800000,
        },
        {
          number: 3,
          title: "The Broken Oath",
          status: "draft",
          words: 2340,
          lastUpdated: Date.now() - 259200000,
        },
        {
          number: 4,
          title: "Untitled Chapter",
          status: "draft",
          words: 0,
          lastUpdated: Date.now(),
        },
      ],
      reads: 0,
      rating: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastEdited: Date.now(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novels));
  }

  let novel = novels.find((n) => String(n.id) === String(id));

  if (!novel) {
    Swal.fire("Not Found", "This draft does not exist.", "error").then(() => {
      window.location.href = "author_draft-novel.html";
    });
    return;
  }

  if (!Array.isArray(novel.chapters)) novel.chapters = [];

  // ---------- DOM Elements ----------
  const editTitle = document.getElementById("editTitle");
  const editSubtitle = document.getElementById("editSubtitle");
  const editGenre = document.getElementById("editGenre");
  const editSynopsis = document.getElementById("editSynopsis");
  const mainCoverImg = document.getElementById("mainCoverImg");
  const coverUploadZone = document.getElementById("coverUploadZone");
  const chapterTableBody = document.getElementById("chapterTableBody");
  const metaText = document.getElementById("metaText");

  const saveEditBtn = document.getElementById("saveEditBtn");
  const resetEditBtn = document.getElementById("resetEditBtn");
  const addChapterLink = document.getElementById("addChapterLink");

  let pendingCoverData = null;

  // ---------- Helper Functions ----------
  function formatDate(ts) {
    if (!ts) return "Recently";
    return new Date(ts).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function escapeHtml(str) {
    return String(str ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }

  // ---------- Populate Form ----------
  function populateForm() {
    editTitle.value = novel.title || "";
    editSubtitle.value = novel.subtitle || "";
    editGenre.value = novel.genre || "Fantasy";
    editSynopsis.value = novel.synopsis || "";

    // Update main cover image (left side) with the SAVED image
    if (novel.coverImage) {
      mainCoverImg.src = novel.coverImage;
    }

    // Reset the upload box to show text by default
    coverUploadZone.innerHTML = `<p><strong>Click to upload new</strong></p><p class="sub">PNG, JPG, WEBP · Max 5MB</p>`;

    metaText.textContent = `Last edited ${formatDate(novel.lastEdited)}`;
    document.title = `Edit Draft · ${novel.title}`;
    pendingCoverData = null;
  }

  // ---------- Render Chapters ----------
  function renderChapters() {
    chapterTableBody.innerHTML = "";

    const activeChapters = novel.chapters.filter((c) => !c.archived);

    if (activeChapters.length === 0) {
      chapterTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;">No chapters yet. Click "+ Add Chapter" to create one.</td></tr>`;
      return;
    }

    activeChapters.sort((a, b) => a.number - b.number);

    activeChapters.forEach((ch) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${ch.number}</td>
        <td><strong>${escapeHtml(ch.title)}</strong></td>
        <td><span class="badge draft">Draft</span></td>
        <td>${ch.words || "—"}</td>
        <td>${formatDate(ch.lastUpdated)}</td>
        <td>
          <a href="author_add-editchapter.html?novelId=${novel.id}&chapterNum=${ch.number}" class="btn btn-sm">Edit</a>
          <button class="btn btn-sm btn-danger archive-chapter-btn" data-chapter="${ch.number}">Archive</button>
        </td>
      `;
      chapterTableBody.appendChild(tr);
    });
  }

  // ---------- Initial Paint ----------
  populateForm();
  renderChapters();
  addChapterLink.href = `author_add-editchapter.html?novelId=${novel.id}`;

  // ---------- Cover Upload Logic ----------
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/png, image/jpeg, image/webp";
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);

  coverUploadZone.addEventListener("click", () => fileInput.click());
  mainCoverImg.style.cursor = "pointer";
  mainCoverImg.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire("Too large", "Max file size is 5MB.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      pendingCoverData = e.target.result;

      // Show a LARGE preview inside the dashed box, but DO NOT update the left image yet.
      coverUploadZone.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 12px; width: 100%; padding: 10px;">
          <img src="${pendingCoverData}" style="width: 100%; max-height: 400px; border-radius: 8px; object-fit: contain; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
          <p class="sub" style="margin: 0; font-weight: 600; color: var(--primary);">New cover selected. Click "Save Changes" to apply.</p>
        </div>
      `;
    };
    reader.readAsDataURL(file);
    fileInput.value = "";
  });

  // ---------- Save Changes ----------
  saveEditBtn.addEventListener("click", () => {
    const newTitle = editTitle.value.trim();
    if (!newTitle) {
      Swal.fire("Missing Title", "Please enter a title.", "warning");
      return;
    }

    novel.title = newTitle;
    novel.subtitle = editSubtitle.value.trim();
    novel.genre = editGenre.value;
    novel.synopsis = editSynopsis.value.trim();

    // Apply the pending cover image now
    if (pendingCoverData) {
      novel.coverImage = pendingCoverData;
    }

    novel.lastEdited = Date.now();

    // Update in localStorage
    const index = novels.findIndex((n) => String(n.id) === String(id));
    if (index !== -1) {
      novels[index] = novel;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novels));
    }

    Swal.fire("Saved!", "Your draft details have been updated.", "success");

    // Refresh the form (this will update the large left image to the newly saved one)
    populateForm();
  });

  // ---------- Reset Form ----------
  resetEditBtn.addEventListener("click", () => {
    populateForm();
    Swal.fire("Reset", "Fields restored to last saved values.", "info");
  });

  // ---------- Archive Chapter ----------
  chapterTableBody.addEventListener("click", (e) => {
    const btn = e.target.closest(".archive-chapter-btn");
    if (!btn) return;
    const chNum = btn.dataset.chapter;

    Swal.fire({
      title: "Archive Chapter?",
      text: "This chapter will be moved to the Archive.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#b8721f",
      confirmButtonText: "Archive",
    }).then((res) => {
      if (!res.isConfirmed) return;

      // Find chapter and set archived to true
      const chapter = novel.chapters.find(
        (c) => String(c.number) === String(chNum),
      );
      if (chapter) {
        chapter.archived = true;
        chapter.archivedAt = Date.now();
      }

      // Update localStorage
      const index = novels.findIndex((n) => String(n.id) === String(id));
      if (index !== -1) {
        novels[index].chapters = novel.chapters;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(novels));
      }

      renderChapters();
      Swal.fire("Archived!", "Chapter moved to Archive.", "success");
    });
  });
});
