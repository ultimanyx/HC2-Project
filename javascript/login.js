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
  id: "u-001",
  username: "John Smith",
  email: "john@gmail.com",
  password: "john123",
  role: "reader",
  status: "active",
  joined: Date.now() - 30 * 86400000, // 30 days ago
};

const DEFAULT_AUTHOR = {
  id: "u-002",
  username: "Bram Stoker",
  email: "bramstoker@gmail.com",
  password: "bramstoker",
  role: "author",
  status: "active",
  joined: Date.now() - 45 * 86400000,
};

// ============================================================
// INITIALIZE / SEED DEFAULT ACCOUNTS
// ============================================================
function seedDefaultAccounts() {
  let users = JSON.parse(localStorage.getItem("users")) || [];

  // Seed Reader
  const readerExists = users.find((u) => u.email === DEFAULT_READER.email);
  if (!readerExists) {
    users.push(DEFAULT_READER);
  }

  // Seed Author
  const authorExists = users.find((u) => u.email === DEFAULT_AUTHOR.email);
  if (!authorExists) {
    users.push(DEFAULT_AUTHOR);
  }

  localStorage.setItem("users", JSON.stringify(users));
}

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

    if (email === ADMIN.email) {
      Swal.fire("Error", "This email is reserved.", "error");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      Swal.fire("Error", "An account with this email already exists.", "error");
      return;
    }

    // Create new user with ID, status, and joined date
    const newUser = {
      id: "u-" + Date.now(),
      username,
      email,
      password,
      role,
      status: "active",
      joined: Date.now(),
    };

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

    // --- B. CHECK LOCALSTORAGE ---
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const foundUser = users.find(
      (u) => u.email === email && u.password === password,
    );

    if (foundUser) {
      // ✅ Block banned users from logging in
      if (foundUser.status === "banned") {
        Swal.fire(
          "Account Banned",
          "Your account has been banned by an admin. Please contact support.",
          "error",
        );
        return;
      }

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

// ... (Keep Password Toggle & Logout logic as provided) ...
