$(document).ready(function () {
    const token = sessionStorage.getItem("accessToken");
    const name = sessionStorage.getItem("user_name");
    const userId = sessionStorage.getItem("user_id"); // Assuming you store user_id in sessionStorage

    // Get total amount from URL param
    const urlParams = new URLSearchParams(window.location.search);
    const amount = parseInt(urlParams.get("amount")) || 0;
    $("#amountDisplay").text(amount);

    // Pay with Razorpay
    $("#payBtn").click(function () {
        if (!token || !name || !userId) { // Check for userId as well
            Swal.fire("Login Required", "Please login to continue.", "warning");
            return;
        }

        const options = {
            key: "rzp_test_YowYo1DiXATqYJ", // Replace with live key in production
            amount: amount * 100,
            currency: "INR",
            name: "Femme Wardrobe",
            description: "Order Payment",
            image: "http://localhost:8000/assets/LOGO.png",
            handler: function (response) {
                console.log("Razorpay Payment ID:", response.razorpay_payment_id);
                placeOrder(response.razorpay_payment_id);
            },
            theme: {
                color: "#e91e63"
            }
        };

        const rzp = new Razorpay(options);
        rzp.open();
    });

    // Function to place order and update payment
    function placeOrder(paymentId) {
        $.ajax({
            url: "place_order.php",
            type: "POST",
            headers: {
                "Authorization": "Bearer " + token
            },
            dataType: "json",
            success: function (res) {
                console.log("Order response:", res);
                if (res.success && res.order_id) {
                    updatePaymentStatus(res.order_id, paymentId, userId); // Pass userId here
                } else {
                    Swal.fire("Error", res.message || "Failed to place order.", "error");
                }
            },
            error: function (xhr, status, error) {
                console.error("Order placement error:", error);
                Swal.fire("Error", "Order placement failed due to server error.", "error");
            }
        });
    }

    function updatePaymentStatus(orderId, paymentId, userId) { // Receive userId here
        $.ajax({
            url: "update_payment.php",
            type: "POST",
            data: {
                order_id: orderId,
                payment_id: paymentId,
                user_id: userId // Send userId to the PHP script
            },
            dataType: "json",
            success: function (res) {
                console.log("Payment update response:", res);
                if (res.success) {
                    Swal.fire("Success", "Payment successful! Order confirmed.", "success").then(() => {
                        window.location.href = "index.html";
                    });
                } else {
                    Swal.fire("Payment Error", res.message || "Payment update failed.", "error");
                }
            },
            error: function (xhr, status, error) {
                console.error("Payment update error:", error);
                Swal.fire("Error", "Failed to update payment status.", "error");
            }
        });
    }
});