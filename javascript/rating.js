document.addEventListener("DOMContentLoaded", function () {
  const modalOverlay = document.getElementById("ratingModalOverlay");
  const openModalBtn = document.getElementById("openRatingModalBtn");
  const closeModalBtn = document.getElementById("closeRatingModalBtn");
  const cancelBtn = document.getElementById("cancelRatingBtn");
  const submitBtn = document.getElementById("submitRatingBtn");

  const displayRating = document.getElementById("displayRating");
  const modalRatingSlider = document.getElementById("modalRatingSlider");

  if (!modalOverlay || !displayRating || !modalRatingSlider) return;

  // Get the book ID from the input OR fallback to the <body> tag
  let bookId =
    displayRating.getAttribute("data-book-id") || document.body.dataset.bookId;

  // Final fallback: get it from the book title if it's missing everywhere
  if (!bookId) {
    const titleEl = document.getElementById("titleBook");
    if (titleEl)
      bookId = titleEl.textContent.trim().toLowerCase().replace(/\s+/g, "-");
  }

  const storageKey = `book_rating_${bookId}`;

  // 1. Load Existing Rating on Page Load
  const savedRating = localStorage.getItem(storageKey);
  if (savedRating) {
    displayRating.value = savedRating;
    displayRating.style.setProperty("--val", savedRating);
  } else {
    displayRating.value = 0;
    displayRating.style.setProperty("--val", 0);
  }

  // Make clicks on the disabled input pass through to the button
  displayRating.style.pointerEvents = "none";

  // 2. Open Modal
  openModalBtn.addEventListener("click", function () {
    const currentRating = displayRating.value;
    modalRatingSlider.value = currentRating;
    modalRatingSlider.style.setProperty("--val", currentRating);

    modalOverlay.classList.add("active");
  });

  // 3. Close Modal functions
  function closeModal() {
    modalOverlay.classList.remove("active");
  }

  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

  // Close when clicking outside the modal
  modalOverlay.addEventListener("click", function (e) {
    if (e.target === modalOverlay) closeModal();
  });

  // 4. Update Modal Stars visually as user drags
  modalRatingSlider.addEventListener("input", function () {
    this.style.setProperty("--val", this.value);
  });

  // 5. Submit Rating
  submitBtn.addEventListener("click", function () {
    const newRating = modalRatingSlider.value;

    if (parseFloat(newRating) === 0) {
      if (typeof Swal !== "undefined") {
        Swal.fire({
          icon: "warning",
          title: "No Rating Selected",
          text: "Please drag the stars to select a rating.",
          confirmButtonColor: "#b8721f",
        });
      } else {
        alert("Please select a rating first.");
      }
      return;
    }

    // Save to localStorage under the specific book's key
    localStorage.setItem(storageKey, newRating);

    // Update the display stars on the main page
    displayRating.value = newRating;
    displayRating.style.setProperty("--val", newRating);

    // Close modal
    closeModal();

    // Show centered SweetAlert feedback
    if (typeof Swal !== "undefined") {
      Swal.fire({
        icon: "success",
        title: "Thank You!",
        text: `You rated this book ${parseFloat(newRating).toFixed(1)} stars.`,
        confirmButtonColor: "#b8721f",
        confirmButtonText: "Awesome",
      });
    }
  });
});
