const reader_username = document.getElementById("reader_username").value;
const reader_email = document.getElementById("reader_email").value;
const reader_password = document.getElementById("reader_password").value;
const reader_number = document.getElementById("reader_number").value;

// ---------- SIGN UP PAGE ----------
const signupForm = document.getElementById("username"); // only exists on signup page

if (signupForm) {
  document
    .querySelector("form.login-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      // get existing users (or empty array)
      let users = JSON.parse(localStorage.getItem("users")) || [];

      // check if email already used
      for (let i = 0; i < users.length; i++) {
        if (users[i].email === reader_email) {
          alert("Email already registered!");
          return;
        }
      }

      // save new user
      users.push({
        username: reader_username,
        email: reader_email,
        password: reader_password,
        number: reader_number,
      });
      localStorage.setItem("users", JSON.stringify(users));

      alert("Account created!");
      window.location.href = "home.html";
    });
}

// ---------- LOGIN PAGE ----------
const loginForm = document.getElementById("reader_password"); // exists on both, so check for email-only page

if (loginForm && !document.getElementById("reader_username")) {
  document
    .querySelector("form.login-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      const email = document.getElementById("reader_email").value;
      const password = document.getElementById("reader_password").value;

      let users = JSON.parse(localStorage.getItem("users")) || [];
      let found = false;

      for (let i = 0; i < users.length; i++) {
        if (users[i].email === email && users[i].password === password) {
          found = true;
          break;
        }
      }

      if (found) {
        localStorage.setItem("loggedIn", email);
        window.location.href = "home.html";
      } else {
        alert("Wrong email or password!");
      }
    });
}
