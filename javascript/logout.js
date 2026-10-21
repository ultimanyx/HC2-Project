document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logout");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault(); // Prevents the page from jumping to the top

      Swal.fire({
        title: "Are you sure?",
        text: "You will be logged out!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, logout!",
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          // 1. Clear all user sessions
          sessionStorage.removeItem("currentUser");
          sessionStorage.removeItem("currentReader");
          sessionStorage.removeItem("currentAuthor");
          sessionStorage.removeItem("adminLoggedIn");

          window.location.href = "../index.html";
        }
      });
    });
  }
});
