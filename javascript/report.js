const REPORT_KEY = "chapterReports";

const reportButton = document.getElementById("reportBtn");
const modalOverlay = document.getElementById("reportModalOverlay");
const modalClose = document.getElementById("reportModalClose");
const modalCancel = document.getElementById("reportModalCancel");
const modalSubmit = document.getElementById("reportModalSubmit");
const reasonSelect = document.getElementById("reportReason");
const detailsInput = document.getElementById("reportDetails");
const reasonError = document.getElementById("reportReasonError");

// Open the modal when Report is clicked
reportButton.addEventListener("click", function () {
  modalOverlay.classList.add("active");
  reasonSelect.value = "";
  detailsInput.value = "";
  reasonError.classList.remove("show");
  reasonSelect.classList.remove("invalid");
});

// Close the modal
function closeModal() {
  modalOverlay.classList.remove("active");
}

modalClose.addEventListener("click", closeModal);
modalCancel.addEventListener("click", closeModal);

// Submit the report
modalSubmit.addEventListener("click", function () {
  const reason = reasonSelect.value;
  const details = detailsInput.value.trim();

  if (!reason) {
    reasonSelect.classList.add("invalid");
    reasonError.classList.add("show");
    return;
  }

  const reports = JSON.parse(localStorage.getItem(REPORT_KEY)) || [];

  reports.push({
    id: Date.now(),
    bookId: document.body.dataset.bookId,
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
