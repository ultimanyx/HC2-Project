document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";
  const id = new URLSearchParams(location.search).get("id");

  // seed-0 = the static demo → leave the HTML exactly as it is
  if (id === "seed-0") return;

  const getNovels = () => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };
  const saveNovels = (list) =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

  const novels = getNovels();
  const novel = id ? novels.find((n) => String(n.id) === String(id)) : null;

  if (!novel) {
    console.warn(
      "[view-novel] No novel matched id:",
      id,
      "Stored ids:",
      novels.map((n) => n.id),
    );
    const h2 = document.getElementById("titleView");
    if (h2) h2.textContent = "Novel not found";
    const tb = document.getElementById("chapterTableBody");
    if (tb)
      tb.innerHTML = `
      <tr><td colspan="6" style="text-align:center;padding:24px;">
        No novel found for id "${id ?? "(missing)"}".
      </td></tr>`;
    return;
  }

  const $ = (sel) => document.querySelector(sel);
  const setText = (sel, v) => {
    const el = $(sel);
    if (el) el.textContent = v ?? "";
  };

  /* ---------- header ---------- */
  setText("#titleView", novel.title || "Untitled");
  setText("#topbarTitle", novel.title || "Untitled");
  setText("#subtitleView", novel.subtitle || "");
  setText(
    "#synopsisView",
    novel.synopsis ??
      novel.description ??
      novel.summary ??
      "No synopsis provided yet.",
  );

  document.title = `${novel.title || "Novel"} · View Novel`;

  const coverImg = $(".novel-cover img");
  if (coverImg && novel.coverImage) coverImg.src = novel.coverImage;

  const tagsEl = document.getElementById("tagsView");
  if (tagsEl) {
    const tags = Array.isArray(novel.tags) ? novel.tags : [];
    tagsEl.innerHTML = tags.length
      ? tags.map((t) => `<span class="tag">${t}</span>`).join("")
      : `<span class="tag" style="opacity:.6">No tags</span>`;
  }

  const statusBadge = $(".action-bar .badge");
  if (statusBadge) {
    const isDraft = novel.status === "draft";
    statusBadge.textContent = isDraft ? "Draft" : "Ongoing";
    statusBadge.className = `badge ${isDraft ? "draft" : "active"}`;
  }

  /* ---------- chapters (accept number OR array) ---------- */
  let chapters = [];
  if (Array.isArray(novel.chapters)) {
    chapters = novel.chapters;
  } else if (Number(novel.chapters) > 0) {
    chapters = Array.from({ length: Number(novel.chapters) }, (_, i) => ({
      number: i + 1,
      title: `Chapter ${i + 1}`,
      status: "published",
      words: "—",
      lastUpdated: null,
    }));
  }

  const tbody = document.getElementById("chapterTableBody");
  if (tbody) {
    tbody.innerHTML = chapters.length
      ? chapters
          .map(
            (ch, i) => `
        <tr>
          <td>${ch.number ?? i + 1}</td>
          <td><strong>${ch.title || "Untitled"}</strong></td>
          <td><span class="badge ${ch.status === "draft" ? "draft" : "active"}">
            ${ch.status === "draft" ? "Draft" : "Published"}
          </span></td>
          <td>${ch.words ?? "—"}</td>
          <td>${
            ch.lastUpdated ? new Date(ch.lastUpdated).toLocaleDateString() : "—"
          }</td>
          <td>
            <a href="author_edit-chapter.html?novelId=${encodeURIComponent(
              novel.id,
            )}&chapter=${ch.number ?? i + 1}">
              <button class="btn btn-sm">Edit</button>
            </a>
            <button class="btn btn-sm btn-danger delete-chapter-btn"
                    data-chapter="${ch.number ?? i + 1}">Delete</button>
          </td>
        </tr>`,
          )
          .join("")
      : `<tr><td colspan="6" style="text-align:center;padding:24px;">
           No chapters yet. Click "+ Add Chapter" to create one.
         </td></tr>`;
  }

  /* ---------- add-chapter (safe: novel is defined here) ---------- */
  const addBtn = document.getElementById("addChapterBtn");
  if (addBtn) {
    const page =
      novel.status === "draft"
        ? "author_addchapter-draft.html"
        : "author_addchapter-ongoing.html";
    const url = `${page}?novelId=${encodeURIComponent(novel.id)}`;
    const anchor = addBtn.closest("a");
    if (anchor) anchor.href = url;
    else addBtn.addEventListener("click", () => (location.href = url));
  }

  /* ---------- delete-chapter (from the list) ---------- */
  document
    .getElementById("chapterTableBody")
    ?.addEventListener("click", async (e) => {
      const btn = e.target.closest(".delete-chapter-btn");
      if (!btn) return;
      if (typeof Swal === "undefined") return;

      const chapterNum = Number(btn.dataset.chapter);
      const target = chapters.find(
        (ch, i) => Number(ch.number ?? i + 1) === chapterNum,
      );
      if (!target) return;

      const confirmed = (
        await Swal.fire({
          icon: "warning",
          title: "Delete this chapter?",
          text: `"${
            target.title || `Chapter ${chapterNum}`
          }" will be deleted permanently.`,
          showCancelButton: true,
          confirmButtonText: "Delete",
          cancelButtonText: "Cancel",
          confirmButtonColor: "#d33",
        })
      ).isConfirmed;
      if (!confirmed) return;

      const fresh = getNovels();
      const idx = fresh.findIndex((n) => String(n.id) === String(novel.id));
      if (idx === -1) return;

      fresh[idx].chapters = (fresh[idx].chapters || []).filter(
        (ch, i) => Number(ch.number ?? i + 1) !== chapterNum,
      );
      fresh[idx].chapters.forEach((ch, i) => (ch.number = i + 1));
      fresh[idx].updatedAt = Date.now();
      saveNovels(fresh);

      chapters = fresh[idx].chapters;
      novel.chapters = fresh[idx].chapters;

      // Re-render chapter rows
      if (tbody) {
        tbody.innerHTML = chapters.length
          ? chapters
              .map(
                (ch, i) => `
            <tr>
              <td>${ch.number ?? i + 1}</td>
              <td><strong>${ch.title || "Untitled"}</strong></td>
              <td><span class="badge ${
                ch.status === "draft" ? "draft" : "active"
              }">
                ${ch.status === "draft" ? "Draft" : "Published"}
              </span></td>
              <td>${ch.words ?? "—"}</td>
              <td>${
                ch.lastUpdated
                  ? new Date(ch.lastUpdated).toLocaleDateString()
                  : "—"
              }</td>
              <td>
                <a href="author_edit-chapter.html?novelId=${encodeURIComponent(
                  novel.id,
                )}&chapter=${ch.number ?? i + 1}">
                  <button class="btn btn-sm">Edit</button>
                </a>
                <button class="btn btn-sm btn-danger delete-chapter-btn"
                        data-chapter="${ch.number ?? i + 1}">Delete</button>
              </td>
            </tr>`,
              )
              .join("")
          : `<tr><td colspan="6" style="text-align:center;padding:24px;">
               No chapters yet. Click "+ Add Chapter" to create one.
             </td></tr>`;
      }

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Chapter removed.",
        confirmButtonColor: "#b8721f",
      });
    });
});
