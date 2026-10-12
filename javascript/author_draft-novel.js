document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";
  const tbody = document.querySelector(".table-card tbody");
  if (!tbody) return;

  // ---- Capture static demo rows ----
  const staticRows = Array.from(tbody.querySelectorAll("tr")).map((tr, i) => {
    const tds = tr.querySelectorAll("td");
    return {
      id: `static-${i}`,
      isStatic: true,
      title: tds[0].textContent.trim(),
      status: "draft",
      lastEditedText: tds[2].textContent.trim(),
      chapters: Number(tds[3].textContent) || 0,
    };
  });

  const hiddenIds = new Set();

  function loadSavedDrafts() {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return all
      .filter((n) => n.status === "draft")
      .map((n) => ({
        id: n.id,
        isStatic: false,
        title: n.title,
        status: "draft",
        lastEditedText: new Date(n.lastEdited).toLocaleString(),
        chapters: n.chapters?.length || 0,
      }));
  }

  function render(list) {
    tbody.innerHTML = "";
    const visible = list.filter((n) => !hiddenIds.has(n.id));

    if (!visible.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:28px;">No drafts.</td></tr>`;
      return;
    }

    visible.forEach((n) => {
      const tr = document.createElement("tr");
      tr.dataset.id = n.id;
      tr.dataset.isStatic = n.isStatic ? "true" : "false";
      tr.innerHTML = `
        <td><strong>${n.title}</strong></td>
        <td><span class="badge paused">Draft</span></td>
        <td>${n.lastEditedText}</td>
        <td>${n.chapters}</td>
        <td>
          <a class="btn btn-sm edit-draft-btn" href="author_edit-draft.html?id=${n.id}">Edit</a>
          <button class="btn btn-primary btn-sm publish-draft-btn" data-id="${n.id}">Publish</button>
          <button class="btn btn-sm btn-danger delete-draft-btn" data-id="${n.id}">Delete</button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  function applyFilters() {
    let list = [...staticRows, ...loadSavedDrafts()];
    const q = (document.getElementById("search-draft")?.value || "")
      .trim()
      .toLowerCase();
    if (q) list = list.filter((n) => n.title.toLowerCase().includes(q));
    render(list);
  }

  document
    .getElementById("search-draft")
    ?.addEventListener("input", applyFilters);
  document
    .getElementById("sort-draft")
    ?.addEventListener("change", applyFilters);

  applyFilters();

  // ---- Actions ----
  tbody.addEventListener("click", (e) => {
    const tr = e.target.closest("tr");
    const id = tr?.dataset.id;
    const isStatic = tr?.dataset.isStatic === "true";
    if (!id) return;

    // Publish
    if (e.target.classList.contains("publish-draft-btn")) {
      if (isStatic) {
        Swal.fire({
          icon: "info",
          title: "Demo row",
          text: "Create a real novel first.",
        });
        return;
      }
      Swal.fire({
        title: "Publish this draft?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Publish",
        confirmButtonColor: "#b8721f",
      }).then((res) => {
        if (!res.isConfirmed) return;
        const updated = JSON.parse(
          localStorage.getItem(STORAGE_KEY) || "[]",
        ).map((n) =>
          String(n.id) === String(id)
            ? {
                ...n,
                status: "published",
                lastEdited: new Date().toISOString(),
              }
            : n,
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        applyFilters();
      });
    }

    // Delete
    if (e.target.classList.contains("delete-draft-btn")) {
      if (isStatic) {
        hiddenIds.add(id);
        applyFilters();
        return;
      }
      Swal.fire({
        title: "Delete this draft?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Delete",
        confirmButtonColor: "#dc2626",
      }).then((res) => {
        if (!res.isConfirmed) return;
        const updated = JSON.parse(
          localStorage.getItem(STORAGE_KEY) || "[]",
        ).filter((n) => String(n.id) !== String(id));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        applyFilters();
      });
    }
  });
});
