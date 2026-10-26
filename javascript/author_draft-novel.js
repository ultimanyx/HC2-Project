document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";
  const tbody = document.querySelector(".table-card tbody");
  if (!tbody) return;

  // 🚨 GET CURRENT AUTHOR NAME FROM SESSION
  const currentUser = JSON.parse(
    sessionStorage.getItem("currentUser") ||
      sessionStorage.getItem("currentAuthor") ||
      "{}",
  );
  const authorName = currentUser.username || currentUser.penName || "Author";

  // ==========================================
  // HELPERS
  // ==========================================
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

  function loadNovels() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  function saveNovels(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  // ==========================================
  // SEED HARDCODED DRAFT & CLEANUP
  // ==========================================
  function seedHardcodedDraft() {
    let novels = loadNovels();
    let changed = false;

    // Filter out duplicates
    const filteredNovels = novels.filter((n) => {
      const isDuplicate =
        n.title.toLowerCase() === "the lost kingdom" &&
        String(n.id) !== "draft-seed-0";

      if (isDuplicate) {
        changed = true;
        return false;
      }
      return true;
    });

    // The chapter data with actual content
    const draftChapters = [
      {
        number: 1,
        title: "Prologue: The Empty Throne",
        status: "draft",
        words: 1120,
        lastUpdated: Date.now() - 86400000,
        content:
          "<p>The night the kingdom fell, the sky was bleeding. A crimson moon hung over the ruins of House Veyra, casting long, twisted shadows across the shattered cobblestones. Elara stood at the edge of the courtyard, her breath caught in her throat. The banners that had flown proudly for a thousand years were now nothing but ash, drifting like dark snow onto the corpses of her kin. She was the last. The only surviving heir to a throne that no longer existed.</p><p>She clutched the hilt of her father's broken sword, the cold metal biting into her palm. The usurper's soldiers were still searching the castle. She had minutes, perhaps seconds, before they found her hiding place behind the shattered fountain.</p><p>Taking a deep breath, she reached for the shadows. They had always whispered to her, but she had never dared to answer. Now, she had no choice. The darkness wrapped around her like a cloak, and she vanished into the night.</p>",
      },
      {
        number: 2,
        title: "A Kingdom Without a King",
        status: "draft",
        words: 1890,
        lastUpdated: Date.now() - 172800000,
        content:
          "<p>Three days had passed since the coup. The usurper sat on the Obsidian Throne, his dark magic suffocating the land. In the quiet villages, the people whispered of the old kings and queens, their voices laced with fear. But in the shadows of the Whispering Woods, a spark of rebellion was kindling.</p><p>Kaelen, the disgraced knight, sharpened his blade by the fire, his eyes fixed on the distant towers of the capital. He had served the Veyra family for twenty years. He had failed them when it mattered most. He would not fail the girl.</p><p>'The heir lives,' a hooded figure said, stepping into the flickering light of the campfire. 'But she is hunted. We must reach her before the King's Guard does.'</p><p>Kaelen sheathed his sword. 'Then we ride at dawn.'</p>",
      },
      {
        number: 3,
        title: "The Broken Oath",
        status: "draft",
        words: 2340,
        lastUpdated: Date.now() - 259200000,
        content:
          "<p>The oath was broken. Blood spilled on the altar of the Sun God, and the ancient magic that bound the realm began to unravel. Elara felt it—a cold, creeping dread that seeped into her bones. She knew what had to be done. The prophecy was clear: only a Veyra could reclaim the throne, but doing so would require a sacrifice she wasn't sure she was willing to make.</p><p>She stood before the ancient shrine, the stone carving of the First King staring down at her with hollow eyes. 'I am not a hero,' she whispered to the silence. 'I am just a girl who wants to go home.'</p><p>But the magic didn't care about her feelings. It surged forward, demanding a price. She felt the darkness tearing at her soul, reshaping her. When she opened her eyes, her irises were no longer brown. They were pools of liquid gold, burning with the fire of the ancients.</p>",
      },
      {
        number: 4,
        title: "Whispers in the Dark",
        status: "draft",
        words: 0,
        lastUpdated: Date.now(),
        content:
          "<p>The golden fire in Elara's eyes receded, leaving behind a cold, unnerving clarity. The forest around the shrine was unnaturally still, as if the wild creatures themselves feared the ancient magic that had just reawoken within her. She flexed her fingers, watching faint wisps of golden light weave through her fingertips before dissipating into shadow.</p><p>A twig snapped in the thicket. Elara spun around, her shadow lengthening and rising like a defensive wall of obsidian spikes. Out from the gloom stepped a solitary figure clad in battered armor—a faded crest of House Veyra barely visible across his breastplate.</p><p>'Lady Elara?' Kaelen's voice cracked with disbelief as he dropped to one knee, bowing his head. 'By the First King... I thought I was too late.'</p><p>Elara looked down at the disgraced knight, her pulse hammering against her ribs. 'Rise, Kaelen,' she said, her voice carrying a resonance that was no longer entirely her own. 'House Veyra has not fallen yet. But we have a long way to go before dawn.'</p>",
      },
    ];

    const existingIndex = filteredNovels.findIndex(
      (n) => String(n.id) === "draft-seed-0",
    );

    if (existingIndex === -1) {
      // Create it fresh
      filteredNovels.push({
        id: "draft-seed-0",
        title: "The Lost Kingdom",
        subtitle: "A throne unclaimed",
        genre: "Fantasy",
        synopsis:
          "An heir believed dead. A throne left empty. A kingdom on the brink of war. The Lost Kingdom is the first book in an epic fantasy saga.",
        coverImage: "../image/lostcrown.jpeg",
        status: "draft",
        author: authorName,
        chapters: draftChapters,
        reads: 0,
        rating: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastEdited: Date.now(),
      });
      changed = true;
    } else {
      // Check if it's missing content
      const existingChapters = filteredNovels[existingIndex].chapters || [];
      if (existingChapters.length > 0 && !existingChapters[0].content) {
        // Force update the chapters array
        filteredNovels[existingIndex].chapters = draftChapters;
        changed = true;
      }
    }

    if (changed) saveNovels(filteredNovels);
  }

  seedHardcodedDraft();

  // ==========================================
  // FILTERS + RENDER
  // ==========================================
  const searchInput = document.getElementById("search-draft");
  const sortSelect = document.getElementById("sort-draft");

  function applyFilters() {
    let list = loadNovels().filter((n) => n.status === "draft" && !n.archived);

    const q = (searchInput?.value || "").trim().toLowerCase();
    if (q) list = list.filter((n) => (n.title || "").toLowerCase().includes(q));

    const sort = sortSelect?.value || "Last Edited";
    if (sort === "Title")
      list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    else if (sort === "Date Created")
      list.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    else list.sort((a, b) => (b.lastEdited || 0) - (a.lastEdited || 0));

    render(list);
  }

  function render(list) {
    const hardcodedRow = tbody.querySelector('tr[data-id="draft-seed-0"]');
    tbody.innerHTML = "";

    const seedIsActive = list.some((n) => String(n.id) === "draft-seed-0");

    if (seedIsActive && hardcodedRow) {
      tbody.appendChild(hardcodedRow);
    }

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="display: table-cell; text-align:center; padding: 48px; color:var(--muted-foreground); width: 100%;">
            No drafts found.
          </td>
        </tr>`;
      return;
    }

    list.forEach((n) => {
      if (String(n.id) === "draft-seed-0") return;

      const chapterCount = Array.isArray(n.chapters)
        ? n.chapters.filter((c) => !c.archived).length
        : 0;

      const tr = document.createElement("tr");
      tr.dataset.id = n.id;

      tr.innerHTML = `
        <td><strong>${escapeHtml(n.title)}</strong></td>
        <td><span class="badge draft">Draft</span></td>
        <td>${n.lastEdited ? formatDate(n.lastEdited) : "Today"}</td>
        <td>${chapterCount}</td>
        <td>
          <a class="btn btn-sm edit-draft-btn" href="author_edit-draft.html?id=${n.id}">Edit</a>
          <button class="btn btn-primary btn-sm publish-draft-btn" data-id="${n.id}">Publish</button>
          <button class="btn btn-sm btn-danger archive-draft-btn" data-id="${n.id}">Archive</button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  searchInput?.addEventListener("input", applyFilters);
  sortSelect?.addEventListener("change", applyFilters);

  applyFilters();

  // ==========================================
  // ACTIONS
  // ==========================================
  tbody.addEventListener("click", (e) => {
    const tr = e.target.closest("tr");
    const id = tr?.dataset.id;
    if (!id) return;

    // ---------- PUBLISH BOOK (Submit for Review) ----------
    if (e.target.classList.contains("publish-draft-btn")) {
      Swal.fire({
        title: "Submit for Review?",
        text: "Your novel and all its chapters will be sent to the admin for approval.",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Submit",
        confirmButtonColor: "#b8721f",
      }).then((res) => {
        if (!res.isConfirmed) return;

        const updated = loadNovels().map((n) => {
          if (String(n.id) === String(id)) {
            const updatedChapters = (n.chapters || []).map((ch) => ({
              ...ch,
              status: "pending",
            }));

            return {
              ...n,
              status: "pending",
              chapters: updatedChapters,
              lastEdited: Date.now(),
            };
          }
          return n;
        });

        saveNovels(updated);
        applyFilters();

        Swal.fire(
          "Submitted!",
          "Your novel is now pending admin approval.",
          "success",
        );
      });
      return;
    }

    // ---------- ARCHIVE BOOK ----------
    if (e.target.classList.contains("archive-draft-btn")) {
      Swal.fire({
        title: "Archive this draft?",
        text: "You can restore it later from the Archive page.",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Archive",
        confirmButtonColor: "#dc2626",
        cancelButtonText: "Cancel",
      }).then((res) => {
        if (!res.isConfirmed) return;

        const updated = loadNovels().map((n) => {
          if (String(n.id) === String(id)) {
            return { ...n, archived: true, archivedAt: Date.now() };
          }
          return n;
        });

        saveNovels(updated);
        applyFilters();

        Swal.fire({
          title: "Archived!",
          text: "Draft moved to Archive.",
          icon: "success",
          confirmButtonColor: "#b8721f",
        });
      });
    }
  });
});
