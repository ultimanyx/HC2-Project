const REPORT_KEY = "chapterReports";

const reportButton = document.getElementById("reportBtn");
const modalOverlay = document.getElementById("reportModalOverlay");
const modalClose = document.getElementById("reportModalClose");
const modalCancel = document.getElementById("reportModalCancel");
const modalSubmit = document.getElementById("reportModalSubmit");
const reasonSelect = document.getElementById("reportReason");
const detailsInput = document.getElementById("reportDetails");
const reasonError = document.getElementById("reportReasonError");

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
      return raw.trim();
    }
  }
  return null;
}

function getReaderName() {
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
  const el = document.getElementById("readerName");
  const domName = el ? el.textContent.trim() : "";
  if (domName && domName !== "Welcome User") return domName;
  return "Anonymous Reader";
}

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

if (modalSubmit) {
  modalSubmit.addEventListener("click", function () {
    const reason = reasonSelect.value;
    const details = detailsInput.value.trim();

    if (!reason) {
      reasonSelect.classList.add("invalid");
      reasonError.classList.add("show");
      return;
    }

    const readerName = getReaderName();
    const bookId = document.body.dataset.bookId || "Unknown";
    const bookTitle = document.body.dataset.bookTitle || "Unknown Book";
    const bookAuthor = document.body.dataset.bookAuthor || "Unknown Author";

    const chapterNumEl = document.getElementById("chapter-number");
    const chapterTitleEl = document.getElementById("chapter-title");
    const currentChapter = chapterNumEl
      ? chapterNumEl.textContent.trim()
      : "Unknown Chapter";
    const currentChapterTitle = chapterTitleEl
      ? chapterTitleEl.textContent.trim()
      : "";

    const reports = JSON.parse(localStorage.getItem(REPORT_KEY)) || [];

    reports.push({
      id: Date.now(),
      bookId: bookId,
      bookTitle: bookTitle,
      author: bookAuthor,
      reportedBy: readerName,
      chapter: currentChapter,
      chapterTitle: currentChapterTitle,
      reason: reason,
      details: details,
      date: new Date().toISOString(),
      status: "Pending",
    });

    localStorage.setItem(REPORT_KEY, JSON.stringify(reports));

    // Create the alert data for the Author
    const authorStatusData = {
      status: "warn",
      novelTitle: bookTitle,
      chapterTitle: currentChapterTitle,
      chapter: currentChapter,
      reportReason: reason,
      reportDetails: details,
      date: new Date().toLocaleDateString(),
    };
    localStorage.setItem(
      "author_alert_status",
      JSON.stringify(authorStatusData),
    );

    closeModal();

    Swal.fire({
      title: "Report Submitted",
      text: "Thank you. Your report has been submitted.",
      icon: "success",
      confirmButtonText: "OK",
    });
  });
}
