document.addEventListener("DOMContentLoaded", function () {
  // ============================================
  // ELEMENTS
  // ============================================
  var overlay = document.getElementById("withdrawModal");
  var openBtn = document.getElementById("withdraw-btn");
  var closeBtn = document.getElementById("withdrawCloseBtn");
  var form = document.getElementById("withdrawForm");
  var amountInput = document.getElementById("wAmount");
  var maxBtn = document.getElementById("wMaxBtn");
  var amountHint = document.getElementById("wAmountHint");
  var nameInput = document.getElementById("wFullName");
  var emailInput = document.getElementById("wEmail");
  var accountNameInput = document.getElementById("wAccountName");
  var accountNumInput = document.getElementById("wAccountNumber");
  var methodChips = document.querySelectorAll(".method-chip");

  if (!overlay || !openBtn || !form || typeof window.Swal === "undefined") {
    return;
  }

  // ============================================
  // BALANCE MANAGEMENT (Dynamic)
  // ============================================
  var MIN_WITHDRAW = 100;
  var FEE_RATE = 0.02;

  // Load balances from localStorage
  var availableBalance =
    parseFloat(localStorage.getItem("author_available_balance")) || 269.0;
  var upcomingPayout =
    parseFloat(localStorage.getItem("author_upcoming_payout")) || 0.0;

  var selectedMethod = "gcash";

  function pesos(amount) {
    return "₱" + amount.toFixed(2);
  }

  // Update the UI stat cards and modal strip
  function updateBalanceUI() {
    // 1. Update Center Card (Available to Withdraw)
    var statAvailableEl = document.getElementById("stat-available");
    if (statAvailableEl) statAvailableEl.textContent = pesos(availableBalance);

    var centerNotice = document.getElementById("stat-available-notice");
    if (centerNotice) {
      if (availableBalance > 0) {
        centerNotice.textContent = "Ready to withdraw";
        centerNotice.className = "stat-change positive";
      } else {
        centerNotice.textContent = "No funds available";
        centerNotice.className = "stat-change warning";
      }
    }

    // 2. Update Right Card (Upcoming Payout)
    var upcomingValEl = document.getElementById("stat-upcoming");
    var upcomingNoticeEl = document.getElementById("stat-upcoming-notice");

    if (upcomingValEl) upcomingValEl.textContent = pesos(upcomingPayout);

    if (upcomingNoticeEl) {
      if (upcomingPayout > 0) {
        upcomingNoticeEl.textContent = "Processing payout";
        upcomingNoticeEl.className = "stat-change warning";
      } else {
        upcomingNoticeEl.textContent = "No incoming funds";
        upcomingNoticeEl.className = "stat-change positive";
      }
    }

    // 3. Update Modal Display
    var modalBalanceEl = document.getElementById("availableBalance");
    if (modalBalanceEl) modalBalanceEl.textContent = pesos(availableBalance);
  }

  // Initial sync on load
  updateBalanceUI();

  // ============================================
  // OPEN / CLOSE
  // ============================================
  function openModal() {
    // If balance is 0, don't open modal
    if (availableBalance <= 0) {
      Swal.fire(
        "No Funds",
        "You do not have any available balance to withdraw.",
        "info",
      );
      return;
    }

    form.reset();
    selectedMethod = "gcash";

    methodChips.forEach(function (chip) {
      chip.classList.remove("selected");
      if (chip.dataset.method === "gcash") chip.classList.add("selected");
    });

    if (amountHint) {
      amountHint.textContent = "Minimum withdrawal: " + pesos(MIN_WITHDRAW);
      amountHint.classList.remove("error");
    }

    updateBalanceUI();

    overlay.classList.add("open");
    document.body.classList.add("modal-open");

    setTimeout(function () {
      if (nameInput) nameInput.focus();
    }, 150);
  }

  function closeModal() {
    overlay.classList.remove("open");
    document.body.classList.remove("modal-open");
  }

  openBtn.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);

  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlay.classList.contains("open")) closeModal();
  });

  // ============================================
  // METHOD CHIPS
  // ============================================
  methodChips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      methodChips.forEach(function (c) {
        c.classList.remove("selected");
      });
      chip.classList.add("selected");
      selectedMethod = chip.dataset.method;
    });
  });

  // ============================================
  // MAX BUTTON & LIVE HINT
  // ============================================
  if (maxBtn) {
    maxBtn.addEventListener("click", function () {
      amountInput.value = availableBalance.toFixed(2);
      updateHint();
    });
  }

  function updateHint() {
    if (!amountHint) return;
    var amount = parseFloat(amountInput.value) || 0;

    if (amountInput.value === "") {
      amountHint.textContent = "Minimum withdrawal: " + pesos(MIN_WITHDRAW);
      amountHint.classList.remove("error");
      return;
    }
    if (amount < MIN_WITHDRAW) {
      amountHint.textContent =
        "Minimum withdrawal is " + pesos(MIN_WITHDRAW) + ".";
      amountHint.classList.add("error");
      return;
    }
    if (amount > availableBalance) {
      amountHint.textContent =
        "You can only withdraw up to " + pesos(availableBalance) + ".";
      amountHint.classList.add("error");
      return;
    }
    var fee = amount * FEE_RATE;
    amountHint.textContent =
      "You will receive " +
      pesos(amount - fee) +
      " after " +
      pesos(fee) +
      " fee.";
    amountHint.classList.remove("error");
  }

  if (amountInput) amountInput.addEventListener("input", updateHint);

  // ============================================
  // SUBMIT & DEDUCT BALANCE
  // ============================================
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var amount = parseFloat(amountInput.value);
    var fullName = nameInput.value.trim();
    var email = emailInput.value.trim();
    var accountName = accountNameInput.value.trim();
    var accountNumber = accountNumInput.value.trim();

    /* -------- VALIDATION -------- */
    function fail(title, text, focusEl) {
      Swal.fire({
        icon: "error",
        title: title,
        text: text,
        confirmButtonColor: "#1f9d4f",
      });
      if (focusEl) focusEl.focus();
    }

    if (!fullName)
      return fail("Missing name", "Please enter your full name.", nameInput);
    if (!email)
      return fail(
        "Missing email",
        "Please enter your email address.",
        emailInput,
      );
    if (!amount || amount < MIN_WITHDRAW)
      return fail(
        "Invalid amount",
        "Please enter at least " + pesos(MIN_WITHDRAW) + ".",
        amountInput,
      );
    if (amount > availableBalance)
      return fail(
        "Amount too high",
        "You can only withdraw up to " + pesos(availableBalance) + ".",
        amountInput,
      );
    if (!accountName)
      return fail(
        "Missing account name",
        "Please enter the name on the account.",
        accountNameInput,
      );
    if (!accountNumber)
      return fail(
        "Missing account number",
        "Please enter your account number or email.",
        accountNumInput,
      );

    var fee = amount * FEE_RATE;
    var net = amount - fee;
    var methodLabel =
      selectedMethod === "gcash"
        ? "GCash"
        : selectedMethod === "bank"
          ? "Bank Transfer"
          : "PayPal";

    /* -------- CONFIRM -------- */
    Swal.fire({
      icon: "question",
      title: "Confirm Withdrawal",
      html:
        "<div style='text-align:left;font-size:14px;line-height:1.8;'>" +
        "<div>Amount: <strong>" +
        pesos(amount) +
        "</strong></div>" +
        "<div>Fee (2%): <strong>" +
        pesos(fee) +
        "</strong></div>" +
        "<div>You receive: <strong style='color:#1f9d4f;'>" +
        pesos(net) +
        "</strong></div>" +
        "<div>Method: <strong>" +
        methodLabel +
        "</strong></div>" +
        "<div>Account: <strong>" +
        accountNumber +
        "</strong></div>" +
        "</div>",
      showCancelButton: true,
      confirmButtonText: "Yes, withdraw",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#1f9d4f",
    }).then(function (result) {
      if (!result.isConfirmed) return;

      closeModal();

      Swal.fire({
        title: "Processing…",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: function () {
          Swal.showLoading();
        },
      });

      setTimeout(function () {
        // Deduct the withdrawn amount from available balance
        availableBalance -= amount;

        // Add the amount to upcoming payout
        upcomingPayout += amount;

        // Save the new balances to localStorage
        localStorage.setItem("author_available_balance", availableBalance);
        localStorage.setItem("author_upcoming_payout", upcomingPayout);

        // Update the UI immediately
        updateBalanceUI();

        Swal.fire({
          icon: "success",
          title: "Withdrawal Requested",
          text: pesos(amount) + " will arrive in 3–5 business days.",
          confirmButtonText: "Got it",
          confirmButtonColor: "#1f9d4f",
        });
      }, 1000);
    });
  });
});
