/* =====================================================
   AUTHOR · VIEW / EDIT NOVEL PAGE
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  /* ============================================
     ELEMENT REFERENCES
  ============================================ */
  const editToggleBtn = document.getElementById("editToggleBtn");
  const viewMode = document.getElementById("viewMode");
  const editMode = document.getElementById("editMode");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const saveEditBtn = document.getElementById("saveEditBtn");
  const addChapterBtn = document.getElementById("addChapterBtn");

  /* ============================================
     TOGGLE VIEW / EDIT MODE
  ============================================ */
  function enterEditMode() {
    viewMode.hidden = true;
    editMode.hidden = false;
    editToggleBtn.textContent = "✓ Editing";
    editToggleBtn.classList.add("is-editing");
  }

  function exitEditMode() {
    viewMode.hidden = false;
    editMode.hidden = true;
    editToggleBtn.textContent = "✎ Edit Novel";
    editToggleBtn.classList.remove("is-editing");
  }

  editToggleBtn.addEventListener("click", () => {
    if (!editMode.hidden) {
      exitEditMode();
    } else {
      enterEditMode();
    }
  });

  cancelEditBtn.addEventListener("click", () => {
    exitEditMode();
  });

  /* ============================================
     SAVE CHANGES (demo)
  ============================================ */
  saveEditBtn.addEventListener("click", () => {
    const updated = {
      title: document.getElementById("editTitle").value.trim(),
      subtitle: document.getElementById("editSubtitle").value.trim(),
      genre: document.getElementById("editGenre").value,
      tags: document.getElementById("editTags").value.trim(),
      synopsis: document.getElementById("editSynopsis").value.trim(),
      status: document.getElementById("editStatus").value,
    };

    // Simple validation
    if (!updated.title) {
      alert("Title cannot be empty.");
      return;
    }

    // Push to the view panel
    document.getElementById("titleView").textContent = updated.title;
    document.getElementById("subtitleView").textContent = updated.subtitle;

    // Status badge + genre
    document.querySelector(".action-bar .badge").textContent = updated.status;
    document.getElementById("genreView").textContent = updated.genre;

    // Tags — rebuild
    const tagsView = document.getElementById("tagsView");
    tagsView.innerHTML = "";
    updated.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .forEach((tag) => {
        const span = document.createElement("span");
        span.className = "tag";
        span.textContent = tag;
        tagsView.appendChild(span);
      });

    // Synopsis
    document.getElementById("synopsisView").textContent = updated.synopsis;

    // Topbar h1 title
    document.querySelector(".topbar h1").textContent = updated.title;

    // Update the page title
    document.title = `${updated.title} · View Novel`;

    // TODO: send `updated` to backend here (fetch / axios)
    console.log("Saved changes (demo):", updated);

    // Show success feedback
    if (window.Swal) {
      Swal.fire({
        icon: "success",
        title: "Changes saved",
        text: "Your novel has been updated.",
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      alert("Changes saved (demo)");
    }

    exitEditMode();
  });

  /* ============================================
     CHAPTER HELPERS
  ============================================ */
  function getChapterTitle(row) {
    return (
      row.querySelector("td:nth-child(2) strong")?.textContent || "Chapter"
    );
  }

  // Renumber the "#" column after a deletion
  function renumberChapters() {
    const rows = document.querySelectorAll("#chapterTableBody tr");
    rows.forEach((row, i) => {
      row.querySelector("td:first-child").textContent = i + 1;
    });
  }

  // Update the chapter count in the header meta row
  function updateChapterCount() {
    const count = document.querySelectorAll("#chapterTableBody tr").length;
    const chaptersView = document.getElementById("chaptersView");
    if (chaptersView) {
      chaptersView.textContent = `${count} Chapters`;
    }
  }

  /* ============================================
     PREVIEW CHAPTER
  ============================================ */
  document.querySelectorAll(".preview-chapter-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const row = e.target.closest("tr");
      const title = getChapterTitle(row);
      alert(`Preview chapter: "${title}"\n(Opens reader view.)`);
    });
  });

  /* ============================================
     DELETE CHAPTER
  ============================================ */
  document.querySelectorAll(".delete-chapter-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const row = e.target.closest("tr");
      const title = getChapterTitle(row);

      const doDelete = () => {
        row.remove();
        renumberChapters();
        updateChapterCount();

        if (window.Swal) {
          Swal.fire({
            icon: "success",
            title: "Chapter deleted",
            timer: 1200,
            showConfirmButton: false,
          });
        }
      };

      if (window.Swal) {
        Swal.fire({
          icon: "warning",
          title: "Delete chapter?",
          html: `Are you sure you want to delete <strong>${title}</strong>? This cannot be undone.`,
          showCancelButton: true,
          confirmButtonText: "Delete",
          confirmButtonColor: "#dc2626",
          cancelButtonText: "Cancel",
        }).then((result) => {
          if (result.isConfirmed) doDelete();
        });
      } else if (confirm(`Delete "${title}"?`)) {
        doDelete();
      }
    });
  });

  /* ============================================
     ADD CHAPTER
  ============================================ */
  addChapterBtn.addEventListener("click", () => {
    // TODO: hook up to your chapter editor
    alert("Add Chapter\n(Open your chapter editor page.)");
  });
});
