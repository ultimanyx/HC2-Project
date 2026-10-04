// Get the form on the page
const form = document.querySelector(".login-form");

if (form) {
  form.addEventListener("submit", function (event) {
    event.preventDefault(); // stop the page from reloading

    // Get the role from the form's data-role attribute
    const role = form.getAttribute("data-role"); // "author" or "reader"

    // If there is a username field, it's the signup form
    const usernameInput = document.getElementById(role + "_username");

    if (usernameInput) {
      signup(role);
    } else {
      login(role);
    }
  });
}

// -------------------- SIGNUP --------------------
function signup(role) {
  const usernameInput = document.getElementById(role + "_username");
  const emailInput = document.getElementById(role + "_email");
  const passwordInput = document.getElementById(role + "_password");
  const numberInput = document.getElementById(role + "_number");
  const authorNameInput = document.getElementById("author_name");

  // Read the values
  const username = usernameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const phoneNumber = numberInput.value.trim();

  let penName = "";
  if (authorNameInput) {
    penName = authorNameInput.value.trim();
  }

  // Check for empty fields
  if (username === "" || email === "" || password === "") {
    Swal.fire({
      title: "Please Fill all Form Fields",
      text: "All fields are required!",
      icon: "error",
    });
    return;
  }

  if (phoneNumber === "") {
    Swal.fire({
      title: "Please enter a phone number",
      text: "A phone number is required!",
      icon: "error",
    });
    return;
  }

  // Get users from localStorage (or empty array)
  const users = JSON.parse(localStorage.getItem("users")) || [];

  // Check if email already exists
  for (let i = 0; i < users.length; i++) {
    if (users[i].email === email && users[i].role === role) {
      Swal.fire({
        title: "Email Already Registered",
        text: "An account with this email already exists!",
        icon: "error",
      });
      return;
    }
  }

  // Check if phone number already exists
  for (let j = 0; j < users.length; j++) {
    let existingNumber;
    if (role === "reader") {
      existingNumber = users[j].readerNumber;
    } else {
      existingNumber = users[j].authorNumber;
    }

    if (existingNumber && existingNumber === phoneNumber) {
      Swal.fire({
        title: "Phone Number Already Registered",
        text: "An account with this phone number already exists!",
        icon: "error",
      });
      return;
    }
  }

  // Create the new user
  const newUser = {
    role: role,
    username: username,
    email: email,
    password: password,
  };

  if (role === "reader") {
    newUser.readerNumber = phoneNumber;
  } else if (role === "author") {
    newUser.authorNumber = phoneNumber;
  }

  if (penName !== "") {
    newUser.penName = penName;
  }

  // Save to localStorage
  users.push(newUser);
  localStorage.setItem("users", JSON.stringify(users));

  Swal.fire({
    title: "Account created!",
    icon: "success",
  }).then(function () {
    if (role === "reader") {
      window.location.href = "../user_html/user_login.html";
    } else if (role === "author") {
      window.location.href = "../author_html/author_login.html";
    }
  });
}

// -------------------- LOGIN --------------------
function login(role) {
  const emailInput = document.getElementById(role + "_email");
  const passwordInput = document.getElementById(role + "_password");

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (email === "" || password === "") {
    Swal.fire({
      title: "Please Fill all Form Fields",
      text: "Email and password are required!",
      icon: "error",
    });
    return;
  }

  const users = JSON.parse(localStorage.getItem("users")) || [];
  let foundUser = null;

  for (let i = 0; i < users.length; i++) {
    if (
      users[i].email === email &&
      users[i].password === password &&
      users[i].role === role
    ) {
      foundUser = users[i];
      break;
    }
  }

  if (foundUser) {
    Swal.fire({
      title: "Login successful!",
      icon: "success",
    }).then(function () {
      // Change these paths to your actual home pages
      if (role === "reader") {
        window.location.href = "../user_html/user_home.html";
      } else if (role === "author") {
        window.location.href = "../author_html/author_home.html";
      }
    });
  } else {
    Swal.fire({
      title: "Login Failed",
      text: "Wrong email or password!",
      icon: "error",
    });
  }
}
