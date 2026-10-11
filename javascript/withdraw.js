/* =====================================================
   AUTHOR · EARNINGS — WITHDRAW FORM (DEBUG)
===================================================== */

console.log("[withdraw] file loaded");

document.addEventListener("DOMContentLoaded", function () {
  console.log("[withdraw] DOM ready");

  /* ============================================
     ELEMENTS
  ============================================ */
  var overlay = document.getElementById("withdrawModal");
  var openBtn = document.getElementById("withdraw-btn");
  var closeBtn = document.getElementById("withdrawCloseBtn");
  var form = document.getElementById("withdrawForm");
  var submitBtn = document.getElementById("withdrawSubmitBtn");
  var amountInput = document.getElementById("wAmount");
  var maxBtn = document.getElementById("wMaxBtn");
  var amountHint = document.getElementById("wAmountHint");
  var nameInput = document.getElementById("wFullName");
  var emailInput = document.getElementById("wEmail");
  var accountNameInput = document.getElementById("wAccountName");
  var accountNumInput = document.getElementById("wAccountNumber");
  var methodChips = document.querySelectorAll(".method-chip");

  console.log("[withdraw] overlay:", overlay);
  console.log("[withdraw] openBtn:", openBtn);
  console.log("[withdraw] form:", form);
  console.log("[withdraw] submitBtn:", submitBtn);
  console.log("[withdraw] method chips found:", methodChips.length);
  console.log("[withdraw] Swal loaded:", typeof window.Swal);

  /* ============================================
     SAFETY CHECK
  ============================================ */
  if (!overlay) {
    console.error("[withdraw] FATAL: #withdrawModal not found in HTML");
    return;
  }
  if (!openBtn) {
    console.error("[withdraw] FATAL: #withdraw-btn not found in HTML");
    return;
  }
  if (!form) {
    console.error("[withdraw] FATAL: #withdrawForm not found in HTML");
    return;
  }
  if (typeof window.Swal === "undefined") {
    console.error("[withdraw] FATAL: SweetAlert2 (Swal) not loaded");
    return;
  }

  /* ============================================
     CONFIG
  ============================================ */
  var MIN_WITHDRAW = 100;
  var FEE_RATE = 0.02;
  var availableBalance = 312.0;
  var selectedMethod = "gcash";

  function pesos(amount) {
    return "₱" + amount.toFixed(2);
  }

  /* ============================================
     OPEN / CLOSE
  ============================================ */
  function openModal() {
    console.log("[withdraw] opening modal");
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

    var balanceEl = document.getElementById("availableBalance");
    if (balanceEl) balanceEl.textContent = pesos(availableBalance);

    overlay.classList.add("open");
    document.body.classList.add("modal-open");

    setTimeout(function () {
      if (nameInput) nameInput.focus();
    }, 150);
  }

  function closeModal() {
    console.log("[withdraw] closing modal");
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

  /* ============================================
     METHOD CHIPS
  ============================================ */
  methodChips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      methodChips.forEach(function (c) {
        c.classList.remove("selected");
      });
      chip.classList.add("selected");
      selectedMethod = chip.dataset.method;
    });
  });

  /* ============================================
     MAX BUTTON
  ============================================ */
  if (maxBtn) {
    maxBtn.addEventListener("click", function () {
      amountInput.value = availableBalance.toFixed(2);
      updateHint();
    });
  }

  /* ============================================
     LIVE HINT
  ============================================ */
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

  /* ============================================
     SUBMIT
  ============================================ */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    console.log("[withdraw] form submitted");

    var amount = parseFloat(amountInput.value);
    var fullName = nameInput.value.trim();
    var email = emailInput.value.trim();
    var accountName = accountNameInput.value.trim();
    var accountNumber = accountNumInput.value.trim();

    /* -------- VALIDATION -------- */
    function fail(title, text, focusEl) {
      console.warn("[withdraw] validation failed:", title);
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
    console.log("[withdraw] showing confirmation");
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
      if (!result.isConfirmed) {
        console.log("[withdraw] cancelled by user");
        return;
      }

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
        console.log("[withdraw] SUCCESS");
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

  console.log("[withdraw] all listeners attached");
});
