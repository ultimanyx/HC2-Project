document.addEventListener("DOMContentLoaded", function () {
  var form = document.querySelector("form.login-form");
  if (!form) return;

  var role = form.getAttribute("data-role") || "reader";

  function el(id) {
    return document.getElementById(id);
  }
  function val(id) {
    var e = el(id);
    return e ? e.value.trim() : null;
  }
  function has(id) {
    return !!el(id);
  }

  // Where to send each role after signup / login
  var LOGIN_PAGES = {
    reader: "../user_html/user_login.html",
    author: "../author_html/author_login.html",
    admin: "../admin-html/admin_login.html", // adjust path if different
  };
  var HOME_PAGES = {
    reader: "../user_html/home.html",
    author: "../author_html/author_dashboard.html",
    admin: "../admin-html/admin.html", // adjust path if different
  };

  // Auto-detect: signup pages have a "{role}_username" field, login pages don't
  var mode = has(role + "_username") ? "signup" : "login";

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var email = val(role + "_email");
    var password = val(role + "_password");

    var users = JSON.parse(localStorage.getItem("users")) || [];

    // ---------- SIGNUP ----------
    if (mode === "signup") {
      var username = val(role + "_username");

      if (!username || !email || !password) {
        alert("Please fill in all required fields.");
        return;
      }

      for (var i = 0; i < users.length; i++) {
        if (users[i].email === email && users[i].role === role) {
          alert("Email already registered for this role!");
          return;
        }
      }

      var newUser = {
        role: role,
        username: username,
        email: email,
        password: password,
      };

      // role-specific extras — only saved if the field exists on the page
      if (has("author_name")) newUser.penName = val("author_name");
      if (has(role + "_number")) newUser.number = val(role + "_number");
      if (has(role + "_code")) newUser.code = val(role + "_code");

      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));

      alert("Account created!");
      window.location.href = LOGIN_PAGES[role] || LOGIN_PAGES.reader;
      return;
    }

    // ---------- LOGIN ----------
    var found = null;
    for (var j = 0; j < users.length; j++) {
      if (
        users[j].email === email &&
        users[j].password === password &&
        users[j].role === role
      ) {
        found = users[j];
        break;
      }
    }

    if (found) {
      localStorage.setItem("loggedIn", found.email);
      localStorage.setItem("role", found.role);

      setTimeout(function () {
        window.location.href = HOME_PAGES[role] || HOME_PAGES.reader;
      }, 800);
    } else {
      alert("Wrong email or password!");
    }
  });
});
