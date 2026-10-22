// ============================================================
// HARDCODED ADMIN (Kept in memory for security)
// ============================================================
const ADMIN = {
  email: "admin@gmail.com",
  password: "admin123",
  redirect: "./admin-html/admin.html",
};

// ============================================================
// DEFAULT ACCOUNTS (Will be saved to localStorage)
// ============================================================
const DEFAULT_READER = {
  username: "John Smith",
  email: "john@gmail.com",
  password: "john123",
  role: "reader",
};

const DEFAULT_AUTHOR = {
  username: "Bram Stoker",
  email: "bramstoker@gmail.com",
  password: "bramstoker",
  role: "author",
};

// ============================================================
// INITIALIZE / SEED DEFAULT ACCOUNTS
// This runs automatically when the page loads.
// ============================================================
function seedDefaultAccounts() {
  let users = JSON.parse(localStorage.getItem("users")) || [];

  // Check if Default Reader exists, if not, add them
  const readerExists = users.find((u) => u.email === DEFAULT_READER.email);
  if (!readerExists) {
    users.push(DEFAULT_READER);
  }

  // Check if Default Author exists, if not, add them
  const authorExists = users.find((u) => u.email === DEFAULT_AUTHOR.email);
  if (!authorExists) {
    users.push(DEFAULT_AUTHOR);
  }

  // Save the updated array back to localStorage
  localStorage.setItem("users", JSON.stringify(users));
}

// Run the seeder immediately
seedDefaultAccounts();

// ============================================================
// 1. SIGNUP LOGIC
// ============================================================
const signupForm = document.getElementById("signup-form");

if (signupForm) {
  signupForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const username = document.getElementById("signup_username").value.trim();
    const email = document.getElementById("signup_email").value.trim();
    const password = document.getElementById("signup_password").value.trim();
    const role = document.getElementById("signup_role").value;

    if (!username || !email || !password) {
      Swal.fire("Error", "Please fill in all fields.", "error");
      return;
    }

    // Prevent using the Admin email (Admin is not in the user list)
    if (email === ADMIN.email) {
      Swal.fire("Error", "This email is reserved.", "error");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];

    // Check if email already exists (This will catch the seeded default accounts too!)
    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      Swal.fire("Error", "An account with this email already exists.", "error");
      return;
    }

    // Create new user
    const newUser = { username, email, password, role };
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    Swal.fire({
      title: "Account Created!",
      text: "You can now log in.",
      icon: "success",
    }).then(() => {
      window.location.href = "index.html";
    });
  });
}

// ============================================================
// 2. LOGIN LOGIC
// ============================================================
const loginForm = document.getElementById("login-form");

if (loginForm) {
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const email = document.getElementById("login_email").value.trim();
    const password = document.getElementById("login_password").value.trim();

    if (!email || !password) {
      Swal.fire("Error", "Please fill in all fields.", "error");
      return;
    }

    // --- A. CHECK ADMIN ---
    if (email === ADMIN.email && password === ADMIN.password) {
      sessionStorage.setItem("adminLoggedIn", "true");
      Swal.fire("Login Successful", "Welcome Admin!", "success").then(() => {
        window.location.href = ADMIN.redirect;
      });
      return;
    }

    // --- B. CHECK LOCALSTORAGE (Includes Defaults + New Users) ---
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const foundUser = users.find(
      (u) => u.email === email && u.password === password,
    );

    if (foundUser) {
      sessionStorage.setItem("currentUser", JSON.stringify(foundUser));

      let redirectUrl = "";
      if (foundUser.role === "reader") {
        sessionStorage.setItem("currentReader", JSON.stringify(foundUser));
        redirectUrl = "./user_html/home.html";
      } else if (foundUser.role === "author") {
        sessionStorage.setItem("currentAuthor", JSON.stringify(foundUser));
        redirectUrl = "./author_html/author_dashboard.html";
      }

      Swal.fire(
        "Login Successful",
        `Welcome ${foundUser.username}!`,
        "success",
      ).then(() => {
        window.location.href = redirectUrl;
      });
    } else {
      Swal.fire("Login Failed", "Incorrect email or password.", "error");
    }
  });
}

// ============================================================
// 3. PASSWORD TOGGLE
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".toggle-password").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      btn.classList.toggle("is-visible", isPassword);
    });
  });
});

// ============================================================
// 4. UNIFIED LOGOUT
// ============================================================
const logoutBtn = document.getElementById("logout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", function (e) {
    e.preventDefault();

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
        sessionStorage.removeItem("currentUser");
        sessionStorage.removeItem("currentReader");
        sessionStorage.removeItem("currentAuthor");
        sessionStorage.removeItem("adminLoggedIn");

        window.location.href = "../index.html";
      }
    });
  });
}
