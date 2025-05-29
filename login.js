$(document).ready(function () {
    $("#loginForm").submit(function (e) {
        e.preventDefault();

        const email = $("#email").val().trim();
        const password = $("#password").val();
        const role = $("input[name='role']:checked").val(); 

        const url = role === "admin" ? "admin_login.php" : "login.php";

        $.ajax({
            url: url,
            type: "POST",
            data: { email, password },
            dataType: "json",
            success: function (response) {
                console.log("Server Response:", response);

                if ( response.success === true || 
                    response.success === "true" || 
                    response.status === "success") {

                    // Common: save access token
                    sessionStorage.setItem("accessToken", response.access_token || "");

                    if (role === "admin") {
                        sessionStorage.setItem("admin_id", response.admin_id || response.id);
                        sessionStorage.setItem("admin_email", response.email);
                        sessionStorage.setItem("admin_username", response.username);

                        Swal.fire({
                            icon: "success",
                            title: "Admin Login Successful",
                            text: "Redirecting to admin dashboard...",
                            timer: 1500,
                            showConfirmButton: false
                        }).then(() => {
                            console.log("About to redirect to admin_panel.html");
                            window.location.href = "admin_panel.html";
                        });
                    } else {
                        sessionStorage.setItem("user_id", response.id);
                        sessionStorage.setItem("user_email", response.email);
                        sessionStorage.setItem("user_name", response.name || response.username);

                        Swal.fire({
                            icon: "success",
                            title: "User Login Successful",
                            text: "Welcome back!",
                            timer: 1500,
                            showConfirmButton: false
                        }).then(() => {
                            window.location.href = "index.html";
                        });
                    }
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Login Failed",
                        text: response.message || "Invalid credentials"
                    });
                }
            },
            error: function (xhr, status, error) {
                console.error("AJAX Error:", {
                    status: status,
                    error: error,
                    responseText: xhr.responseText
                });
                Swal.fire({
                    icon: "error",
                    title: "Login Error",
                    text: "Something went wrong. Try again."
                });
            }
        });
    });
});
