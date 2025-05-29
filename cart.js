$(document).ready(function () {
  loadCartItems();
  updateCartCount();

  $("#checkout").click(() => showCheckoutModal());
});

// Load cart items
function loadCartItems() {
  $.ajax({
    url: "cart.php?action=fetch",
    method: "GET",
    headers: {
      Authorization: "Bearer " + sessionStorage.getItem("accessToken"),
    },
    success: function (cart) {
      const cartContainer = $("#cart-container");
      const totalAmountContainer = $("#total-amount");

      if (cart.error) {
        cartContainer.html(`<p>${cart.error}</p>`);
        totalAmountContainer.text("$0.00");
        updateCartCount();
        return;
      }

      if (!cart || cart.length === 0) {
        cartContainer.html("<p>Your cart is empty.</p>");
        totalAmountContainer.text("$0.00");
        updateCartCount();
        return;
      }

      cartContainer.html("");
      let totalAmount = 0;

      cart.forEach((item) => {
        totalAmount += item.price * item.quantity;

        cartContainer.append(`
                        <div class="card mb-3">
                            <div class="card-body d-flex justify-content-between align-items-center bg-dark text-light">
                                <img src="${item.image_url}" width="50" height="50" class="me-3">
                                <div class="flex-grow-1">
                                    <h5 class="card-title">${item.name}</h5>
                                    <p class="card-text">Price: $${item.price}</p>
                                    <div class="d-flex align-items-center">
                                        <button class="btn btn-sm btn-outline-secondary" onclick="handleCartAction('decrease', ${item.product_id})">-</button>
                                        <span class="mx-2">${item.quantity}</span>
                                        <button class="btn btn-sm btn-outline-secondary" onclick="handleCartAction('increase', ${item.product_id})">+</button>
                                    </div>
                                </div>
                                <button class="btn btn-sm btn-danger" onclick="handleCartAction('remove', ${item.product_id})">Remove</button>
                            </div>
                        </div>
                    `);
      });

      totalAmountContainer.text(`$${totalAmount.toFixed(2)}`);
      updateCartCount();
    },
    error: function (xhr) {
      console.error("Error fetching cart items:", xhr.responseText);
      $("#cart-container").html("<p>Error loading cart items.</p>");
    },
  });
}

// Show checkout modal
function showCheckoutModal() {
  $.ajax({
    url: "cart.php?action=fetch",
    method: "GET",
    headers: {
      Authorization: "Bearer " + sessionStorage.getItem("accessToken"),
    },
    success: function (cart) {
      const modalCartItems = $("#modal-cart-items");
      const modalTotalAmount = $("#modal-total-amount");

      if (cart.error) {
        modalCartItems.html(`<p>${cart.error}</p>`);
        modalTotalAmount.text("$0.00");
        $("#checkoutModal").modal("show");
        return;
      }

      if (!cart || cart.length === 0) {
        modalCartItems.html("<p>Your cart is empty.</p>");
        modalTotalAmount.text("$0.00");
      } else {
        modalCartItems.html("");
        let totalAmount = 0;

        cart.forEach((item) => {
          totalAmount += item.price * item.quantity;
          modalCartItems.append(`
                            <div class="card mb-2">
                                <div class="card-body d-flex justify-content-between align-items-center">
                                    <div class="d-flex align-items-center">
                                        <img src="${
                                          item.image_url
                                        }" width="40" height="40" class="me-2">
                                        <div>
                                            <h6>${item.name}</h6>
                                            <p class="mb-0">$${item.price} x ${
            item.quantity
          } = $${(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `);
        });

        modalTotalAmount.text(`$${totalAmount.toFixed(2)}`);
      }

      $("#checkoutModal").modal("show");
    },
    error: function (xhr) {
      console.error("Error fetching cart items for modal:", xhr.responseText);
      $("#modal-cart-items").html("<p>Error loading cart items.</p>");
      $("#modal-total-amount").text("$0.00");
      $("#checkoutModal").modal("show");
    },
  });
}

// Handle cart actions
function handleCartAction(action, productId = null) {
  console.log("Handling cart action:", action, "Product ID:", productId);

  // Check if the user is logged in
  if (
    !sessionStorage.getItem("user_email") ||
    !sessionStorage.getItem("user_name")
  ) {
    // User is not logged in, show SweetAlert
    Swal.fire({
      title: "Login Required",
      text: "You need to log in to perform this action.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Login",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        // Redirect to login page
        window.location.href = "login.html";
      }
    });
    return; // Exit the function early
  }

  const accessToken = sessionStorage.getItem("accessToken");
  const headers = accessToken ? { Authorization: "Bearer " + accessToken } : {};

  $.ajax({
    url: "cart.php",
    method: "POST",
    headers: {
      Authorization: "Bearer " + sessionStorage.getItem("accessToken"),
    },
    data: { action, product_id: productId },
    dataType: "json",
    success: function (response) {
      console.log("Cart action response:", response);
      let amount =$("#modal-total-amount").text().slice($("#modal-total-amount").text().indexOf("$")+1,) 
  
      if (response.success || response.message === "Checkout complete") {
        if (action === "checkout") {
          $("#checkoutModal").modal("hide");
            window.location.href = `payment.html?amount=${amount}`;
            loadCartItems();
            updateCartCount();
        } else {
          loadCartItems();
          updateCartCount();
        }
      } else {
        alert("Error: " + (response.error || "Failed to update cart"));
      }
    },
    error: function (xhr) {
      console.error("Error updating cart:", xhr.responseText);
      alert("Failed to update cart: " + xhr.responseText);
    },
  });
}

// Update cart count
function updateCartCount() {
  $.ajax({
    url: "cart.php",
    method: "GET",
    headers: {
      Authorization: "Bearer " + sessionStorage.getItem("accessToken"),
    },
    data: { action: "count" },
    dataType: "json",
    success: function (count) {
      console.log("Cart count updated:", count);
      $(".cart-count").text(count);
    },
    error: function (xhr) {
      console.error("Error updating cart count:", xhr.responseText);
      $(".cart-count").text("0");
    },
  });
}

// Handle place order button click
$(document).ready(function () {
  $("#place-order").click(function () {
    handleCartAction("checkout");
  });
});
