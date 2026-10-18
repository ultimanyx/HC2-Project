document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  // ---------- DOM refs ----------
  const titleEl = document.getElementById("editTitle");
  const subtitleEl = document.getElementById("editSubtitle");
  const genreEl = document.getElementById("editGenre");
  const tagsEl = document.getElementById("editTags");
  const synopsisEl = document.getElementById("editSynopsis");
  const coverImg = document.querySelector(".novel-cover img");
  const coverZone = document.querySelector(".cover-upload");
  const saveBtn = document.getElementById("saveEditBtn");
  const resetBtn = document.getElementById("resetEditBtn");
  const publishBtn = document.getElementById("editToggleBtn");
  const metaText = document.querySelector(".action-bar .meta-text");
  const addChapterLink = document.getElementById("addChapterLink");
  const chapterTbody = document.getElementById("chapterTableBody");

  // ---------- Helpers ----------
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

  function formatDate(ts) {
    if (!ts) return "—";
    const d = new Date(ts);
    if (isNaN(d)) return "—";
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function showDemoMessage() {
    Swal.fire({
      icon: "info",
      title: "Demo Preview",
      text: "This is placeholder content. Create a draft novel first to edit and save changes.",
      confirmButtonText: "OK",
    });
  }

  // ---------- Load novel ----------
  const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const novel = id ? raw.find((n) => String(n.id) === String(id)) : null;

  // ---------- DEMO MODE: leave hardcoded HTML alone ----------
  if (!novel) {
    saveBtn?.addEventListener("click", showDemoMessage);
    resetBtn?.addEventListener("click", showDemoMessage);
    publishBtn?.addEventListener("click", showDemoMessage);
    chapterTbody?.addEventListener("click", (e) => {
      if (e.target.closest(".delete-chapter-btn")) showDemoMessage();
    });
    return;
  }

  // ---------- REAL MODE ----------
  let pendingCoverData = null;

  function snapshot() {
    return {
      title: novel.title || "",
      subtitle: novel.subtitle || "",
      genre: novel.genre || "Fantasy",
      tags: (novel.tags || []).join(", "),
      synopsis: novel.synopsis || "",
      coverImage: novel.coverImage || "",
    };
  }

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

  function applySnapshot(snap) {
    if (titleEl) titleEl.value = snap.title;
    if (subtitleEl) subtitleEl.value = snap.subtitle;
    if (genreEl) genreEl.value = snap.genre;
    if (tagsEl) tagsEl.value = snap.tags;
    if (synopsisEl) synopsisEl.value = snap.synopsis;
    if (coverImg && snap.coverImage) coverImg.src = snap.coverImage;
    pendingCoverData = null;
    renderCoverZone();
  }

  const originalSnapshot = snapshot();
  applySnapshot(originalSnapshot);

  // Meta
  if (metaText) {
    metaText.textContent = novel.lastEdited
      ? `Last edited ${formatDate(novel.lastEdited)}`
      : "Last edited —";
  }

  // Add Chapter link — carry novelId
  if (addChapterLink) {
    addChapterLink.href = `author_addchapter-draft.html?novelId=${encodeURIComponent(novel.id)}`;
  }

  // ---------- Chapter table ----------
  // Only overwrite the hardcoded rows when chapters is a real array.
  if (chapterTbody && Array.isArray(novel.chapters)) {
    chapterTbody.innerHTML = "";

    if (novel.chapters.length === 0) {
      chapterTbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--muted-foreground);">
        No chapters yet. Click "+ Add Chapter" to create one.
      </td></tr>`;
    } else {
      [...novel.chapters]
        .sort((a, b) => (a.number || 0) - (b.number || 0))
        .forEach((ch) => {
          const words = ch.words || "—";
          const dateStr = ch.lastUpdated ? formatDate(ch.lastUpdated) : "—";
          const editUrl = `author_edit-chapter.html?novelId=${encodeURIComponent(novel.id)}&chapterNum=${ch.number}`;
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${ch.number ?? ""}</td>
            <td><strong>${escapeHtml(ch.title || "Untitled")}</strong></td>
            <td><span class="badge ${ch.status === "draft" ? "draft" : "active"}">
              ${ch.status === "draft" ? "Draft" : "Published"}
            </span></td>
            <td>${words}</td>
            <td>${dateStr}</td>
            <td>
              <a href="${editUrl}"><button class="btn btn-sm">Edit</button></a>
              <button class="btn btn-sm btn-danger delete-chapter-btn"
                      data-chapter="${ch.number}">Delete</button>
            </td>`;
          chapterTbody.appendChild(tr);
        });
    }
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

  // ---------- Save ----------
  saveBtn?.addEventListener("click", () => {
    const newTitle = titleEl.value.trim();
    if (!newTitle) {
      Swal.fire("Missing title", "Please enter a title.", "warning");
      return;
    }

    const updated = {
      ...novel,
      title: newTitle,
      subtitle: subtitleEl.value.trim(),
      genre: genreEl.value,
      tags: tagsEl.value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      synopsis: synopsisEl.value.trim(),
      coverImage: pendingCoverData || novel.coverImage,
      lastEdited: Date.now(),
    };

    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const idx = list.findIndex((n) => String(n.id) === String(id));
    if (idx >= 0) list[idx] = updated;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      Swal.fire(
        "Couldn't save",
        "Storage quota exceeded — try a smaller cover image.",
        "error",
      );
      return;
    }

    Object.assign(novel, updated);
    if (metaText)
      metaText.textContent = `Last edited ${formatDate(updated.lastEdited)}`;
    renderCoverZone();

    Swal.fire({
      icon: "success",
      title: "Draft Saved",
      text: `"${updated.title}" has been updated.`,
      confirmButtonText: "OK",
    });
  });

  // ---------- Reset ----------
  resetBtn?.addEventListener("click", () => {
    applySnapshot(originalSnapshot);
    Swal.fire({
      icon: "info",
      title: "Form Reset",
      text: "Fields restored to last saved values.",
      confirmButtonText: "OK",
    });
  });

  // ---------- Publish book ----------
  publishBtn?.addEventListener("click", () => {
    Swal.fire({
      title: "Publish this book?",
      text: `"${novel.title}" will move from Draft to Ongoing.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Publish",
      confirmButtonColor: "#b8721f",
      cancelButtonText: "Cancel",
    }).then((res) => {
      if (!res.isConfirmed) return;
      const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const idx = list.findIndex((n) => String(n.id) === String(id));
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          status: "published",
          lastEdited: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      }
      Swal.fire({
        icon: "success",
        title: "Published!",
        text: `"${novel.title}" is now ongoing.`,
        confirmButtonText: "OK",
      }).then(() => {
        window.location.href = "author_all-novel.html";
      });
    });
  });

  // ---------- Delete chapter ----------
  chapterTbody?.addEventListener("click", (e) => {
    const btn = e.target.closest(".delete-chapter-btn");
    if (!btn) return;
    const num = btn.dataset.chapter;

    Swal.fire({
      title: "Delete this chapter?",
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#c0392b",
      cancelButtonText: "Cancel",
    }).then((res) => {
      if (!res.isConfirmed) return;
      const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const idx = list.findIndex((n) => String(n.id) === String(id));
      if (idx < 0) return;
      const chapters = Array.isArray(list[idx].chapters)
        ? list[idx].chapters
        : [];
      list[idx].chapters = chapters.filter(
        (c) => String(c.number) !== String(num),
      );
      list[idx].lastEdited = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Chapter removed.",
        confirmButtonText: "OK",
      }).then(() => location.reload());
    });
  });
});
