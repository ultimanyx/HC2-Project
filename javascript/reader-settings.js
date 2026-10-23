document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  // Check if we are on a chapter page
  const chapterContent = document.getElementById("chapter-content");
  if (!chapterContent) return;

  // Default values
  let fontSize = parseInt(localStorage.getItem("reader-font-size")) || 19;
  let lineHeight =
    parseFloat(localStorage.getItem("reader-line-height")) || 1.7;

  // Limits
  const MIN_FONT = 14;
  const MAX_FONT = 32;
  const MIN_LINE = 1.2;
  const MAX_LINE = 2.5;

  // Apply settings to CSS variables
  function applySettings() {
    document.documentElement.style.setProperty(
      "--reader-font-size",
      `${fontSize}px`,
    );
    document.documentElement.style.setProperty(
      "--reader-line-height",
      lineHeight,
    );

    // Save to localStorage
    localStorage.setItem("reader-font-size", fontSize);
    localStorage.setItem("reader-line-height", lineHeight);
  }

  // Apply on page load
  applySettings();

  // Get buttons
  const decreaseFontBtn = document.getElementById("decreaseFont");
  const increaseFontBtn = document.getElementById("increaseFont");
  const decreaseLineBtn = document.getElementById("decreaseLine");
  const increaseLineBtn = document.getElementById("increaseLine");

  // Event Listeners
  if (increaseFontBtn) {
    increaseFontBtn.addEventListener("click", function () {
      if (fontSize < MAX_FONT) {
        fontSize += 1;
        applySettings();
      }
    });
  }

  if (decreaseFontBtn) {
    decreaseFontBtn.addEventListener("click", function () {
      if (fontSize > MIN_FONT) {
        fontSize -= 1;
        applySettings();
      }
    });
  }

  if (increaseLineBtn) {
    increaseLineBtn.addEventListener("click", function () {
      if (lineHeight < MAX_LINE) {
        lineHeight = Math.round((lineHeight + 0.1) * 10) / 10; // Prevents floating point issues
        applySettings();
      }
    });
  }

  if (decreaseLineBtn) {
    decreaseLineBtn.addEventListener("click", function () {
      if (lineHeight > MIN_LINE) {
        lineHeight = Math.round((lineHeight - 0.1) * 10) / 10;
        applySettings();
      }
    });
  }
});
