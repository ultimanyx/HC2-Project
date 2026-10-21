/* =========================================
   CONTACT US PAGE — Form Validation
   ========================================= */
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const subjectInput = document.getElementById("subject");
  const messageInput = document.getElementById("message");

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const subject = subjectInput.value;
    const message = messageInput.value.trim();

    // Check all fields are filled
    if (!name || !email || !subject || !message) {
      Swal.fire({
        icon: "warning",
        title: "Missing fields",
        text: "Please fill in all fields before sending.",
        confirmButtonColor: "#b8721f",
      });
      return;
    }

    // Validate email format
    if (!emailPattern.test(email)) {
      Swal.fire({
        icon: "warning",
        title: "Invalid email",
        text: "Please enter a valid email address.",
        confirmButtonColor: "#b8721f",
      });
      return;
    }

    Swal.fire({
      icon: "success",
      title: "Message sent!",
      text: "Thanks for reaching out — we'll get back to you soon.",
      confirmButtonColor: "#b8721f",
    }).then(() => {
      form.reset();
    });
  });
});
