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
const DEFAULT_READERS = [
  {
    id: "u-001",
    username: "John Smith",
    email: "john@gmail.com",
    password: "john123",
    role: "reader",
    status: "active",
    joined: Date.now() - 30 * 86400000,
  },
];

const DEFAULT_AUTHOR = {
  id: "u-100",
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
  let modified = false;

  DEFAULT_READERS.forEach((reader) => {
    const existingIndex = users.findIndex((u) => u.id === reader.id);
    if (existingIndex === -1) {
      users.push(reader);
      modified = true;
    }
  });

  const authorIndex = users.findIndex((u) => u.id === DEFAULT_AUTHOR.id);
  if (authorIndex === -1) {
    users.push(DEFAULT_AUTHOR);
    modified = true;
  }

  if (modified) {
    localStorage.setItem("users", JSON.stringify(users));
  }
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
      // Block banned users from logging in
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

// ============================================================
// 3. PASSWORD TOGGLE LOGIC (FIXED)
// ============================================================
// Target the button using its class, not an ID
const togglePasswordBtn = document.querySelector(".toggle-password");

if (togglePasswordBtn) {
  togglePasswordBtn.addEventListener("click", function () {
    // Get the target input ID from the data-target attribute
    const targetId = this.getAttribute("data-target");
    const passwordInput = document.getElementById(targetId);

    if (!passwordInput) return;

    // Toggle the input type
    const type =
      passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);

    // Toggle the icons inside the button
    const iconShow = this.querySelector(".icon-show");
    const iconHide = this.querySelector(".icon-hide");

    if (type === "text") {
      // Password is visible
      if (iconShow) iconShow.style.display = "none";
      if (iconHide) iconHide.style.display = "block";
    } else {
      // Password is hidden
      if (iconShow) iconShow.style.display = "block";
      if (iconHide) iconHide.style.display = "none";
    }
  });
}

// ============================================================
// 4. LOGOUT LOGIC
// ============================================================
const logoutBtn = document.getElementById("logout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", function (e) {
    e.preventDefault();
    sessionStorage.removeItem("currentUser");
    sessionStorage.removeItem("currentReader");
    sessionStorage.removeItem("currentAuthor");
    sessionStorage.removeItem("adminLoggedIn");
    window.location.href = "../index.html";
  });
}
