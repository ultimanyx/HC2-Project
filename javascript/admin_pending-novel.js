document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";
  const tableBody = document.getElementById("pendingNovelBody");
  const overlay = document.getElementById("novelModalOverlay");

  // Modal Elements
  const modalTitle = document.getElementById("novelModalTitle");
  const modalSubtitle = document.getElementById("novelModalSubtitle");
  const modalAuthor = document.getElementById("novelModalAuthor");
  const modalDate = document.getElementById("novelModalDate");
  const modalTags = document.getElementById("novelModalTags");
  const modalCover = document.getElementById("novelModalCover");
  const modalStatus = document.getElementById("novelModalStatus");
  const modalSynopsis = document.getElementById("novelModalSynopsis");

  const modalRejectSection = document.getElementById("novelRejectSection");
  const modalRejectReason = document.getElementById("novelModalRejectReason");

  const modalChapterCount = document.getElementById("novelModalChapterCount");
  const modalChapterList = document.getElementById("novelModalChapterList");

  // Buttons
  const modalCloseBtn = document.getElementById("novelModalClose");
  const modalCancelBtn = document.getElementById("novelModalCancel");
  const modalApproveBtn = document.getElementById("novelModalApprove");
  const modalRejectBtn = document.getElementById("novelModalReject");

  let activeNovelId = null;

  // ==========================================
  // HELPERS
  // ==========================================
  const getNovels = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  };

  const saveNovels = (list) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

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

  // ==========================================
  // RENDER TABLE
  // ==========================================
  function renderTable() {
    const allNovels = getNovels();
    const pendingNovels = allNovels.filter((n) => n.status === "pending");

    tableBody.innerHTML = "";

    if (pendingNovels.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:28px;color:var(--muted-foreground);">No pending novels found.</td></tr>`;
      return;
    }

    pendingNovels.forEach((n) => {
      const dateStr = n.createdAt
        ? new Date(n.createdAt).toLocaleDateString()
        : "Recently";

      const tr = document.createElement("tr");
      tr.dataset.novelId = n.id;

      tr.innerHTML = `
        <td class="fw-600">${escapeHtml(n.title)}</td>
        <td>${escapeHtml(n.author || "Unknown")}</td>
        <td>${escapeHtml(n.genre || "—")}</td>
        <td>${dateStr}</td>
        <td><span class="badge paused">Pending</span></td>
        <td>
          <div class="action-group action">
            <button class="btn btn-secondary btn-sm view-btn" type="button">View</button>
            <button class="btn btn-primary btn-sm approve-btn" type="button">Approve</button>
            <button class="btn btn-danger btn-sm reject-btn" type="button">Reject</button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  // ==========================================
  // MODAL - OPEN & POPULATE
  // ==========================================
  function openModal(novelId) {
    const novel = getNovels().find((n) => String(n.id) === String(novelId));
    if (!novel) return;

    activeNovelId = novelId;

    modalTitle.textContent = novel.title || "Untitled";
    modalAuthor.textContent = novel.author || "Unknown";
    modalDate.textContent = novel.createdAt
      ? new Date(novel.createdAt).toLocaleDateString()
      : "Recently";
    modalSynopsis.textContent = novel.synopsis || "No synopsis provided.";
    modalCover.src =
      novel.coverImage || "../image/logo-nobackground-circle.png";
    modalSubtitle.textContent = novel.subtitle || "A New Story";

    // Tags
    modalTags.innerHTML = "";
    if (novel.genre) {
      novel.genre.split(",").forEach((tag) => {
        const span = document.createElement("span");
        span.className = "novel-tag";
        span.textContent = tag.trim();
        modalTags.appendChild(span);
      });
    }

    // Status
    modalStatus.textContent = "Pending";
    modalStatus.className = "badge paused";
    modalRejectSection.style.display = "none";

    // Chapters
    const chapters = novel.chapters || [];
    modalChapterCount.textContent = chapters.length;
    modalChapterList.innerHTML = "";

    if (chapters.length === 0) {
      modalChapterList.innerHTML = `<li style="color:#6b6680;font-style:italic;">No chapters submitted yet.</li>`;
    } else {
      chapters.forEach((ch) => {
        const li = document.createElement("li");
        li.className = "chapter-item";

        const header = document.createElement("div");
        header.className = "chapter-header";

        const left = document.createElement("div");
        left.className = "chapter-header-left";
        left.innerHTML = `<span class="chapter-num">Ch. ${ch.number}</span> <span class="chapter-name">${escapeHtml(ch.title || "Untitled")}</span>`;

        const right = document.createElement("div");
        right.className = "chapter-header-right";

        const status = document.createElement("span");
        status.className = "chapter-status";
        status.textContent = ch.status || "pending";

        const readBtn = document.createElement("button");
        readBtn.className = "btn-read-chapter";
        readBtn.type = "button";
        readBtn.textContent = "Read Chapter";

        const contentDiv = document.createElement("div");
        contentDiv.className = "chapter-content";
        contentDiv.innerHTML =
          ch.body || ch.content || "Content not available.";

        readBtn.addEventListener("click", function (e) {
          e.preventDefault();
          const isOpen = contentDiv.classList.contains("open");
          if (isOpen) {
            contentDiv.classList.remove("open");
            readBtn.textContent = "Read Chapter";
            header.style.borderBottom = "1px solid transparent";
          } else {
            contentDiv.classList.add("open");
            readBtn.textContent = "Hide Chapter";
            header.style.borderBottom = "1px solid var(--border)";
          }
        });

        right.appendChild(status);
        right.appendChild(readBtn);
        header.appendChild(left);
        header.appendChild(right);
        li.appendChild(header);
        li.appendChild(contentDiv);
        modalChapterList.appendChild(li);
      });
    }

    modalApproveBtn.disabled = false;
    modalRejectBtn.disabled = false;

    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    overlay.classList.remove("active");
    document.body.style.overflow = "";
    activeNovelId = null;
  }

  // ==========================================
  // APPROVE & REJECT LOGIC
  // ==========================================
  function approveNovel(id) {
    const list = getNovels();
    const index = list.findIndex((n) => String(n.id) === String(id));
    if (index === -1) return;

    list[index].status = "published";

    // Also publish all its chapters
    if (Array.isArray(list[index].chapters)) {
      list[index].chapters.forEach((ch) => (ch.status = "published"));
    }

    saveNovels(list);
    renderTable();
    closeModal();

    Swal.fire(
      "Approved!",
      "The novel has been published and is now visible to readers.",
      "success",
    );
  }

  function rejectNovel(id) {
    Swal.fire({
      icon: "warning",
      title: "Reject this novel?",
      text: "Please state the reason. This will be sent to the author.",
      input: "textarea",
      inputPlaceholder:
        "e.g. Plagiarism, poor formatting, inappropriate content...",
      inputValidator: (value) =>
        !value || value.trim().length < 5
          ? "Please provide a valid reason."
          : undefined,
      showCancelButton: true,
      confirmButtonText: "Reject",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b6680",
    }).then((result) => {
      if (!result.isConfirmed) return;

      const list = getNovels();
      const index = list.findIndex((n) => String(n.id) === String(id));
      if (index === -1) return;

      list[index].status = "rejected";
      list[index].rejectReason = result.value.trim();

      saveNovels(list);
      renderTable();
      closeModal();

      Swal.fire(
        "Rejected",
        "The novel has been rejected and sent back to the author.",
        "success",
      );
    });
  }

  // ==========================================
  // EVENT LISTENERS
  // ==========================================
  if (tableBody) {
    tableBody.addEventListener("click", function (e) {
      const btn = e.target.closest("button");
      if (!btn) return;
      const row = btn.closest("tr");
      if (!row) return;
      const id = row.dataset.novelId;

      if (btn.classList.contains("view-btn")) {
        openModal(id);
      } else if (btn.classList.contains("approve-btn")) {
        approveNovel(id);
      } else if (btn.classList.contains("reject-btn")) {
        rejectNovel(id);
      }
    });
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);
  if (modalCancelBtn) modalCancelBtn.addEventListener("click", closeModal);

  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay && overlay.classList.contains("active")) {
      closeModal();
    }
  });

  if (modalApproveBtn) {
    modalApproveBtn.addEventListener("click", () => {
      if (activeNovelId) approveNovel(activeNovelId);
    });
  }

  if (modalRejectBtn) {
    modalRejectBtn.addEventListener("click", () => {
      if (activeNovelId) rejectNovel(activeNovelId);
    });
  }

  // Search Filter
  const searchInput = document.getElementById("search");
  if (searchInput && tableBody) {
    searchInput.addEventListener("input", function () {
      const query = this.value.toLowerCase().trim();
      const rows = tableBody.querySelectorAll("tr");
      rows.forEach(function (row) {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(query) ? "" : "none";
      });
    });
  }

  // Initial Load
  renderTable();
});
