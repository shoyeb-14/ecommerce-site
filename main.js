document.addEventListener("DOMContentLoaded", function () {
  updateCartCount();
  loadCartItems();
  setupAuthentication();
  
  if (window.location.pathname.includes("collection.html")) {
    loadCollectionPage();
  }
});

function setupAuthentication() {
  if (
    sessionStorage.getItem("accessToken") &&
    window.location.pathname.includes("login.html")
  ) {
    window.location.href = "index.html";
  }

  const logoutButton = document.getElementById("logoutbtn");
  if (logoutButton) {
    logoutButton.addEventListener("click", function () {
      sessionStorage.removeItem("accessToken");
      window.location.href = "login.html";
    });
  }
}

function loadCollectionPage() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");

  if (!category) {
    $("#product-container").html(
      "<p>Collection not found. Please select a category from the home page.</p>"
    );
    return;
  }

  let categoryTitle = "";
  switch (category) {
    case "mens":
      categoryTitle = "Men's Collection";
      break;
    case "womens":
      categoryTitle = "Women's Collection";
      break;
    case "jewelry":
      categoryTitle = "Jewelry Collection";
      break;
    default:
      categoryTitle = "Collection";
  }

  if ($("#collection-title").length) {
    $("#collection-title").text(categoryTitle);
  } else {
    $("h1").first().text(categoryTitle);
  }

  console.log("Fetching products for category:", category);

  $.ajax({
    url: "getProducts.php",
    method: "GET",
    headers: {
      "Authorization": "Bearer " + sessionStorage.getItem("accessToken")
    },
    data: { category: category },
    dataType: "json",
    success: function (data) {
      console.log("Products fetched:", data);
      if (data.error) {
        $("#product-container").html(`<p>${data.error}</p>`);
      } else {
        displayProducts(data);
      }
    },
    error: function (xhr, status, error) {
      console.error("Error fetching products:", {
        status: status,
        error: error,
        responseText: xhr.responseText,
      });
      $("#product-container").html(
        "<p>Error loading products. Please try again later.</p>"
      );
    },
  });
}

function displayProducts(products) {
  const container = $("#product-container");
  container.html("");

  $.ajax({
    url: "getCart.php",
    method: "GET",
    headers: {
      "Authorization": "Bearer " + sessionStorage.getItem("accessToken")
    },
    dataType: "json",
    success: function (cart) {
      console.log("main fetched:", cart);
      if (cart.error) {
        console.error("Cart error:", cart.error);
        cart = [];
      }

      products.forEach((product) => {
        const cartItem = cart.find((item) => item.product_id === product.id);
        // const quantity = cartItem ? cartItem.quantity : 0;

        const card = `
          <div class="col-md-4 mb-4">
            <div class="card h-100">
              <img src="${product.image_url}" class="card-img-top" alt="${
          product.name
        }" style="height: 400px; object-fit: cover;">
              <div class="card-body d-flex flex-column">
                <h5 class="card-title">${product.name}</h5>
                <p class="card-text">$${product.price}</p>
                <div id="cart-controls-${product.id}" class="mt-auto">
                  ${
                    product.quantity > 0
                      ? `<div class="d-flex align-items-center justify-content-start">
                      <button class="btn btn-sm btn-outline-secondary decrease-quantity" data-id="${product.id}">-</button>
                      <span class="mx-2">${product.quantity}</span>
                      <button class="btn btn-sm btn-outline-secondary increase-quantity" data-id="${product.id}">+</button>
                      <button class="btn btn-sm btn-danger remove-item mx-2" data-id="${product.id}">Remove</button>
                    </div>`
                      : `<button class="btn btn-primary w-100 add-to-cart" data-id="${product.id}">Add to Cart</button>`
                  }
                </div>
              </div>
            </div>
          </div>`;

        container.append(card);
      });

      $(".add-to-cart").click(addToCart);
      $(".increase-quantity").click(increaseQuantity);
      $(".decrease-quantity").click(decreaseQuantity);
      $(".remove-item").click(removeFromCart);
    },
    error: function (xhr) {
      console.error("Error fetching cart data:", xhr.responseText);
      displayProducts(products);
    },
  });
}

function addToCart(event) {
  const productId = $(event.target).data("id");
  console.log("Adding to cart, product ID:", productId);

  const accessToken = sessionStorage.getItem("accessToken");
  if (!accessToken) {
    Swal.fire({
      icon: "warning",
      title: "Not Logged In",
      text: "Please log in to add items to your cart.",
      showConfirmButton: true,
    });
    return;
  }

  $.ajax({
    url: "cart.php",
    method: "POST",
    headers: {
      "Authorization": "Bearer " + sessionStorage.getItem("accessToken"),
    },
    data: {
      product_id: productId,
      action: "add",
      timestamp: new Date().getTime(), 
    },
    dataType: "json",
    success: function (response) {
      console.log("Full add to cart response:", response);

      if (response.success) {
        Swal.fire({
          icon: "success",
          title: "Added to cart!",
          text: "Your product has been successfully added to the cart.",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          updateCartCount(); 
          loadCollectionPage(); 

        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to add!",
          text: response.error || response.message || "Failed to add to cart.",
          showConfirmButton: true,
        });
      }
    },
    error: function (xhr, status, error) {
      console.error("Error adding to cart:", {
        status: status,
        error: error,
        responseText: xhr.responseText,
      });

      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to add the product to the cart. Check console for details.",
        showConfirmButton: true,
      });
    },
  });
}

function increaseQuantity(event) {
  const productId = $(event.target).data("id");
  updateQuantity(productId, "increase");
}

function decreaseQuantity(event) {
  const productId = $(event.target).data("id");
  updateQuantity(productId, "decrease");
}

function updateQuantity(productId, action) {
  console.log("Updating quantity for product:", productId, "Action:", action);

  const accessToken = sessionStorage.getItem("accessToken");
  const headers = {};
  if (accessToken) {
    headers["Authorization"] = "Bearer " + accessToken;
  }

  $.ajax({
    url: "cart.php",
    method: "POST",
    headers: headers,
    data: {
      product_id: productId,
      action: action,
      timestamp: new Date().getTime(),
    },
    dataType: "json",
    success: function (response) {
      console.log("Quantity update response:", response);
      if (response.success) {
        updateCartCount();
        loadCollectionPage();
      } else {
        alert("Error: " + (response.error || "Failed to update quantity"));
      }
    },
    error: function (xhr, status, error) {
      console.error("Error updating quantity:", {
        status: status,
        error: error,
        responseText: xhr.responseText,
      });
      alert("Error updating quantity. Check console for details.");
    },
  });
}

function removeFromCart(event) {
  const productId = $(event.target).data("id");
  console.log("Removing from cart, product ID:", productId);

  $.ajax({
    url: "cart.php",
    method: "POST",
    data: { product_id: productId, action: "remove" },
    headers:{
      "Authorization":"Bearer "+ sessionStorage.getItem("accessToken")
    },

    dataType: "json",
    success: function (response) {
      console.log("Remove from cart response:", response);
      if (response.success) {
        updateCartCount();
        loadCollectionPage();
      } else {
        alert("Error: " + (response.error || "Failed to remove from cart"));
      }
    },
    error: function (xhr) {
      console.error("Error removing from cart:", xhr.responseText);
      alert("Error removing from cart: " + xhr.responseText);
    },
  });
}

function updateCartCount() {
  $.ajax({
    url: "cart.php",
    method: "GET",
    headers:{
      "Authorization":"Bearer "+ sessionStorage.getItem("accessToken")
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
function updateCartCount() {
    $.ajax({
      url: "cart.php",
      method: "GET",
      headers:{
        "Authorization":"Bearer "+sessionStorage.getItem("accessToken")
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

function loadCartItems() {
  $.ajax({
    url: "getCart.php",
    method: "GET",
    dataType: "json",
    success: function (cart) {
      console.log(cart)
      // console.log("Cart items loaded:", cart.data);
      if (cart.error) {
        $("#cart-container").html(
          "<p>Error loading cart: " + cart.error + "</p>"
        );
      } else {
        $("#cart-container").html(
          cart.length
            ? cart
                .map((item) => `<p>${item.name} - $${item.price}</p>`)
                .join("")
            : "<p>Your cart is empty.</p>"
        );
      }
    },
    error: function (xhr) {
      console.error("Error loading cart items:", xhr.responseText);
      $("#cart-container").html("<p>Error loading cart items.</p>");
    },
  });
}
