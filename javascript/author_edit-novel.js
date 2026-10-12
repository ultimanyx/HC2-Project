document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "novels";
  const id = new URLSearchParams(location.search).get("id");

  // NO id → leave the static demo untouched
  if (!id || id.startsWith("static-")) return;

  const novels = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const novel = novels.find((n) => String(n.id) === String(id));
  if (!novel) return; // keep demo

  // Fill fields
  const set = (elId, val) => {
    const el = document.getElementById(elId);
    if (el) el.value = val ?? "";
  };
  set("title", novel.title);
  set("subtitle", novel.subtitle);
  set("genre", novel.genre);
  set("tags", (novel.tags || []).join(", "));
  set("synopsis", novel.synopsis);
  set("firstChapter", novel.chapters?.[0]?.body || "");

  // Give the "Add Chapter" link the novel id
  const addChapterLinks = document.querySelectorAll('a[href*="addchapter"]');
  addChapterLinks.forEach((a) => {
    const base = a.getAttribute("href").split("?")[0];
    a.href = `${base}?novelId=${id}`;
  });

  // Save changes
  function persist(status) {
    const updated = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]").map(
      (n) => {
        if (String(n.id) !== String(id)) return n;
        return {
          ...n,
          title: document.getElementById("title")?.value.trim() || n.title,
          subtitle: document.getElementById("subtitle")?.value.trim() || "",
          genre: document.getElementById("genre")?.value || n.genre,
          tags: (document.getElementById("tags")?.value || "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          synopsis:
            document.getElementById("synopsis")?.value.trim() || n.synopsis,
          status,
          lastEdited: new Date().toISOString(),
        };
      },
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  document
    .querySelector(".btn:not(.btn-primary)")
    ?.addEventListener("click", () => {
      Swal.fire({
        title: "Save changes?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Save",
        confirmButtonColor: "#b8721f",
      }).then((r) => {
        if (!r.isConfirmed) return;
        persist("draft");
        Swal.fire({
          icon: "success",
          title: "Saved",
          confirmButtonColor: "#b8721f",
        }).then(() => (location.href = "author_draft-novel.html"));
      });
    });

  document.querySelector(".btn-primary")?.addEventListener("click", () => {
    Swal.fire({
      title: "Publish this novel?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Publish",
      confirmButtonColor: "#b8721f",
    }).then((r) => {
      if (!r.isConfirmed) return;
      persist("published");
      Swal.fire({
        icon: "success",
        title: "Published!",
        confirmButtonColor: "#b8721f",
      }).then(() => (location.href = "author_all-novel.html"));
    });
  });
});
