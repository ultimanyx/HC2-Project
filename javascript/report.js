const REPORT_KEY = "chapterReports";

const reportButton = document.getElementById("reportBtn");
const chapterNumber = document.getElementById("chapter-number");
const chapterTitle = document.getElementById("chapter-title");

if (reportButton && chapterNumber) {
  const bookId = document.body.dataset.bookId;

  reportButton.addEventListener("click", function () {
    const currentChapter = chapterNumber.textContent.trim();
    const currentTitle = chapterTitle ? chapterTitle.textContent.trim() : "";

    Swal.fire({
      title: "Report Chapter",
      html: `
        <select id="reportReason" class="swal2-select">
          <option value="">Select a reason</option>
          <option value="Broken content">Broken content</option>
          <option value="Missing content">Missing content</option>
          <option value="Wrong chapter">Wrong chapter</option>
          <option value="Inappropriate content">Inappropriate content</option>
          <option value="Other">Other</option>
        </select>

        <textarea
          id="reportDetails"
          class="swal2-textarea"
          placeholder="Additional details (optional)"
        ></textarea>
      `,

      // Prevents SweetAlert2's default button styling from overriding our CSS
      buttonsStyling: false,

      // Add custom classes so our stylesheet can target each part
      customClass: {
        popup: "report-popup",
        title: "report-title",
        htmlContainer: "report-html-container",
        confirmButton: "report-confirm-btn",
        cancelButton: "report-cancel-btn",
        validationMessage: "report-validation-msg",
      },

      showCancelButton: true,
      confirmButtonText: "Submit Report",
      cancelButtonText: "Cancel",
      focusConfirm: false,
      reverseButtons: true,

      // Runs after the popup opens — lets us focus the select and
      // block keyboard submission until a reason is picked
      didOpen: () => {
        const select = document.getElementById("reportReason");
        if (select) select.focus();
      },

      preConfirm: function () {
        const reasonEl = document.getElementById("reportReason");
        const detailsEl = document.getElementById("reportDetails");

        const reason = reasonEl ? reasonEl.value : "";
        const details = detailsEl ? detailsEl.value.trim() : "";

        if (!reason) {
          Swal.showValidationMessage("Please select a reason.");
          return false;
        }

        return {
          reason: reason,
          details: details,
        };
      },
    }).then(function (result) {
      if (!result.isConfirmed) {
        return;
      }

      const reports = JSON.parse(localStorage.getItem(REPORT_KEY)) || [];

      const newReport = {
        id: Date.now(),
        bookId: bookId,
        chapter: currentChapter,
        chapterTitle: currentTitle,
        reason: result.value.reason,
        details: result.value.details,
        date: new Date().toISOString(),
        status: "Pending",
      };

      reports.push(newReport);

      localStorage.setItem(REPORT_KEY, JSON.stringify(reports));

      Swal.fire({
        title: "Report Submitted",
        text: "Thank you. Your report has been submitted.",
        icon: "success",
        buttonsStyling: false,
        customClass: {
          popup: "report-popup",
          title: "report-title",
          confirmButton: "report-confirm-btn",
        },
        confirmButtonText: "OK",
      });
    });
  });
}
