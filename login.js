document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector(".login-form");

  if (!form) {
    return;
  }

  const role = form.getAttribute("data-role");

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const email = document.getElementById(role + "_email").value.trim();
    const password = document.getElementById(role + "_password").value.trim();

    // =========================
    // ADMIN LOGIN
    // =========================

    if (role === "admin") {
      const adminEmail = "admin@gmail.com";
      const adminPassword = "admin123";

      if (email === adminEmail && password === adminPassword) {
        localStorage.setItem("loggedIn", adminEmail);
        localStorage.setItem("role", "admin");
        setTimeout(() => {
          window.location.href = "../admin-html/admin.html";
        }, 1000);
      } else {
        alert("Wrong email or password!");
      }

      return;
    }

    // Get users for Reader and Author
    let users = JSON.parse(localStorage.getItem("users")) || [];

    // =========================
    // SIGN UP
    // =========================

    const usernameInput = document.getElementById(role + "_username");

    if (usernameInput) {
      const username = usernameInput.value.trim();

      if (username === "" || email === "" || password === "") {
        alert("Please fill in all fields.");
        return;
      }

      // Check if email already exists
      for (let i = 0; i < users.length; i++) {
        if (users[i].email === email && users[i].role === role) {
          alert("Email already registered!");
          return;
        }
      }

      // Create new user
      const newUser = {
        role: role,
        username: username,
        email: email,
        password: password,
      };

      // Save phone number
      const numberInput = document.getElementById(role + "_number");

      if (numberInput) {
        newUser.number = numberInput.value.trim();
      }

      // Save author name
      const authorNameInput = document.getElementById("author_name");

      if (authorNameInput) {
        newUser.penName = authorNameInput.value.trim();
      }

      users.push(newUser);

      localStorage.setItem("users", JSON.stringify(users));

      alert("Account created!");

      // Go to login page
      if (role === "reader") {
        setTimeout(() => {
          window.location.href = "../user_html/user_login.html";
        }, 800);
      } else if (role === "author") {
        setTimeout(() => {
          window.location.href = "../author_html/author_login.html";
        }, 800);
      }

      return;
    }

    // =========================
    // LOGIN
    // =========================

    let loggedInUser = null;

    for (let i = 0; i < users.length; i++) {
      if (
        users[i].email === email &&
        users[i].password === password &&
        users[i].role === role
      ) {
        loggedInUser = users[i];
        break;
      }
    }

    // Check login
    if (loggedInUser) {
      localStorage.setItem("loggedIn", loggedInUser.email);
      localStorage.setItem("role", loggedInUser.role);

      if (role === "reader") {
        window.location.href = "../user_html/home.html";
      } else if (role === "author") {
        window.location.href = "../author_html/author_dashboard.html";
      }
    } else {
      alert("Wrong email or password!");
    }
  });
});
