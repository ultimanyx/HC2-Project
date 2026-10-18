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
  const viewMode = document.getElementById("viewMode");
  const editMode = document.getElementById("editMode");
  const titleEl = document.getElementById("titleView");
  const subtitleEl = document.getElementById("subtitleView");
  const synopsisEl = document.getElementById("synopsisView");
  const tagsEl = document.getElementById("tagsView");
  const coverImg = document.querySelector(".novel-cover img");
  const statusBadge = document.querySelector(".action-bar .badge");
  const metaText = document.querySelector(".action-bar .meta-text");
  const editNovelBtn = document.getElementById("editNovelBtn");
  const saveBtn = document.getElementById("saveEditBtn");
  const resetBtn = document.getElementById("cancelEditBtn");
  const coverZone = document.getElementById("coverUploadZone");

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

  // ---------- Render view mode ----------
  function renderView() {
    if (titleEl) titleEl.textContent = novel.title || "";
    if (subtitleEl) subtitleEl.textContent = novel.subtitle || "";
    if (synopsisEl) synopsisEl.textContent = novel.synopsis || "";
    if (coverImg && novel.coverImage) coverImg.src = novel.coverImage;

    if (tagsEl) {
      tagsEl.innerHTML = (novel.tags || [])
        .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
        .join("");
    }

    if (statusBadge) {
      const s = normalizeStatus(novel.status);
      statusBadge.textContent = STATUS_TO_LABEL[s];
      statusBadge.className = `badge ${STATUS_BADGE_CLASS[s] || "active"}`;
    }

    if (metaText && novel.updatedAt) {
      metaText.textContent = `Last updated ${timeAgo(novel.updatedAt)}`;
    }

    document.title = `${novel.title} · View Novel`;
    wireAddChapterButton();
  }

  // ---------- Render chapters ----------
  function renderChapters() {
    const tbody = document.getElementById("chapterTableBody");
    if (!tbody) return;

    // If `novel.chapters` is NOT a real array (e.g., seed-0 stores the
    // chapter *count* as a number), leave the hardcoded demo rows alone.
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
      tr.innerHTML = `
      <td>${ch.number ?? ""}</td>
      <td><strong>${escapeHtml(ch.title || "Untitled")}</strong></td>
      <td><span class="badge ${ch.status === "draft" ? "draft" : "active"}">
        ${ch.status === "draft" ? "Draft" : "Published"}
      </span></td>
      <td>${ch.words || "—"}</td>
      <td>${new Date(ch.lastUpdated || Date.now()).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-sm edit-chapter-btn"   data-chapter="${ch.number}">Edit</button>
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

  // ---------- Edit mode plumbing ----------
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
    editTitle.value = novel.title || "";
    editSubtitle.value = novel.subtitle || "";
    editGenre.value = novel.genre || "Fantasy";
    editTags.value = (novel.tags || []).join(", ");
    editSynopsis.value = novel.synopsis || "";
    editStatus.value = STATUS_TO_LABEL[normalizeStatus(novel.status)];
    pendingCoverData = null;
    renderCoverZone();
  }

  function enterEditMode() {
    populateEditForm();
    viewMode.hidden = true;
    editMode.hidden = false;
    if (editNovelBtn) editNovelBtn.hidden = true;
  }

  function exitEditMode() {
    viewMode.hidden = false;
    editMode.hidden = true;
    if (editNovelBtn) editNovelBtn.hidden = false;
    pendingCoverData = null;
  }

  if (editNovelBtn) editNovelBtn.addEventListener("click", enterEditMode);

  // Reset — revert fields to saved values (does NOT persist)
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

  // Save — persist + re-render + reflect on All Novels
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
          text: "Storage quota exceeded — the cover image is probably too large. Try a smaller file.",
          icon: "error",
        });
        return;
      }

      novel = updated;
      renderView();
      renderChapters();
      exitEditMode();

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
  renderView();
  renderChapters();
});
