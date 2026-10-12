document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";
  const id = new URLSearchParams(location.search).get("id");

  // No id or static row → keep the demo content as-is
  if (!id || id.startsWith("static-")) {
    wireAddChapterButton(null);
    return;
  }

  const novel = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]").find(
    (n) => String(n.id) === String(id),
  );

  if (!novel) {
    wireAddChapterButton(null);
    return;
  }

  // ---- Header ----
  const titleEl = document.getElementById("titleView");
  const subtitleEl = document.getElementById("subtitleView");
  const synopsisEl = document.getElementById("synopsisView");
  const tagsEl = document.getElementById("tagsView");
  const coverImg = document.querySelector(".novel-cover img");
  const statusBadge = document.querySelector(".action-bar .badge");

  if (titleEl) titleEl.textContent = novel.title;
  if (subtitleEl) subtitleEl.textContent = novel.subtitle || "";
  if (synopsisEl) synopsisEl.textContent = novel.synopsis || "";
  if (coverImg && novel.coverImage) coverImg.src = novel.coverImage;

  if (tagsEl) {
    tagsEl.innerHTML = (novel.tags || [])
      .map((t) => `<span class="tag">${t}</span>`)
      .join("");
  }

  if (statusBadge) {
    const label = novel.status === "draft" ? "Draft" : "Ongoing";
    statusBadge.textContent = label;
    statusBadge.className = `badge ${novel.status === "draft" ? "draft" : "active"}`;
  }

  // Page title
  document.title = `${novel.title} · View Novel`;

  // ---- Chapters table ----
  const tbody = document.getElementById("chapterTableBody");
  if (tbody) {
    tbody.innerHTML = "";
    const chapters = Array.isArray(novel.chapters) ? novel.chapters : [];

    if (chapters.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;">
        No chapters yet. Click "+ Add Chapter" to create one.
      </td></tr>`;
    } else {
      chapters.forEach((ch) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${ch.number ?? ""}</td>
          <td><strong>${ch.title || "Untitled"}</strong></td>
          <td><span class="badge ${ch.status === "draft" ? "draft" : "active"}">
            ${ch.status === "draft" ? "Draft" : "Published"}
          </span></td>
          <td>${ch.words || "—"}</td>
          <td>${new Date(ch.lastUpdated || Date.now()).toLocaleDateString()}</td>
          <td>
            <button class="btn btn-sm edit-chapter-btn" data-chapter="${ch.number}">Edit</button>
            <button class="btn btn-sm btn-danger delete-chapter-btn" data-chapter="${ch.number}">Delete</button>
          </td>`;
        tbody.appendChild(tr);
      });
    }
  }

  // ---- Wire Add Chapter button ----
  wireAddChapterButton(novel.id);

  function wireAddChapterButton(novelId) {
    const btn = document.getElementById("addChapterBtn");
    if (!btn) return;
    const parentA = btn.closest("a") || btn;
    const page =
      novel?.status === "draft"
        ? "author_addchapter-draft.html"
        : "author_addchapter-ongoing.html";
    const url = novelId ? `${page}?novelId=${novelId}` : page;
    if (parentA.tagName === "A") parentA.href = url;
    else btn.addEventListener("click", () => (location.href = url));
  }
});
