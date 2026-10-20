document.addEventListener("DOMContentLoaded", function () {
  const reportedList = document.getElementById("reportedList");

  // 1. Check LocalStorage for Admin Actions
  const savedAlert = localStorage.getItem("author_alert_status");

  if (savedAlert && reportedList) {
    const data = JSON.parse(savedAlert);

    // --- Show Popup Notification (SweetAlert) ---
    let toastTitle = "";
    let toastIcon = "";

    if (data.status === "warn") {
      toastTitle = "⚠️ You have a new warning from Admin";
      toastIcon = "warning";
    } else if (data.status === "ban") {
      toastTitle = "🚫 Your novel has been banned";
      toastIcon = "error";
    } else if (data.status === "archive") {
      toastTitle = "📁 Your novel has been archived";
      toastIcon = "info";
    }

    // EXCEPTION: Keep this specific notification as a top-right toast
    if (toastTitle) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: toastIcon,
        title: toastTitle,
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
      });
    }

    // --- Inject Alert directly into the list ---
    let listItemHtml = "";

    if (data.status === "warn") {
      listItemHtml = `
        <li class="admin-action-item">
          <div class="report-info">
            <span class="report-book">${data.novelTitle}</span>
            <span class="report-chapter" style="color: var(--destructive); font-weight: 600;">Warning Issued</span>
            <span class="report-reason">${data.reportReason || "Guidelines violation"}</span>
          </div>
        </li>
      `;
    } else if (data.status === "ban") {
      listItemHtml = `
        <li class="admin-action-item">
          <div class="report-info">
            <span class="report-book">${data.novelTitle}</span>
            <span class="report-chapter" style="color: var(--destructive); font-weight: 600;">Account Banned</span>
            <span class="report-reason">${data.reportReason || "Guidelines violation"}</span>
            <button id="inlineAppealBtn" class="alert-action-btn">File an Appeal</button>
          </div>
        </li>
      `;
    } else if (data.status === "archive") {
      listItemHtml = `
        <li class="admin-action-item">
          <div class="report-info">
            <span class="report-book">${data.novelTitle}</span>
            <span class="report-chapter" style="color: var(--muted-foreground); font-weight: 600;">Novel Archived</span>
            <span class="report-reason" style="background: var(--secondary); color: var(--muted-foreground);">Archived by Admin</span>
            <button id="inlineAppealBtn" class="alert-action-btn">File an Appeal</button>
          </div>
        </li>
      `;
    } else if (data.status === "appealed") {
      listItemHtml = `
        <li class="admin-action-item">
          <div class="report-info">
            <span class="report-book">${data.novelTitle}</span>
            <span class="report-chapter" style="color: var(--link-hover); font-weight: 600;">Appeal Under Review</span>
            <span class="report-reason" style="background: rgba(59, 111, 145, 0.1); color: var(--link-hover);">Pending Review</span>
          </div>
        </li>
      `;
    }

    // Inject it at the top of the list
    if (listItemHtml) {
      reportedList.insertAdjacentHTML("afterbegin", listItemHtml);
    }

    // --- Handle Appeal Button ---
    const appealBtn = document.getElementById("inlineAppealBtn");
    if (appealBtn) {
      appealBtn.addEventListener("click", function () {
        Swal.fire({
          title: "File an Appeal",
          text: "Explain why you believe this action was a mistake. Our moderation team will review it.",
          input: "textarea",
          inputPlaceholder: "Type your appeal here...",
          showCancelButton: true,
          confirmButtonText: "Submit Appeal",
          confirmButtonColor: "#b8721f",
          cancelButtonColor: "#6b6680",
          inputValidator: (value) => {
            if (!value || value.trim().length < 10) {
              return "Please provide a valid explanation (at least 10 characters).";
            }
          },
        }).then((result) => {
          if (result.isConfirmed) {
            // Update Local Storage
            data.status = "appealed";
            data.appealReason = result.value.trim();
            localStorage.setItem("author_alert_status", JSON.stringify(data));

            // Replace the Ban/Archive List Item with an Appealed List Item
            const actionItem = document.querySelector(".admin-action-item");
            if (actionItem) {
              actionItem.innerHTML = `
                <div class="report-info">
                  <span class="report-book">${data.novelTitle}</span>
                  <span class="report-chapter" style="color: var(--link-hover); font-weight: 600;">Appeal Under Review</span>
                  <span class="report-reason" style="background: rgba(59, 111, 145, 0.1); color: var(--link-hover);">Pending Review</span>
                </div>
              `;
            }

            // System Feedback - CENTERED
            Swal.fire({
              icon: "success",
              title: "Appeal Submitted",
              text: "Your appeal has been sent to the moderation team.",
              showConfirmButton: false,
              timer: 2500,
            });
          }
        });
      });
    }
  }
});
