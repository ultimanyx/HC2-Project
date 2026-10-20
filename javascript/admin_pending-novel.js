/* ============================================================
   Pending Novels – View Modal + Approve/Reject logic
   ============================================================ */

(function () {
  "use strict";

  /* ----------------------------------------------------------
     CHAPTER DATA (Demo - Includes actual paragraphs to read)
     ---------------------------------------------------------- */
  const NOVEL_CHAPTERS = {
    1: [
      {
        number: 1,
        title: "A Tangled Tale",
        status: "pending",
        content:
          '<p>The kingdom of Aethelgard was built on a lie. Or so the old women whispered as they scrubbed laundry by the river. Elara had heard the tales a thousand times: of the fire that consumed the royal family, of the blood that stained the marble floors of the castle.</p><p>But tales were just tales. Until the day the magic woke up inside her.</p><p>She was in the market, stealing a bruised apple from a cart, when the shadows around her suddenly solidified. They wrapped around her wrists like cool silk, hidden from the eyes of the merchants. Elara gasped, dropping the apple. The shadows vanished.</p><p>"You felt that, didn\'t you?" a voice whispered behind her.</p>',
      },
      {
        number: 2,
        title: "The Hidden Heir",
        status: "pending",
        content:
          "<p>Kaelen was a hunter. He didn't believe in magic, mostly because his job was to execute anyone who used it. But tracking the girl with the shadow-touched eyes was proving to be difficult.</p><p>She had left the market in a hurry, leaving behind a trail of disturbed dust and frightened chickens. He followed her to the edge of the Whispering Woods—a place strictly forbidden by the King.</p><p>As he stepped past the first line of ancient oaks, the air grew cold. The magic here was old, older than the kingdom itself. And it was watching him.</p>",
      },
      {
        number: 3,
        title: "Awakening",
        status: "pending",
        content:
          "<p>Elara didn't know why she ran into the woods. It was a death sentence. The King's Guards patrolled the borders, and the beasts inside were worse than any executioner.</p><p>She stopped at a clearing, her chest heaving. The shadows around her were dancing again, eager and restless. She reached out a hand, and for the first time, she didn't push them away.</p><p>The power rushed into her like a tidal wave, burning and freezing all at once. She screamed, but no sound came out. The trees around her groaned, bending away from the force of her awakening.</p><p>When she opened her eyes, the world was different. She could see the threads of magic weaving through the air, ancient and powerful. And at the center of it all, she saw the ghost of the woman who had killed her mother.</p>",
      },
    ],
    2: [
      {
        number: 1,
        title: "The Letter",
        status: "pending",
        content:
          "<p>The letter was heavy in Clara's hands. It had been sitting in her grandmother's attic for ten years, unopened, waiting for the right moment.</p><p>She traced the familiar handwriting on the envelope. Julian. The boy who had promised her the world, and then vanished without a word the night before their high school graduation.</p><p>With a trembling breath, she broke the seal. Inside was a single sheet of paper, faded with age, and a dried daisy.</p><p>\"Clara,\" it began. \"If you're reading this, it means I didn't make it back. I'm sorry. I never meant to leave you...\"</p>",
      },
      {
        number: 2,
        title: "Echoes of the Past",
        status: "pending",
        content:
          "<p>Clara sat on the porch swing, watching the sun dip below the old oak tree at the edge of the property. The letter was clutched in her hand.</p><p>He hadn't abandoned her. He had been drafted. A mix-up with his paperwork, a deployment he couldn't refuse. And then... silence.</p><p>She wiped a tear from her cheek. The anger she had carried for a decade suddenly felt hollow. She had built walls around her heart, married a man she didn't truly love, all because of a misunderstanding.</p><p>She looked at the daisy. It was fragile, yet somehow it had survived. Maybe it was time she did the same.</p>",
      },
    ],
  };

  /* ----------------------------------------------------------
     DOM REFERENCES
     ---------------------------------------------------------- */
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

  /* Currently open row */
  let activeRow = null;

  /* ----------------------------------------------------------
     HELPERS
     ---------------------------------------------------------- */
  function getRowData(row) {
    return {
      id: row.dataset.novelId || "",
      title: row.dataset.title || "Untitled",
      author: row.dataset.author || "Unknown",
      genre: row.dataset.genre || "—",
      date: row.dataset.date || "—",
      synopsis:
        row.dataset.synopsis || "No synopsis provided for this novel yet.",
      cover: row.dataset.cover || "", // Defaults to empty if no cover provided
      rejectReason: row.dataset.rejectReason || "",
    };
  }

  function getChapters(id) {
    return NOVEL_CHAPTERS[id] || [];
  }

  function isRowProcessed(row) {
    return row.classList.contains("row-processed");
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* ----------------------------------------------------------
     SWEETALERTS
     ---------------------------------------------------------- */
  function showApproved(title) {
    if (typeof Swal === "undefined") {
      alert(`"${title}" has been approved.`);
      return;
    }
    Swal.fire({
      icon: "success",
      title: "Approved",
      text: `"${title}" has been approved.`,
      confirmButtonText: "OK",
      confirmButtonColor: "#b8721f",
    });
  }

  function showRejected(title, reason) {
    if (typeof Swal === "undefined") {
      alert(`"${title}" rejected. Reason: ${reason}`);
      return;
    }
    Swal.fire({
      icon: "error",
      title: "Rejected",
      html: `"${title}" has been rejected.<br><br><strong>Reason:</strong><br>
             <div style="text-align:left;background:#f8f6f1;padding:10px;border-radius:8px;font-size:14px;margin-top:8px;">${escapeHtml(reason)}</div>`,
      confirmButtonText: "OK",
      confirmButtonColor: "#b8721f",
    });
  }

  function askRejectReason(title) {
    return new Promise(function (resolve) {
      if (typeof Swal === "undefined") {
        return resolve(prompt(`Why reject "${title}"?`));
      }
      Swal.fire({
        icon: "warning",
        title: "Reject this novel?",
        html: `You are rejecting <strong>"${escapeHtml(title)}"</strong>.<br><span style="font-size:13px;color:#6b6680;">Please state the reason. This will be sent to the author.</span>`,
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
        reverseButtons: true,
      }).then((result) => {
        resolve(result.isConfirmed ? result.value.trim() : null);
      });
    });
  }

  /* ----------------------------------------------------------
     MODAL – OPEN & POPULATE
     ---------------------------------------------------------- */
  function openModal(row) {
    activeRow = row;
    const data = getRowData(row);
    const chapters = getChapters(data.id);
    const processed = isRowProcessed(row);

    /* Header / Cover */
    modalTitle.textContent = data.title;
    modalAuthor.textContent = data.author;
    modalDate.textContent = data.date;
    modalSynopsis.textContent = data.synopsis;
    modalCover.src = data.cover;

    /* Generate a random subtitle based on genre */
    modalSubtitle.textContent = data.genre.includes("Fantasy")
      ? "A Tale of Fire and Blood"
      : "A Story of Love and Loss";

    /* Tags (split genres) */
    modalTags.innerHTML = "";
    data.genre.split(",").forEach((tag) => {
      const span = document.createElement("span");
      span.className = "novel-tag";
      span.textContent = tag.trim();
      modalTags.appendChild(span);
    });

    /* Status Badge */
    if (processed) {
      const badge = row.querySelector(".badge");
      const statusText = badge ? badge.textContent.trim() : "Processed";
      modalStatus.textContent = statusText;
      modalStatus.className = "badge";

      if (statusText.toLowerCase().includes("approve")) {
        modalStatus.classList.add("active");
      } else if (statusText.toLowerCase().includes("reject")) {
        modalStatus.classList.add("rejected");
      } else {
        modalStatus.classList.add("paused");
      }
    } else {
      modalStatus.textContent = "Pending";
      modalStatus.className = "badge paused";
    }

    /* Rejection Reason Block */
    if (
      processed &&
      data.rejectReason &&
      row.querySelector(".badge.rejected")
    ) {
      modalRejectSection.style.display = "block";
      modalRejectReason.textContent = data.rejectReason;
    } else {
      modalRejectSection.style.display = "none";
    }

    /* Chapters */
    modalChapterCount.textContent = chapters.length;
    modalChapterList.innerHTML = "";

    if (chapters.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No chapters submitted yet.";
      li.style.color = "#6b6680";
      li.style.fontStyle = "italic";
      modalChapterList.appendChild(li);
    } else {
      chapters.forEach(function (ch) {
        const li = document.createElement("li");
        li.className = "chapter-item";

        const header = document.createElement("div");
        header.className = "chapter-header";

        // Left side (Chapter Number & Title)
        const left = document.createElement("div");
        left.className = "chapter-header-left";
        left.innerHTML = `<span class="chapter-num">Ch. ${ch.number}</span> <span class="chapter-name">${escapeHtml(ch.title)}</span>`;

        // Right side (Status & Read Button)
        const right = document.createElement("div");
        right.className = "chapter-header-right";

        const status = document.createElement("span");
        status.className = "chapter-status";
        status.textContent = processed ? "reviewed" : ch.status || "pending";

        const readBtn = document.createElement("button");
        readBtn.className = "btn-read-chapter";
        readBtn.type = "button";
        readBtn.textContent = "Read Chapter";

        // Content Container (Hidden by default)
        const contentDiv = document.createElement("div");
        contentDiv.className = "chapter-content";
        contentDiv.innerHTML = ch.content;

        // Toggle Read Chapter
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

    /* Disable action buttons if processed */
    modalApproveBtn.disabled = processed;
    modalRejectBtn.disabled = processed;

    /* Show Modal */
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  /* ----------------------------------------------------------
     MODAL – CLOSE
     ---------------------------------------------------------- */
  function closeModal() {
    overlay.classList.remove("active");
    document.body.style.overflow = "";
    activeRow = null;
  }

  /* ----------------------------------------------------------
     ROW ACTIONS (Approve / Reject)
     ---------------------------------------------------------- */
  function approveRow(row) {
    if (!row || isRowProcessed(row)) return;
    const data = getRowData(row);
    const badge = row.querySelector(".badge");

    if (badge) {
      badge.className = "badge active";
      badge.textContent = "Approved";
    }

    row.querySelectorAll(".action-group button").forEach(function (btn) {
      btn.disabled = true;
      btn.style.pointerEvents = "none";
      btn.style.opacity = "0.45";
    });

    row.classList.add("row-processed");
    showApproved(data.title);
  }

  function rejectRow(row) {
    if (!row || isRowProcessed(row)) return;
    const data = getRowData(row);

    askRejectReason(data.title).then(function (reason) {
      if (!reason) return;

      row.dataset.rejectReason = reason;
      const badge = row.querySelector(".badge");

      if (badge) {
        badge.className = "badge rejected";
        badge.textContent = "Rejected";
      }

      row.querySelectorAll(".action-group button").forEach(function (btn) {
        btn.disabled = true;
        btn.style.pointerEvents = "none";
        btn.style.opacity = "0.45";
      });

      row.classList.add("row-processed");
      showRejected(data.title, reason);
    });
  }

  /* ----------------------------------------------------------
     EVENT LISTENERS
     ---------------------------------------------------------- */

  // Table Delegation
  if (tableBody) {
    tableBody.addEventListener("click", function (e) {
      const btn = e.target.closest("button");
      if (!btn) return;
      const row = btn.closest("tr");
      if (!row) return;

      if (btn.classList.contains("view-btn")) {
        e.preventDefault();
        openModal(row);
      } else if (btn.classList.contains("approve-btn")) {
        e.preventDefault();
        approveRow(row);
      } else if (btn.classList.contains("reject-btn")) {
        e.preventDefault();
        rejectRow(row);
      }
    });
  }

  // Modal Controls
  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);
  if (modalCancelBtn) modalCancelBtn.addEventListener("click", closeModal);

  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlay && overlay.classList.contains("active")) {
      closeModal();
    }
  });

  // Modal Actions
  if (modalApproveBtn) {
    modalApproveBtn.addEventListener("click", function () {
      if (!activeRow) return;
      approveRow(activeRow);
      closeModal();
    });
  }

  if (modalRejectBtn) {
    modalRejectBtn.addEventListener("click", function () {
      if (!activeRow) return;
      const row = activeRow;
      closeModal();
      rejectRow(row);
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
})();
