let slideIndex = 1;
let slideTimeout; // Store the timer globally so we can clear it

// Initialize the carousel
showSlides(slideIndex);

// Next/previous controls
function plusSlides(n) {
  clearTimeout(slideTimeout); // Stop the current timer
  showSlides((slideIndex += n));
}

// Dot controls
function currentSlide(n) {
  clearTimeout(slideTimeout); // Stop the current timer
  showSlides((slideIndex = n));
}

function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("mySlides");
  let dots = document.getElementsByClassName("dot");

  // Wrap around logic
  if (n > slides.length) {
    slideIndex = 1;
  }
  if (n < 1) {
    slideIndex = slides.length;
  }

  // Hide all slides
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }

  // Remove the "active" class from all dots
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }

  // Show the current slide
  slides[slideIndex - 1].style.display = "block";

  // Add "active" class to the matching dot
  if (dots.length > 0) {
    dots[slideIndex - 1].className += " active";
  }

  // Clear the previous timer and start a new one
  clearTimeout(slideTimeout);
  slideTimeout = setTimeout(function () {
    slideIndex++;
    showSlides(slideIndex);
  }, 5000);
}
