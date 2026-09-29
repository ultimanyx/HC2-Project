document.addEventListener("DOMContentLoaded", function () {
  var form = document.querySelector("form.login-form");
  if (!form) return;

  var readerUser = document.getElementById("reader_username");
  var readerEmail = document.getElementById("reader_email");
  var readerPassword = document.getElementById("reader_password");
  var readerNumber = document.getElementById("reader_number");

  // If reader_username exists, we're on the signup page
  var isSignup = !!readerUser;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Read values NOW (when user clicks submit), not at page load
    var email = readerEmail.value.trim();
    var password = readerPassword.value;

    var users = JSON.parse(localStorage.getItem("users")) || [];

    // ---------- SIGNUP ----------
    if (isSignup) {
      var username = readerUser.value.trim();
      var number = readerNumber.value.trim();

      // check duplicate email
      for (var i = 0; i < users.length; i++) {
        if (users[i].email === email) {
          alert("Email already registered!");
          return;
        }
      }

      users.push({
        username: username,
        email: email,
        password: password,
        number: number,
      });
      localStorage.setItem("users", JSON.stringify(users));

      alert("Account created!");
      window.location.href = "/user_html/user_login.html";
      return;
    }

    // ---------- LOGIN ----------
    var found = false;
    for (var j = 0; j < users.length; j++) {
      if (users[j].email === email && users[j].password === password) {
        found = true;
        break;
      }
    }

    if (found) {
      localStorage.setItem("loggedIn", email);
      setTimeout(() => {
        window.location.href = "/user_html/home.html";
      }, 800);
    } else {
      alert("Wrong email or password!");
    }
  });
});
