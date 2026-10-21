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

  // ---------- DOM refs ----------
  const statusBadge = document.querySelector(".action-bar .badge");
  const metaText = document.querySelector(".action-bar .meta-text");
  const saveBtn = document.getElementById("saveEditBtn");
  const resetBtn = document.getElementById("cancelEditBtn");
  const coverZone = document.getElementById("coverUploadZone");
  const mainCoverImg = document.querySelector(".novel-cover img"); // Added reference to big image

  const editTitle = document.getElementById("editTitle");
  const editSubtitle = document.getElementById("editSubtitle");
  const editGenre = document.getElementById("editGenre");
  const editTags = document.getElementById("editTags");
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

  // ---------- Render Chapter Table ----------
  function renderChapters() {
    const tbody = document.getElementById("chapterTableBody");
    if (!tbody) return;

    if (!Array.isArray(novel.chapters)) return;

    const chapters = novel.chapters;
    tbody.innerHTML = "";

    if (chapters.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;">
      No chapters yet. Click "+ Add Chapter" to create one.
    </td></tr>`;
      return;
    }

    chapters.forEach((ch) => {
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
      }

      tr.innerHTML = `
      <td>${ch.number ?? ""}</td>
      <td><strong>${escapeHtml(ch.title || "Untitled")}</strong></td>
      <td><span class="badge ${badgeClass}">${badgeText}</span></td>
      <td>${ch.words || "—"}</td>
      <td>${new Date(ch.lastUpdated || Date.now()).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-sm edit-chapter-btn" data-chapter="${ch.number}">Edit</button>
        <button class="btn btn-sm btn-danger delete-chapter-btn" data-chapter="${ch.number}">Delete</button>
      </td>`;
      tbody.appendChild(tr);
    });
  }

  // ---------- Add Chapter link ----------
  function wireAddChapterButton() {
    const btn = document.getElementById("addChapterBtn");
    if (!btn) return;
    const parentA = btn.closest("a") || btn;
    const page =
      normalizeStatus(novel.status) === "draft"
        ? "author_addchapter-draft.html"
        : "author_addchapter-ongoing.html";
    const url = `${page}?novelId=${encodeURIComponent(novel.id)}`;
    if (parentA.tagName === "A") parentA.href = url;
    else btn.onclick = () => (location.href = url);
  }

  // ---------- Edit Form / Saving ----------
  let pendingCoverData = null;

  function renderCoverZone() {
    if (!coverZone) return;
    const src = pendingCoverData || novel.coverImage;
    const preview = src
      ? `<img src="${src}" alt="cover preview"
              style="max-width:100%;max-height:120px;border-radius:8px;display:block;margin:8px auto 0;" />`
      : "";
    const heading = pendingCoverData
      ? `<p><strong>New cover selected</strong></p><p class="sub">Click to replace</p>`
      : `<p><strong>Click to upload new</strong></p><p class="sub">PNG, JPG, WEBP · Max 5MB</p>`;
    coverZone.innerHTML = heading + preview;
  }

  function populateEditForm() {
    let tagsString = "";
    if (Array.isArray(novel.tags)) {
      tagsString = novel.tags.join(", ");
    } else if (novel.tags) {
      tagsString = String(novel.tags);
    }

    // Update text fields
    if (editTitle) editTitle.value = novel.title || "";
    if (editSubtitle) editSubtitle.value = novel.subtitle || "";
    if (editGenre) editGenre.value = novel.genre || "Fantasy";
    if (editTags) editTags.value = tagsString;
    if (editSynopsis) editSynopsis.value = novel.synopsis || "";
    if (editStatus)
      editStatus.value = STATUS_TO_LABEL[normalizeStatus(novel.status)];

    // Update status badge & time
    if (statusBadge) {
      const s = normalizeStatus(novel.status);
      statusBadge.textContent = STATUS_TO_LABEL[s];
      statusBadge.className = `badge ${STATUS_BADGE_CLASS[s] || "active"}`;
    }
    if (metaText && novel.updatedAt) {
      metaText.textContent = `Last updated ${timeAgo(novel.updatedAt)}`;
    }

    // Update the large cover image on the left
    if (mainCoverImg && novel.coverImage) {
      mainCoverImg.src = novel.coverImage;
    }

    document.title = `${novel.title} · View Novel`;

    pendingCoverData = null;
    renderCoverZone();
  }

  // Reset button (reverts form to saved data)
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

  // Save button
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
        tags: editTags.value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
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
        Swal.fire({
          title: "Couldn't save",
          text: "Storage quota exceeded — the cover image is probably too large. Try a smaller image.",
          icon: "error",
        });
        return;
      }

      novel = updated;
      populateEditForm(); // Re-renders form fields & the large cover image
      renderChapters(); // Re-renders chapters table

      Swal.fire({
        icon: "success",
        title: "Novel Updated",
        text: `"${updated.title}" has been saved.`,
        confirmButtonText: "OK",
      });
    });
  }

  // ---------- Cover upload ----------
  const coverInput = document.createElement("input");
  coverInput.type = "file";
  coverInput.accept = "image/png,image/jpeg,image/webp";
  coverInput.style.display = "none";
  document.body.appendChild(coverInput);

  // Allow clicking the big image on the left to upload
  if (mainCoverImg) {
    mainCoverImg.style.cursor = "pointer";
    mainCoverImg.addEventListener("click", () => coverInput.click());
  }

  // Allow clicking the upload zone on the right to upload
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
      renderCoverZone();
    };
    reader.readAsDataURL(file);
    coverInput.value = "";
  });

  // ---------- Initial paint ----------
  populateEditForm(); // Fill the form immediately on page load
  renderChapters();
  wireAddChapterButton();
});
