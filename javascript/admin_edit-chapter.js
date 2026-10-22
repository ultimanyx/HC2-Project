document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";
  const urlParams = new URLSearchParams(window.location.search);
  const novelId = urlParams.get("novelId");
  const chapterNum = urlParams.get("chapter");

  if (!novelId || !chapterNum) {
    Swal.fire("Error", "Missing chapter data.", "error").then(() => {
      window.location.href = "admin_all-novels.html";
    });
    return;
  }

  let novels = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  let novel = novels.find((n) => String(n.id) === String(novelId));
  let chapter = novel?.chapters?.find(
    (c) => String(c.number) === String(chapterNum),
  );

  if (!novel || !chapter) {
    Swal.fire("Not Found", "This chapter does not exist.", "error").then(() => {
      window.location.href = "admin_all-novels.html";
    });
    return;
  }

  // Populate Header
  document.getElementById("metaChapterNum").textContent =
    `Chapter ${chapter.number}`;
  document.getElementById("metaNovelName").textContent = novel.title;

  const statusBadge = document.getElementById("statusBadge");
  const s = (chapter.status || "").toLowerCase();
  statusBadge.textContent =
    s === "published"
      ? "Published"
      : s === "draft"
        ? "Draft"
        : s === "pending"
          ? "Pending"
          : "Published";
  statusBadge.className = `badge ${s === "published" ? "active" : s === "draft" ? "draft" : s === "pending" ? "pending" : "active"}`;

  // Populate Form Fields
  document.getElementById("chapterTitle").value = chapter.title || "";
  document.getElementById("chapterNumber").value = chapter.number || 1;
  document.getElementById("authorNote").value = chapter.authorNote || "";
  document.getElementById("chapterContent").value =
    chapter.body || chapter.content || "";

  // Fix Back Button
  const backBtn = document.getElementById("backToNovelBtn");
  if (backBtn) {
    backBtn.href = `admin-view-novel.html?novelId=${novelId}`;
  }

  // Archive Chapter Logic
  document.getElementById("archiveBtn").addEventListener("click", () => {
    Swal.fire({
      title: "Archive this chapter?",
      text: "It will be moved to the Archive page.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Archive",
      confirmButtonColor: "#b8721f",
    }).then((res) => {
      if (!res.isConfirmed) return;

      chapter.archived = true;
      chapter.archivedAt = Date.now();
      chapter.status = "archived";

      // Save to localStorage
      const index = novels.findIndex((n) => String(n.id) === String(novelId));
      if (index !== -1) {
        novels[index].chapters = novel.chapters;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(novels));
      }

      Swal.fire("Archived!", "Chapter moved to Archive.", "success").then(
        () => {
          window.location.href = `admin-view-novel.html?novelId=${novelId}`;
        },
      );
    });
  });
});
