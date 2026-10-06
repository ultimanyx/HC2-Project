document.getElementById("logout").addEventListener("click", function () {
  const role = this.dataset.role;

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
      const redirects = {
        admin: "../admin-html/admin_login.html",
        reader: "../user_html/user_login.html",
        author: "../author_html/author_login.html",
      };

      window.location.href = redirects[role] || "../user_html/user_login.html";
    }
  });
});
