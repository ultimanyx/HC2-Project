document.addEventListener("DOMContentLoaded", () => {
  const NOVELS_KEY = "novels";
  const ADS_KEY = "ads";
  const USERS_KEY = "users";

  const tbody = document.getElementById("archiveTableBody");
  if (!tbody) return;

  const $ = (id) => document.getElementById(id);
  const SwalOK = typeof Swal !== "undefined";

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

  const formatDate = (ts) => {
    if (!ts) return "—";
    const d = new Date(ts);
    if (isNaN(d)) return "—";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const readKey = (key) => {
    try {
      const raw = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  };
  const writeKey = (key, list) =>
    localStorage.setItem(key, JSON.stringify(list));

  function readArchive() {
    const novelsRaw = readKey(NOVELS_KEY);

    const novels = novelsRaw
      .filter((n) => n && (n.archived || n.deletedByAuthor))
      .map((n) => ({
        id: n.id,
        type: n.deletedByAuthor ? "DeletedByAuthor" : "Novel",
        title: n.title || "Untitled",
        owner: n.author || n.owner || "—",
        archivedAt: Number(n.archivedAt) || Number(n.deletedAt) || 0,
        storageKey: NOVELS_KEY,
      }));

    const chapters = [];
    novelsRaw.forEach((n) => {
      if (!Array.isArray(n.chapters)) return;
      n.chapters
        .filter((c) => c && c.archived)
        .forEach((c) => {
          chapters.push({
            id: `${n.id}::ch-${c.number}`,
            type: `Chapter ${c.number}`,
            title: c.title || `Chapter ${c.number}`,
            owner: n.title || n.author || "—",
            archivedAt: Number(c.archivedAt) || 0,
            storageKey: NOVELS_KEY,
            parentNovelId: n.id,
            chapterNumber: Number(c.number) || 0,
          });
        });
    });

    const ads = readKey(ADS_KEY)
      .filter((a) => a && a.archived)
      .map((a) => ({
        id: a.id,
        type: "Ad",
        title: a.title || a.name || "Untitled",
        owner: a.advertiser || a.owner || a.brand || "—",
        archivedAt: Number(a.archivedAt) || 0,
        storageKey: ADS_KEY,
      }));

    // Fetch ALL archived users (Readers AND Authors)
    const archivedUsers = readKey(USERS_KEY)
      .filter((u) => u && u.archived)
      .map((u) => ({
        id: u.id,
        type: u.role === "author" ? "Author" : "Reader",
        title: u.username || "Unknown User", // Table displays this
        owner: u.email || "—",
        archivedAt: Number(u.archivedAt) || 0,
        storageKey: USERS_KEY,
      }));

    return [...novels, ...chapters, ...ads, ...archivedUsers].sort(
      (a, b) => b.archivedAt - a.archivedAt,
    );
  }

  function updateStats(items) {
    const total = items.length;
    const novels = items.filter(
      (i) => i.type === "Novel" || i.type === "DeletedByAuthor",
    ).length;
    const ads = items.filter((i) => i.type === "Ad").length;
    const pct = (n) => (total === 0 ? 0 : Math.round((n / total) * 100));

    if ($("stat-total")) $("stat-total").textContent = total;
    if ($("stat-novels")) $("stat-novels").textContent = novels;
    if ($("stat-ads")) $("stat-ads").textContent = ads;
    if ($("stat-novels-pct"))
      $("stat-novels-pct").textContent = `${pct(novels)}% of total`;
    if ($("stat-ads-pct"))
      $("stat-ads-pct").textContent = `${pct(ads)}% of total`;
  }

  const searchEl = $("search-archive");
  const typeEl = $("type-filter");

  function applyFilter(items) {
    const q = (searchEl?.value || "").trim().toLowerCase();
    const type = typeEl?.value || "";

    return items.filter((item) => {
      if (type === "Chapter") {
        if (!item.type.startsWith("Chapter")) return false;
      } else if (type === "DeletedByAuthor") {
        if (item.type !== "DeletedByAuthor") return false;
      } else if (type && item.type !== type) {
        return false;
      }

      if (!q) return true;
      return (
        String(item.title).toLowerCase().includes(q) ||
        String(item.owner).toLowerCase().includes(q)
      );
    });
  }

  function render() {
    const all = readArchive();
    const visible = applyFilter(all);

    tbody.innerHTML = "";

    if (visible.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center;padding:28px;color:var(--muted-foreground);">
            ${all.length === 0 ? "No archived items." : "No items match your filters."}
          </td>
        </tr>`;
      updateStats(all);
      return;
    }

    visible.forEach((item) => {
      const tr = document.createElement("tr");
      tr.dataset.id = String(item.id);
      tr.dataset.type = item.type;
      tr.dataset.key = item.storageKey;
      if (item.parentNovelId != null)
        tr.dataset.parentNovelId = String(item.parentNovelId);
      if (item.chapterNumber != null)
        tr.dataset.chapterNumber = String(item.chapterNumber);

      let displayType = item.type;
      let typeBadge = `<td>${escapeHtml(displayType)}</td>`;

      if (displayType === "DeletedByAuthor") {
        typeBadge = `<td><span class="badge" style="background:#fee2e2; color:#b91c1c;">Deleted by Author</span></td>`;
      } else if (displayType === "Author") {
        typeBadge = `<td><span class="badge" style="background:#e0e7ff; color:#3730a3;">Author</span></td>`;
      } else if (displayType === "Reader") {
        typeBadge = `<td><span class="badge" style="background:#dcfce7; color:#166534;">Reader</span></td>`;
      }

      tr.innerHTML = `
        <td><strong>${escapeHtml(item.title)}</strong></td>
        ${typeBadge}
        <td>${escapeHtml(item.owner)}</td>
        <td>${formatDate(item.archivedAt)}</td>
        <td style="text-align: right">
          <div class="action-group" style="display: flex; gap: 8px; justify-content: flex-end;">
            <button type="button" class="btn btn-success archive-restore-btn">
              <img src="../icons/restore.svg" alt="" class="btn-icon" />
              Restore
            </button>
            <button type="button" class="btn btn-danger archive-delete-btn">
              <img src="../icons/delete.svg" alt="delete" class="btn-icon" />
              Delete
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    updateStats(all);
  }

  searchEl?.addEventListener("input", render);
  typeEl?.addEventListener("change", render);

  tbody.addEventListener("click", (e) => {
    if (!SwalOK) return;

    const restoreBtn = e.target.closest(".archive-restore-btn");
    const deleteBtn = e.target.closest(".archive-delete-btn");
    if (!restoreBtn && !deleteBtn) return;

    const row = (restoreBtn || deleteBtn).closest("tr");
    const id = row?.dataset.id;
    const key = row?.dataset.key;
    const isChapter = row?.dataset.type?.startsWith("Chapter");
    const parentNovelId = row?.dataset.parentNovelId;
    const chapterNumber = Number(row?.dataset.chapterNumber);

    if (!id || !key) return;

    let target = null;
    let targetName = "Item"; //  Store the correct display name here

    if (isChapter) {
      const parent = readKey(key).find(
        (n) => String(n.id) === String(parentNovelId),
      );
      target = parent?.chapters?.find(
        (c) => Number(c.number) === chapterNumber,
      );
      if (target) targetName = target.title || `Chapter ${target.number}`;
    } else {
      target = readKey(key).find((x) => String(x.id) === String(id));
      if (target) {
        //  Users have 'username', novels/ads have 'title'
        if (key === USERS_KEY) {
          targetName = target.username || "Unknown User";
        } else {
          targetName = target.title || target.name || "Untitled";
        }
      }
    }

    if (!target) return;

    /* ---------- RESTORE ---------- */
    if (restoreBtn) {
      Swal.fire({
        title: "Are you sure?",
        text: `"${targetName}" will be restored.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, restore it!",
        confirmButtonColor: "#2f9e44",
        cancelButtonText: "No, cancel!",
        cancelButtonColor: "#6b6680",
        reverseButtons: true,
      }).then((result) => {
        if (!result.isConfirmed) return;

        const list = readKey(key);

        if (isChapter) {
          const parent = list.find(
            (n) => String(n.id) === String(parentNovelId),
          );
          if (!parent || !Array.isArray(parent.chapters)) return;
          const ch = parent.chapters.find(
            (c) => Number(c.number) === chapterNumber,
          );
          if (!ch) return;
          ch.archived = false;
          delete ch.archivedAt;
          ch.restoredAt = Date.now();
          ch.status = ch.previousStatus || "published";
          delete ch.previousStatus;
        } else {
          const t = list.find((x) => String(x.id) === String(id));
          if (!t) return;

          // CLEAR ALL FLAGS
          t.archived = false;
          delete t.archivedAt;
          delete t.deletedByAuthor;
          delete t.deletedAt;

          // Restore status if it's a user
          if (key === USERS_KEY) {
            t.status = "active";
          }

          t.restoredAt = Date.now();
        }

        writeKey(key, list);
        render();
        Swal.fire({
          title: "Restored!",
          text: `"${targetName}" has been restored successfully.`,
          icon: "success",
          confirmButtonColor: "#b8721f",
        });
      });
      return;
    }

    /* ---------- DELETE (permanent) ---------- */
    if (deleteBtn) {
      Swal.fire({
        title: "Are you sure?",
        text: `"${targetName}" will be permanently deleted from the system. You won't be able to revert this!`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it forever!",
        confirmButtonColor: "#d33",
        cancelButtonText: "No, cancel!",
        cancelButtonColor: "#6b6680",
        reverseButtons: true,
      }).then((result) => {
        if (!result.isConfirmed) return;

        const list = readKey(key);

        if (isChapter) {
          const parent = list.find(
            (n) => String(n.id) === String(parentNovelId),
          );
          if (parent && Array.isArray(parent.chapters)) {
            parent.chapters = parent.chapters.filter(
              (c) => Number(c.number) !== chapterNumber,
            );
            parent.chapters.forEach((c, i) => (c.number = i + 1));
          }
        } else {
          const filtered = list.filter((x) => String(x.id) !== String(id));
          writeKey(key, filtered);
          render();
          Swal.fire({
            title: "Deleted!",
            text: `"${targetName}" has been deleted permanently.`,
            icon: "success",
            confirmButtonColor: "#b8721f",
          });
          return;
        }

        writeKey(key, list);
        render();
        Swal.fire({
          title: "Deleted!",
          text: `"${targetName}" has been deleted.`,
          icon: "success",
          confirmButtonColor: "#b8721f",
        });
      });
    }
  });

  render();
});
