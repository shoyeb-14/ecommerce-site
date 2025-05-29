$(document).ready(function () {
  $("#RegisterForm").submit(function (e) {
    e.preventDefault();

    const name = $("#name").val();
    const email = $("#email").val();
    const password = $("#password").val();

    $.ajax({
      url: "register.php",
      type: "POST",
      data: JSON.stringify({ name, email, password }),
      contentType: "application/json",
      dataType: "json",
      success: function (response) {
        console.log("Server Response:", response);
        if (response.success) {
          alert("User registered successfully!");
          window.location.href = "login.html";
        } else {
          alert("Error: " + response.message);
        }
      },
      error: function (xhr, status, error) {
        console.error("AJAX Error:", xhr.responseText);
        alert("Registration failed.");
      },
    });
  });
});
