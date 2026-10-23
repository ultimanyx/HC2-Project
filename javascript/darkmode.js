(function () {
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;

  if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }

  // 2. Wait for the HTML to load to attach the button click events
  document.addEventListener("DOMContentLoaded", function () {
    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");
    const themeText = document.getElementById("themeText");

    const darkModeIcon = "../icons/dark-mode.svg";
    const lightModeIcon = "../icons/light-mode.svg";

    // Helper function to update the button's icon and text
    function updateButtonUI() {
      const isDark =
        document.documentElement.getAttribute("data-theme") === "dark";

      if (isDark) {
        if (themeIcon) themeIcon.src = lightModeIcon;
        if (themeText) themeText.textContent = "Light Mode";
      } else {
        if (themeIcon) themeIcon.src = darkModeIcon;
        if (themeText) themeText.textContent = "Dark Mode";
      }
    }

    // Set initial button state
    updateButtonUI();

    // 3. Add the click event listener if the button exists on this page
    if (themeToggle) {
      themeToggle.addEventListener("click", function (e) {
        e.preventDefault();

        const isDark =
          document.documentElement.getAttribute("data-theme") === "dark";

        if (isDark) {
          // Switch to Light Mode
          document.documentElement.removeAttribute("data-theme");
          localStorage.setItem("theme", "light");
        } else {
          // Switch to Dark Mode
          document.documentElement.setAttribute("data-theme", "dark");
          localStorage.setItem("theme", "dark");
        }

        // Update the icon and text
        updateButtonUI();
      });
    }
  });
})();
