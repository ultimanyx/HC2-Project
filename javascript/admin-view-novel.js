document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";
  const urlParams = new URLSearchParams(window.location.search);
  const novelId = urlParams.get("novelId");

  if (!novelId) {
    Swal.fire({
      title: "Error",
      text: "No novel selected.",
      icon: "error",
      confirmButtonColor: "#dc2626",
    }).then(() => {
      window.location.href = "admin_all-novels.html";
    });
    return;
  }

  let novels = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  let novel = novels.find((n) => String(n.id) === String(novelId));

  if (!novel) {
    Swal.fire({
      title: "Not Found",
      text: "This novel does not exist.",
      icon: "error",
      confirmButtonColor: "#dc2626",
    }).then(() => {
      window.location.href = "admin_all-novels.html";
    });
    return;
  }

  // Patch "Dracula" (seed-0) if it's missing its details
  if (String(novel.id) === "seed-0" && !novel.coverImage) {
    novel.subtitle = "A Gothic Horror Classic";
    novel.synopsis =
      "A young English lawyer travels to Transylvania to assist a Count with a real estate transaction, only to discover the Count's dark, supernatural secret. As Dracula moves to England, a small group of brave souls must band together to stop the ancient vampire from spreading his curse.";
    novel.coverImage =
      "../books/Horror/Dracula by Bram Stoker/dracula-9781476788104_lg.jpg";
    novel.author = "Bram Stoker";
    novel.genre = "Horror";

    const index = novels.findIndex((n) => String(n.id) === "seed-0");
    if (index !== -1) {
      novels[index] = novel;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novels));
    }
  }

  // Patch "Shadows of the Crown" (demo-novel) if it's missing its cover
  if (String(novel.id) === "demo-novel" && !novel.coverImage) {
    novel.coverImage =
      "../books/Fantasy/A_Tangled_Tale by Lewis_Carroll (Unzipped Files)/A_Tangled_Tale- cover art.png";
    novel.author = "Sarah J.";
    novel.genre = "Fantasy";

    const index = novels.findIndex((n) => String(n.id) === "demo-novel");
    if (index !== -1) {
      novels[index] = novel;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novels));
    }
  }

  if (!Array.isArray(novel.chapters)) novel.chapters = [];

  const formatDate = (ts) => {
    if (!ts) return "Recently";
    return new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Populate Header
  document.getElementById("headerNovelTitle").textContent = novel.title;
  document.getElementById("titleView").textContent = novel.title;
  document.getElementById("subtitleView").textContent = novel.subtitle || "";
  document.getElementById("synopsisView").textContent = novel.synopsis || "";
  document.getElementById("novelMetaText").textContent =
    `Last updated ${formatDate(novel.updatedAt || novel.lastEdited)}`;

  // Populate Author and Genre
  document.getElementById("novelAuthor").textContent =
    "By " + (novel.author || "Unknown Author");
  document.getElementById("novelGenre").textContent =
    novel.genre || "Unknown Genre";

  // Populate Cover Image
  const coverImg = document.getElementById("novelCoverImg");
  if (coverImg && novel.coverImage) {
    coverImg.src = novel.coverImage;
  }

  // Populate Status Badge
  const statusBadge = document.getElementById("novelStatusBadge");
  const s = (novel.status || "").toLowerCase();
  statusBadge.textContent =
    s === "published" ? "Ongoing" : novel.status || "Ongoing";
  statusBadge.className = `badge ${s === "published" ? "active" : s === "completed" ? "completed" : s === "pending" ? "pending" : "active"}`;

  // Populate Chapters
  const tbody = document.getElementById("chapterTableBody");
  const activeChapters = novel.chapters
    .filter((c) => !c.archived)
    .sort((a, b) => a.number - b.number);

  if (activeChapters.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;">No chapters yet.</td></tr>`;
    return;
  }

  activeChapters.forEach((ch) => {
    const tr = document.createElement("tr");

    // Determine badge
    let badgeClass = "active";
    let badgeText = "Published";
    const chStatus = (ch.status || "").toLowerCase();

    if (chStatus === "draft") {
      badgeClass = "draft";
      badgeText = "Draft";
    } else if (chStatus === "pending") {
      badgeClass = "pending";
      badgeText = "Pending Review";
    } else if (chStatus === "broken") {
      badgeClass = "paused";
      badgeText = "Broken Content";
    }

    tr.innerHTML = `
      <td>${ch.number}</td>
      <td><strong>${ch.title || "Untitled"}</strong></td>
      <td><span class="badge ${badgeClass}">${badgeText}</span></td>
      <td>${ch.words ? Number(ch.words).toLocaleString() : "—"}</td>
      <td>${formatDate(ch.lastUpdated)}</td>
      <td>
        <a href="admin_view-chapter.html?novelId=${novel.id}&chapter=${ch.number}" class="btn btn-sm btn-primary">View</a>
        <button class="btn btn-sm btn-danger archive-chapter-btn" data-id="${ch.number}">Archive</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Archive Chapter Logic
  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest(".archive-chapter-btn");
    if (!btn) return;
    const chNum = btn.dataset.id;

    Swal.fire({
      title: "Archive this chapter?",
      text: "The chapter will be hidden from the novel.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Archive",
      confirmButtonColor: "#b8721f",
      cancelButtonColor: "#6b7280", // Added matching cancel color
    }).then((res) => {
      if (!res.isConfirmed) return;

      try {
        const chapter = novel.chapters.find(
          (c) => String(c.number) === String(chNum),
        );
        if (chapter) {
          chapter.archived = true;
          chapter.archivedAt = Date.now();
        }

        // Save to storage
        const index = novels.findIndex((n) => String(n.id) === String(novelId));
        if (index !== -1) {
          novels[index].chapters = novel.chapters;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(novels));
        }

        //  Show success message FIRST, then reload when they click OK
        Swal.fire({
          title: "Archived!",
          text: "The chapter has been archived.",
          icon: "success",
          confirmButtonColor: "#b8721f",
        }).then(() => {
          // Reload page ONLY AFTER they dismiss the success message
          window.location.reload();
        });
      } catch (error) {
        // Catch LocalStorage quota errors just in case
        console.error("Archive failed:", error);
        Swal.fire({
          title: "Error",
          text: "Could not archive chapter. Your browser storage might be full.",
          icon: "error",
          confirmButtonColor: "#dc2626",
        });
      }
    });
  });
});
