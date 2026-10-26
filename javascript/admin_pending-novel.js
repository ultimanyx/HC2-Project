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

    const pendingNovels = allNovels.filter((n) => {
      if (n.status === "pending") return true;
      if (
        Array.isArray(n.chapters) &&
        n.chapters.some((c) => c.status === "pending")
      )
        return true;
      return false;
    });

    tableBody.innerHTML = "";

    if (pendingNovels.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:28px;color:var(--muted-foreground);">No pending novels or chapters found.</td></tr>`;
      return;
    }

    pendingNovels.forEach((n) => {
      const dateStr = n.updatedAt
        ? new Date(n.updatedAt).toLocaleDateString()
        : "Recently";
      const tr = document.createElement("tr");
      tr.dataset.novelId = n.id;

      const isBookPending = n.status === "pending";
      const typeLabel = isBookPending ? "Novel" : "Chapter Update";

      tr.innerHTML = `
        <td class="fw-600">${escapeHtml(n.title)}</td>
        <td>${escapeHtml(n.author || "Unknown")}</td>
        <td>${escapeHtml(n.genre || "—")}</td>
        <td>${dateStr}</td>
        <td><span class="badge paused">${typeLabel}</span></td>
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
    modalDate.textContent = novel.updatedAt
      ? new Date(novel.updatedAt).toLocaleDateString()
      : "Recently";

    // JS STYLING FIX: Format synopsis into readable paragraphs
    const rawSynopsis = novel.synopsis || "No synopsis provided.";
    const paragraphs = rawSynopsis
      .split(/\n\s*\n/)
      .filter((p) => p.trim() !== "");

    if (paragraphs.length > 1) {
      modalSynopsis.innerHTML = paragraphs
        .map(
          (p) => `<p style="margin-bottom: 12px;">${escapeHtml(p.trim())}</p>`,
        )
        .join("");
    } else {
      modalSynopsis.innerHTML = `<p style="margin-bottom: 12px; line-height: 1.8; letter-spacing: 0.3px;">${escapeHtml(rawSynopsis.trim())}</p>`;
    }

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
    const isBookPending = novel.status === "pending";
    modalStatus.textContent = isBookPending ? "Pending Book" : "Pending Update";
    modalStatus.className = "badge paused";
    modalRejectSection.style.display = "none";

    // Chapters
    const chapters = novel.chapters || [];
    modalChapterCount.textContent = chapters.length;
    modalChapterList.innerHTML = "";

    if (chapters.length === 0) {
      modalChapterList.innerHTML = `<li style="color:#6b6680;font-style:italic;">No chapters submitted yet.</li>`;
    } else {
      const sortedChapters = [...chapters].sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (b.status === "pending" && a.status !== "pending") return 1;
        return a.number - b.number;
      });

      sortedChapters.forEach((ch) => {
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
        if (ch.status === "pending") {
          status.style.color = "#e8963a";
          status.style.fontWeight = "bold";
        }
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
  // APPROVE LOGIC
  // ==========================================
  function approveNovel(id) {
    const list = getNovels();
    const index = list.findIndex((n) => String(n.id) === String(id));
    if (index === -1) return;

    if (list[index].status === "pending") {
      list[index].status = "published";
    }

    if (Array.isArray(list[index].chapters)) {
      list[index].chapters.forEach((ch) => {
        if (ch.status === "pending") {
          ch.status = "published";
        }
      });
    }

    saveNovels(list);
    renderTable();
    closeModal();

    Swal.fire({
      title: "Approved!",
      text: "The content has been published and is now visible to readers.",
      icon: "success",
      confirmButtonColor: "#b8721f",
    });
  }

  // ==========================================
  // REJECT LOGIC
  // ==========================================
  function rejectNovel(id) {
    Swal.fire({
      icon: "warning",
      title: "Reject this content?",
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

      const novel = list[index];
      const reason = result.value.trim();

      if (novel.status === "pending") {
        novel.status = "rejected";
        novel.rejectReason = reason;
      }

      if (Array.isArray(novel.chapters)) {
        novel.chapters.forEach((ch) => {
          if (ch.status === "pending") {
            ch.status = "draft"; // Send back to draft
            ch.rejectReason = reason;
          }
        });
      }

      saveNovels(list);

      // 🚨 FIX: Trigger the warning alert for the Author Dashboard
      const alertData = {
        status: "warn",
        novelTitle: novel.title,
        reportReason: reason,
        notified: "", // Force it to show up
      };
      localStorage.setItem("author_alert_status", JSON.stringify(alertData));

      renderTable();
      closeModal();

      Swal.fire({
        title: "Rejected",
        text: "The content has been rejected and sent back to the author.",
        icon: "success",
        confirmButtonColor: "#b8721f",
      });
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
