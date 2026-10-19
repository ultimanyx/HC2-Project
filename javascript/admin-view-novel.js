document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";
  const params = new URLSearchParams(location.search);
  const novelId = params.get("novelId") || "demo-novel";

  const $ = (id) => document.getElementById(id);
  const SwalOK = typeof Swal !== "undefined";

  const CHAPTER_VIEW_URL = "admin_view-chapter.html";

  const getNovels = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  };
  const saveNovels = (list) =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

  const escapeHtml = (s) =>
    String(s ?? "").replace(
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

  const relativeTime = (ts) => {
    if (!ts) return "—";
    const days = Math.floor((Date.now() - ts) / 86400000);
    if (days <= 0) return "Just now";
    if (days === 1) return "1 day ago";
    if (days < 7) return `${days} days ago`;
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  };

  const chapterStatusMeta = (s) => {
    const k = String(s || "").toLowerCase();
    if (k === "draft") return { label: "Draft", cls: "draft" };
    if (k === "pending") return { label: "Pending Review", cls: "pending" };
    if (k === "broken") return { label: "Broken Content", cls: "paused" };
    if (k === "archived") return { label: "Archived", cls: "completed" };
    return { label: "Published", cls: "active" };
  };

  const tbody = $("chapterTableBody");

  /* =============================================================
     AUTO-INITIALIZE DEMO DATA ON LOAD
     ============================================================= */
  let list = getNovels();
  let novel = list.find((n) => String(n.id) === String(novelId));

  // We check if the chapters have bodies. If they don't, we force-update the storage.
  const isMissingBody =
    novel &&
    novel.chapters &&
    novel.chapters.some((c) => !c.body && c.number !== 5);
  const isOldStructure = novel && !novel.chapters;

  if (
    novelId === "demo-novel" &&
    (!novel || novel.chapters.length < 6 || isMissingBody || isOldStructure)
  ) {
    const tagsHtml = document.querySelectorAll("#tagsView .tag");
    const tags = Array.from(tagsHtml).map((t) => t.textContent.trim());

    // Preserve the archived state if it exists
    const existingCh1 = novel?.chapters?.find((c) => c.number === 1);
    const existingCh2 = novel?.chapters?.find((c) => c.number === 2);
    // ... you can add more if needed

    const freshDemo = {
      id: novelId,
      title: "Shadows of the Crown",
      subtitle: "A Tale of Fire and Blood",
      synopsis:
        "In a kingdom where magic is forbidden and crowns are won by blood, a young outcast discovers she is the last heir to a forgotten throne. Hunted by the very people who murdered her family, she must decide whether to flee or fight — and in doing so, awaken a power that could burn the world to ash.",
      tags: tags.length ? tags : ["enemies to lovers", "magic", "adventure"],
      author: "Sarah J.",
      status: "Ongoing",
      updatedAt: Date.now(),
      chapters: [
        {
          number: 1,
          title: "The Fall of House Veyra",
          words: 3412,
          status: existingCh1?.status || "published",
          archived: existingCh1?.archived || false,
          archivedAt: existingCh1?.archivedAt,
          previousStatus: existingCh1?.previousStatus,
          lastUpdated: Date.now(),
          body: "The night House Veyra fell, the sky above Kaldros turned the colour of old blood. Mara had been asleep when the horns first sounded — long, low, and wrong. She would remember that sound for the rest of her life.\n\nBy the time she reached the courtyard, the great iron doors had already been breached. Torchlight danced across the faces of men she had known since childhood, men who now wore the crimson sash of the usurper. None of them met her eyes.\n\nShe ran. Through corridors she had memorised as a girl, past portraits of ancestors whose names she would one day carry, past the library where her mother had taught her to read. She ran until the screams behind her faded into silence.",
        },
        {
          number: 2,
          title: "A Crown of Ash",
          words: 2980,
          status: existingCh2?.status || "published",
          archived: existingCh2?.archived || false,
          archivedAt: existingCh2?.archivedAt,
          previousStatus: existingCh2?.previousStatus,
          lastUpdated: Date.now() - 500000,
          body: "The embers of House Veyra had barely cooled when the usurper's banner was raised over the keep. Mara watched from the treeline, her breath catching in the cold morning air.\n\nShe had nothing left. No family, no home, no name that anyone would dare speak aloud. But as the sun broke over the ruined towers, she felt something stir in her chest—a heat that had nothing to do with the fire that had consumed her past.\n\n'You are the last,' her mother had whispered before the end. 'Do not let the flame die.'",
        },
        {
          number: 3,
          title: "The Wolf at the Door",
          words: 3105,
          status: "published",
          lastUpdated: Date.now() - 800000,
          body: "The Wolf of the North did not knock. He simply appeared in the doorway of the abandoned chapel, snow dusting his dark cloak, his eyes gleaming like chips of ice in the dim light.\n\n'You're hard to track down, little heir,' he said, his voice a low rumble that seemed to shake the very stones of the floor. 'The bounty on your head is enough to buy a small kingdom.'\n\nMara tightened her grip on the dagger hidden beneath her sleeve. 'Then why haven't you claimed it?'",
        },
        {
          number: 4,
          title: "Shadows in the Keep",
          words: 1224,
          status: "broken",
          lastUpdated: Date.now() - 1200000,
          body: "[Content corrupted or missing. Please contact the author to restore this chapter.]",
        },
        {
          number: 5,
          title: "The Ember Crown",
          words: 0,
          status: "draft",
          lastUpdated: Date.now(),
          body: "",
        },
        {
          number: 6,
          title: "Where the River Ends",
          words: 2750,
          status: "pending",
          lastUpdated: Date.now() - 300000,
          body: "The river was said to carry the souls of the fallen to the halls of the ancestors. Mara stood on the muddy bank, the water rushing past her boots, cold and relentless.\n\nShe held the broken hilt of her father's sword, the only thing she had managed to salvage from the wreckage. It was useless as a weapon now, but it was still a symbol of everything she had lost.\n\nAnd everything she intended to reclaim.",
        },
      ],
    };

    list = list.filter((n) => String(n.id) !== String(novelId));
    list.push(freshDemo);
    saveNovels(list);
    novel = freshDemo;
  }

  /* =============================================================
     CHAPTER-LEVEL: Archive action
     ============================================================= */
  tbody?.addEventListener("click", async (e) => {
    const archiveBtn = e.target.closest(".archive-chapter-btn");
    if (!archiveBtn) return;

    const row = archiveBtn.closest("tr");
    const number = Number(row?.dataset.chapter);
    if (!number) return;

    const title = row.querySelector("td:nth-child(2)").textContent.trim();

    const confirmed = SwalOK
      ? (
          await Swal.fire({
            icon: "warning",
            title: "Archive this chapter?",
            text: `"${title}" will be removed from here and moved to the Archive page.`,
            showCancelButton: true,
            confirmButtonText: "Archive",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#b8721f",
            cancelButtonColor: "#6b6680",
          })
        ).isConfirmed
      : confirm(`Archive "${title}"?`);
    if (!confirmed) return;

    let fresh = getNovels();
    let freshNovel = fresh.find((n) => String(n.id) === String(novelId));

    if (!freshNovel) return;

    const idx = freshNovel.chapters.findIndex(
      (ch) => Number(ch.number) === number,
    );
    if (idx === -1) return;

    const target = freshNovel.chapters[idx];
    target.previousStatus = target.status || "published";
    target.archived = true;
    target.archivedAt = Date.now();
    target.status = "archived";
    freshNovel.updatedAt = Date.now();

    saveNovels(fresh);
    render(freshNovel);

    if (SwalOK) {
      Swal.fire({
        icon: "success",
        title: "Archived!",
        text: `"${title}" has been moved to the Archive.`,
        confirmButtonColor: "#b8721f",
      });
    }
  });

  /* =============================================================
     RENDER FUNCTION
     ============================================================= */
  function render(novelData) {
    if (!tbody) return;

    const chapters = Array.isArray(novelData?.chapters)
      ? [...novelData.chapters]
          .filter((ch) => !ch.archived)
          .sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0))
      : [];

    if (!chapters.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#888;">No chapters yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = chapters
      .map((ch) => {
        const meta = chapterStatusMeta(ch.status);
        const n = Number(ch.number) || 0;
        const viewHref = `${CHAPTER_VIEW_URL}?novelId=${encodeURIComponent(novelId)}&chapter=${n}`;

        let actions = `
          <a href="${viewHref}"><button class="btn btn-sm btn-primary">View</button></a>
          <button class="btn btn-sm btn-danger archive-chapter-btn" data-number="${n}">Archive</button>
        `;

        const wordsDisplay = ch.words ? Number(ch.words).toLocaleString() : "—";

        return `
          <tr data-chapter="${n}">
            <td>${n}</td>
            <td><strong>${escapeHtml(ch.title || "Untitled")}</strong></td>
            <td><span class="badge ${meta.cls}">${meta.label}</span></td>
            <td>${wordsDisplay}</td>
            <td>${relativeTime(ch.lastUpdated)}</td>
            <td>${actions}</td>
          </tr>
        `;
      })
      .join("");
  }

  /* =============================================================
     INITIAL LOAD
     ============================================================= */
  if (novel) {
    if ($("titleView")) $("titleView").textContent = novel.title || "Untitled";
    if ($("subtitleView")) $("subtitleView").textContent = novel.subtitle || "";
    if ($("synopsisView"))
      $("synopsisView").textContent = novel.synopsis || novel.description || "";

    const coverImg = document.querySelector(".novel-cover img");
    if (coverImg && novel.cover) coverImg.src = novel.cover;

    if ($("novelStatusBadge")) {
      $("novelStatusBadge").textContent = novel.archived
        ? "Archived"
        : novel.status || "Ongoing";
      $("novelStatusBadge").className =
        `badge ${novel.archived ? "completed" : "active"}`;
    }

    if (novel.tags && Array.isArray(novel.tags) && $("tagsView")) {
      $("tagsView").innerHTML = novel.tags
        .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
        .join("");
    }

    render(novel);
  }
});
