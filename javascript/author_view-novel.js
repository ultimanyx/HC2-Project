document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";
  const id = new URLSearchParams(location.search).get("id");

  // ---------- Load novel ----------
  if (!id) {
    Swal.fire("Error", "No novel selected.", "error").then(() => {
      window.location.href = "author_all-novel.html";
    });
    return;
  }

  let novel = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]").find(
    (n) => String(n.id) === String(id),
  );

  if (!novel) {
    Swal.fire(
      "Not Found",
      "This novel doesn't exist or was deleted.",
      "error",
    ).then(() => {
      window.location.href = "author_all-novel.html";
    });
    return;
  }

  // Sanitize chapters array (prevents deletion bug on restore)
  if (!Array.isArray(novel.chapters)) {
    novel.chapters = [];
  }

  // ---------- DOM refs ----------
  const statusBadge = document.querySelector(".action-bar .badge");
  const metaText = document.querySelector(".action-bar .meta-text");
  const saveBtn = document.getElementById("saveEditBtn");
  const resetBtn = document.getElementById("cancelEditBtn");
  const coverZone = document.getElementById("coverUploadZone");
  const mainCoverImg = document.querySelector(".novel-cover img");
  const tbody = document.getElementById("chapterTableBody");

  const editTitle = document.getElementById("editTitle");
  const editSubtitle = document.getElementById("editSubtitle");
  const editGenre = document.getElementById("editGenre");
  const editSynopsis = document.getElementById("editSynopsis");
  const editStatus = document.getElementById("editStatus");

  // ---------- Status helpers ----------
  const STATUS_TO_LABEL = {
    published: "Ongoing",
    completed: "Completed",
    draft: "Draft",
    pending: "Pending Review",
    hiatus: "On Hiatus",
  };
  const LABEL_TO_STATUS = Object.fromEntries(
    Object.entries(STATUS_TO_LABEL).map(([k, v]) => [v, k]),
  );
  const STATUS_BADGE_CLASS = {
    published: "active",
    completed: "completed",
    draft: "draft",
    pending: "pending",
    hiatus: "paused",
  };

  function normalizeStatus(s) {
    if (!s) return "published";
    if (STATUS_TO_LABEL[s]) return s;
    const low = String(s).toLowerCase();
    if (low === "ongoing") return "published";
    if (low === "on hiatus") return "hiatus";
    if (low === "pending review") return "pending";
    return STATUS_TO_LABEL[low] ? low : "published";
  }

  // ---------- Misc helpers ----------
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

  function timeAgo(ts) {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m} min ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d} day${d === 1 ? "" : "s"} ago`;
    return new Date(ts).toLocaleDateString();
  }

  // ==========================================
  // RENDER CHAPTERS
  // ==========================================
  function renderChapters() {
    if (!tbody) return;

    // Force-update Dracula if it has less than 27 chapters
    if (id === "seed-0" && novel.chapters.length < 27) {
      const htmlRows = tbody.querySelectorAll("tr");
      if (htmlRows.length >= 27) {
        novel.chapters = Array.from(htmlRows).map((tr, index) => ({
          number: index + 1,
          title:
            tr.querySelector("td:nth-child(2) strong")?.textContent.trim() ||
            "Untitled",
          status: "published",
          words: tr.querySelector("td:nth-child(4)")?.textContent.trim() || "0",
          lastUpdated: Date.now(),
        }));

        const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        const idx = raw.findIndex((n) => String(n.id) === String(id));
        if (idx >= 0) {
          raw[idx].chapters = novel.chapters;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
        }
      }
    }

    tbody.innerHTML = "";

    // Filter out archived chapters
    const activeChapters = novel.chapters.filter((c) => !c.archived);

    if (activeChapters.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:#6b6680;">
        No chapters yet. Click "+ Add Chapter" to create one.
      </td></tr>`;
      return;
    }

    activeChapters.forEach((ch) => {
      const tr = document.createElement("tr");

      const chStatus = String(ch.status || "published").toLowerCase();
      let badgeClass = "active";
      let badgeText = "Published";

      if (chStatus === "draft") {
        badgeClass = "draft";
        badgeText = "Draft";
      } else if (chStatus === "pending") {
        badgeClass = "pending";
        badgeText = "Pending Review";
      } else if (chStatus === "paused") {
        badgeClass = "paused";
        badgeText = "Broken Content";
      }

      tr.innerHTML = `
        <td>${ch.number}</td>
        <td><strong>${escapeHtml(ch.title || "Untitled")}</strong></td>
        <td><span class="badge ${badgeClass}">${badgeText}</span></td>
        <td>${ch.words || "—"}</td>
        <td>${ch.lastUpdated ? new Date(ch.lastUpdated).toLocaleDateString() : "Just now"}</td>
        <td>
          <a href="author_add-editchapter.html?novelId=${novel.id}&chapterNum=${ch.number}" class="btn btn-sm">Edit</a>
          <button class="btn btn-sm btn-danger archive-chapter-btn" data-chapter="${ch.number}">Archive</button>
        </td>`;

      tbody.appendChild(tr);
    });
  }

  // ---------- Archive Chapter Logic ----------
  if (tbody) {
    tbody.addEventListener("click", (e) => {
      const btn = e.target.closest(".archive-chapter-btn");
      if (!btn) return;

      const chapterNum = btn.dataset.chapter;
      if (!chapterNum) return;

      Swal.fire({
        title: "Archive Chapter?",
        text: "This chapter will be hidden from the list.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#b8721f",
        cancelButtonColor: "#6b6680",
        confirmButtonText: "Yes, archive it",
      }).then((res) => {
        if (res.isConfirmed) {
          const chapter = novel.chapters.find(
            (c) => String(c.number) === String(chapterNum),
          );
          if (chapter) {
            chapter.archived = true;
            chapter.archivedAt = Date.now();
          }

          const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
          const idx = raw.findIndex((n) => String(n.id) === String(id));
          if (idx >= 0) {
            raw[idx].chapters = novel.chapters;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
          }

          renderChapters();
          Swal.fire("Archived!", "The chapter has been archived.", "success");
        }
      });
    });
  }

  // ---------- Add Chapter link ----------
  function wireAddChapterButton() {
    const btn = document.getElementById("addChapterBtn");
    if (!btn) return;
    const parentA = btn.closest("a") || btn;
    const url = `author_add-editchapter.html?novelId=${encodeURIComponent(novel.id)}`;
    if (parentA.tagName === "A") parentA.href = url;
    else btn.onclick = () => (location.href = url);
  }

  // ---------- Edit Form / Saving ----------
  let pendingCoverData = null;

  function renderCoverZone() {
    if (!coverZone) return;

    // The preview is now completely removed from the box
    const heading = pendingCoverData
      ? `<p><strong>New cover selected</strong></p><p class="sub">Click to replace</p>`
      : `<p><strong>Click to upload new</strong></p><p class="sub">PNG, JPG, WEBP · Max 5MB</p>`;

    coverZone.innerHTML = heading;
  }

  function populateEditForm() {
    if (editTitle)
      editTitle.value =
        novel.title !== undefined ? novel.title : editTitle.value;
    if (editSubtitle)
      editSubtitle.value =
        novel.subtitle !== undefined ? novel.subtitle : editSubtitle.value;
    if (editGenre) editGenre.value = novel.genre || "Fantasy";
    if (editSynopsis)
      editSynopsis.value =
        novel.synopsis !== undefined ? novel.synopsis : editSynopsis.value;

    if (editStatus)
      editStatus.value = STATUS_TO_LABEL[normalizeStatus(novel.status)];

    if (statusBadge) {
      const s = normalizeStatus(novel.status);
      statusBadge.textContent = STATUS_TO_LABEL[s];
      statusBadge.className = `badge ${STATUS_BADGE_CLASS[s] || "active"}`;
    }
    if (metaText && novel.updatedAt) {
      metaText.textContent = `Last updated ${timeAgo(novel.updatedAt)}`;
    }

    if (mainCoverImg && novel.coverImage) {
      mainCoverImg.src = novel.coverImage;
    }

    document.title = `${novel.title} · View Novel`;

    pendingCoverData = null;
    renderCoverZone();
  }

  // Reset button
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      populateEditForm();
      Swal.fire({
        icon: "info",
        title: "Form Reset",
        text: "Fields have been restored to their last saved values.",
        confirmButtonText: "OK",
      });
    });
  }

  // Save Novel button
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const newTitle = editTitle.value.trim();
      if (!newTitle) {
        Swal.fire("Missing title", "Please enter a title.", "warning");
        return;
      }

      const updated = {
        ...novel,
        title: newTitle,
        subtitle: editSubtitle.value.trim(),
        genre: editGenre.value,
        synopsis: editSynopsis.value.trim(),
        status:
          LABEL_TO_STATUS[editStatus.value] || normalizeStatus(novel.status),
        coverImage: pendingCoverData || novel.coverImage,
        updatedAt: Date.now(),
      };

      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const idx = raw.findIndex((n) => String(n.id) === String(id));
      if (idx >= 0) raw[idx] = updated;

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
      } catch (err) {
        Swal.fire(
          "Couldn't save",
          "Storage quota exceeded. Try a smaller image.",
          "error",
        );
        return;
      }

      novel = updated;
      populateEditForm();

      Swal.fire(
        "Novel Updated",
        `"${updated.title}" has been saved.`,
        "success",
      );
    });
  }

  // ---------- Cover upload ----------
  const coverInput = document.createElement("input");
  coverInput.type = "file";
  coverInput.accept = "image/png,image/jpeg,image/webp";
  coverInput.style.display = "none";
  document.body.appendChild(coverInput);

  if (mainCoverImg) {
    mainCoverImg.style.cursor = "pointer";
    mainCoverImg.addEventListener("click", () => coverInput.click());
  }

  if (coverZone) {
    coverZone.style.cursor = "pointer";
    coverZone.addEventListener("click", () => coverInput.click());
  }

  coverInput.addEventListener("change", () => {
    const file = coverInput.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire("Too large", "Max file size is 5MB.", "error");
      coverInput.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      pendingCoverData = reader.result;

      // Update the large cover on the left immediately
      if (mainCoverImg) {
        mainCoverImg.src = pendingCoverData;
      }

      renderCoverZone();
    };
    reader.readAsDataURL(file);
    coverInput.value = "";
  });

  // ---------- Initial paint ----------
  populateEditForm();
  renderChapters();
  wireAddChapterButton();
});
