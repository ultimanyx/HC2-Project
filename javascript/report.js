const REPORT_KEY = "chapterReports";

const reportButton = document.getElementById("reportBtn");
const modalOverlay = document.getElementById("reportModalOverlay");
const modalClose = document.getElementById("reportModalClose");
const modalCancel = document.getElementById("reportModalCancel");
const modalSubmit = document.getElementById("reportModalSubmit");
const reasonSelect = document.getElementById("reportReason");
const detailsInput = document.getElementById("reportDetails");
const reasonError = document.getElementById("reportReasonError");

/* ---------------------------------------------------------------
   Helpers — pull the logged-in reader's name from storage / DOM
   --------------------------------------------------------------- */
function readStoredName(key) {
  for (const store of [sessionStorage, localStorage]) {
    const raw = store.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const n =
          parsed.username ||
          parsed.name ||
          parsed.fullName ||
          parsed.displayName ||
          parsed.readerName;
        if (n) return n;
      } else if (typeof parsed === "string" && parsed.trim()) {
        return parsed.trim();
      }
    } catch {
      // Not JSON → treat as a raw string
      return raw.trim();
    }
  }
  return null;
}

function getReaderName() {
  // Try the common keys used by login / name-change scripts
  const keys = [
    "currentUser",
    "currentReader",
    "loggedInUser",
    "loggedInReader",
    "user",
    "reader",
    "readerName",
  ];

  for (const k of keys) {
    const name = readStoredName(k);
    if (name) return name;
  }

  // Fallback: whatever the navbar is showing
  const el = document.getElementById("readerName");
  const domName = el ? el.textContent.trim() : "";
  if (domName && domName !== "Welcome User") return domName;

  return "Anonymous Reader";
}

/* ---------------------------------------------------------------
   Open / close modal
   --------------------------------------------------------------- */
if (reportButton) {
  reportButton.addEventListener("click", function () {
    modalOverlay.classList.add("active");
    reasonSelect.value = "";
    detailsInput.value = "";
    reasonError.classList.remove("show");
    reasonSelect.classList.remove("invalid");
  });
}

function closeModal() {
  modalOverlay.classList.remove("active");
}

if (modalClose) modalClose.addEventListener("click", closeModal);
if (modalCancel) modalCancel.addEventListener("click", closeModal);

/* ---------------------------------------------------------------
   Submit report
   --------------------------------------------------------------- */
if (modalSubmit) {
  modalSubmit.addEventListener("click", function () {
    const reason = reasonSelect.value;
    const details = detailsInput.value.trim();

    if (!reason) {
      reasonSelect.classList.add("invalid");
      reasonError.classList.add("show");
      return;
    }

    // 🚨 Reader name (from login/name-change storage or navbar)
    const readerName = getReaderName();

    // 🚨 Book + author from <body data-*>
    const bookId = document.body.dataset.bookId || "Unknown";
    const bookTitle = document.body.dataset.bookTitle || "Unknown Book";
    const bookAuthor = document.body.dataset.bookAuthor || "Unknown Author";

    const reports = JSON.parse(localStorage.getItem(REPORT_KEY)) || [];

    reports.push({
      id: Date.now(),
      bookId: bookId,
      bookTitle: bookTitle,
      author: bookAuthor, // ✅ author copied from the chapter page
      reportedBy: readerName, // ✅ reader username copied from login
      chapter: document.getElementById("chapter-number").textContent.trim(),
      chapterTitle: document.getElementById("chapter-title").textContent.trim(),
      reason: reason,
      details: details,
      date: new Date().toISOString(),
      status: "Pending",
    });

    localStorage.setItem(REPORT_KEY, JSON.stringify(reports));

    closeModal();

    Swal.fire({
      title: "Report Submitted",
      text: "Thank you. Your report has been submitted.",
      icon: "success",
      confirmButtonText: "OK",
    });
  });
}
