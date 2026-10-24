function loadDashboardData() {
  const STORAGE_KEY = "novels";

  let allNovels = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

  let dracula = allNovels.find((n) => String(n.id) === "seed-0");
  if (!dracula) {
    dracula = {
      id: "seed-0",
      title: "Dracula",
      subtitle: "A Gothic Horror Classic",
      author: "Bram Stoker",
      genre: "Horror",
      synopsis:
        "Dracula is an 1897 Gothic horror novel by Irish author Bram Stoker...",
      coverImage:
        "../books/Horror(1)/Dracula by Bram Stoker/dracula-9781471141621_lg.jpg",
      status: "published",
      chapters: [
        {
          number: 1,
          title: "Jonathan Harker's Journal",
          status: "published",
          words: 4120,
          lastUpdated: Date.now() - 2 * 86400000,
        },
        {
          number: 2,
          title: "The Blood is the Life",
          status: "published",
          words: 3850,
          lastUpdated: Date.now() - 5 * 86400000,
        },
        {
          number: 3,
          title: "The Grey Man",
          status: "published",
          words: 3210,
          lastUpdated: Date.now() - 7 * 86400000,
        },
      ],
      reads: 12843,
      rating: 4.8,
      systemSeeded: false,
      archived: false,
    };
    allNovels.push(dracula);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allNovels));
  } else {
    dracula.status = "published";
    dracula.systemSeeded = false;
  }

  const myNovels = allNovels.filter((n) => {
    if (n.archived) return false;
    if (n.systemSeeded && String(n.id) !== "seed-0") return false;
    return true;
  });

  let totalReads = 0;
  myNovels.forEach((n) => {
    totalReads += Number(n.reads) || 0;
  });

  const totalEarnings = totalReads * 0.15;
  const readsEl = document.getElementById("dash-total-reads");
  const earningsEl = document.getElementById("dash-total-earnings");

  if (readsEl) readsEl.textContent = totalReads.toLocaleString();
  if (earningsEl) {
    earningsEl.textContent =
      "₱" +
      totalEarnings.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
  }

  const topTbody = document.getElementById("dash-top-novels");
  const showingText = document.getElementById("dash-showing-text");

  if (topTbody) {
    const sorted = [...myNovels].sort(
      (a, b) => (Number(b.reads) || 0) - (Number(a.reads) || 0),
    );
    const topNovels = sorted.slice(0, 3);

    if (topNovels.length === 0) {
      topTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:#6b6680;">You haven't published any novels yet.</td></tr>`;
      if (showingText) showingText.textContent = "Showing top 0 novels";
    } else {
      topTbody.innerHTML = topNovels
        .map((n) => {
          const statusClass =
            n.status === "published" || n.status === "Ongoing"
              ? "active"
              : n.status === "completed"
                ? "completed"
                : "pending";
          const statusText =
            n.status === "published"
              ? "Ongoing"
              : n.status === "completed"
                ? "Completed"
                : "Pending Review";
          const bookEarnings = (Number(n.reads) || 0) * 0.15;
          const rating = n.rating
            ? `<img src="../icons/star-fill.svg" alt="star" class="star-rating"> ${n.rating}`
            : "—";

          return `
            <tr>
              <td><strong>${n.title}</strong></td>
              <td><span class="badge ${statusClass}">${statusText}</span></td>
              <td>${(Number(n.reads) || 0).toLocaleString()}</td>
              <td>${rating}</td>
              <td>₱${bookEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          `;
        })
        .join("");

      if (showingText)
        showingText.textContent = `Showing top ${topNovels.length} novels`;
    }
  }

  const reportedList = document.getElementById("reportedList");

  if (reportedList) {
    let listHtml = "";
    const savedAlert = localStorage.getItem("author_alert_status");
    let alertData = null;

    if (savedAlert) {
      alertData = JSON.parse(savedAlert);

      let toastTitle = "";
      let toastIcon = "";

      if (alertData.status === "warn") {
        toastTitle = "⚠️ You have a new warning from Admin";
        toastIcon = "warning";
      } else if (alertData.status === "ban") {
        toastTitle = "🚫 Your novel has been banned";
        toastIcon = "error";
      } else if (alertData.status === "archive") {
        toastTitle = "📁 Your novel has been archived";
        toastIcon = "info";
      }

      const alreadyNotified = alertData.notified === alertData.status;

      if (toastTitle && !alreadyNotified) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: toastIcon,
          title: toastTitle,
          showConfirmButton: false,
          timer: 4000,
          timerProgressBar: true,
        });

        alertData.notified = alertData.status;
        localStorage.setItem("author_alert_status", JSON.stringify(alertData));
      }

      if (alertData.status === "warn") {
        const chapterDisplay = alertData.chapter
          ? `(${alertData.chapter})`
          : "";
        listHtml += `
          <li class="admin-action-item">
            <div class="report-info">
              <span class="report-book">${alertData.novelTitle} <strong style="color:var(--foreground);">${chapterDisplay}</strong></span>
              <span class="report-chapter" style="color: var(--destructive); font-weight: 600;">Warning Issued</span>
              <span class="report-reason">${alertData.reportReason || "Guidelines violation"}</span>
              <span class="report-reason" style="background: transparent; padding-left: 0; color: var(--muted-foreground); font-style: italic; margin-top: 4px;">"${alertData.reportDetails || "No additional details"}"</span>
            </div>
          </li>
        `;
      } else if (alertData.status === "ban") {
        listHtml += `
          <li class="admin-action-item">
            <div class="report-info">
              <span class="report-book">${alertData.novelTitle}</span>
              <span class="report-chapter" style="color: var(--destructive); font-weight: 600;">Account Banned</span>
              <span class="report-reason">${alertData.reportReason || "Guidelines violation"}</span>
              <button id="inlineAppealBtn" class="alert-action-btn">File an Appeal</button>
            </div>
          </li>
        `;
      } else if (alertData.status === "archive") {
        listHtml += `
          <li class="admin-action-item">
            <div class="report-info">
              <span class="report-book">${alertData.novelTitle}</span>
              <span class="report-chapter" style="color: var(--muted-foreground); font-weight: 600;">Novel Archived</span>
              <span class="report-reason" style="background: var(--secondary); color: var(--muted-foreground);">Archived by Admin</span>
              <button id="inlineAppealBtn" class="alert-action-btn">File an Appeal</button>
            </div>
          </li>
        `;
      } else if (alertData.status === "appealed") {
        listHtml += `
          <li class="admin-action-item">
            <div class="report-info">
              <span class="report-book">${alertData.novelTitle}</span>
              <span class="report-chapter" style="color: var(--link-hover); font-weight: 600;">Appeal Under Review</span>
              <span class="report-reason" style="background: rgba(59, 111, 145, 0.1); color: var(--link-hover);">Pending Review</span>
            </div>
          </li>
        `;
      }
    }

    const reportedNovels = myNovels.filter((n) => n.reported || n.reportReason);
    if (reportedNovels.length > 0) {
      reportedNovels.forEach((n) => {
        listHtml += `
          <li>
            <div class="report-info">
              <span class="report-book">${n.title}</span>
              <span class="report-chapter">${n.reportChapter || "Unknown chapter"}</span>
              <span class="report-reason">${n.reportReason || "Reported"}</span>
            </div>
          </li>
        `;
      });
    }

    if (listHtml !== "") {
      reportedList.innerHTML = listHtml;
    } else {
      reportedList.innerHTML = `
        <li class="empty-report-state">
          <div class="empty-report-content">
            <span>None of your novels have been reported.</span>
          </div>
        </li>
      `;
    }

    const appealBtn = document.getElementById("inlineAppealBtn");
    if (appealBtn && alertData) {
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
            alertData.status = "appealed";
            alertData.appealReason = result.value.trim();
            alertData.notified = "appealed";
            localStorage.setItem(
              "author_alert_status",
              JSON.stringify(alertData),
            );

            const actionItem = document.querySelector(".admin-action-item");
            if (actionItem) {
              actionItem.innerHTML = `
                <div class="report-info">
                  <span class="report-book">${alertData.novelTitle}</span>
                  <span class="report-chapter" style="color: var(--link-hover); font-weight: 600;">Appeal Under Review</span>
                  <span class="report-reason" style="background: rgba(59, 111, 145, 0.1); color: var(--link-hover);">Pending Review</span>
                </div>
              `;
            }

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

  const chartBars = document.querySelectorAll("#dash-chart-bars .bar");
  if (chartBars.length > 0) {
    chartBars.forEach((bar) => {
      const randomHeight = Math.floor(Math.random() * (150 - 30 + 1)) + 30;
      bar.style.height = `${randomHeight}px`;
    });
  }
}

document.addEventListener("DOMContentLoaded", loadDashboardData);
window.addEventListener("pageshow", function (event) {
  if (event.persisted) loadDashboardData();
});
