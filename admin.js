$(document).ready(function () {
    const token = sessionStorage.getItem("accessToken");
    const adminName = sessionStorage.getItem("admin_username");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    $("#adminName").text(adminName || "Admin");

    $("#logoutBtnHeader").click(function () {
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("admin_id");
        sessionStorage.removeItem("admin_username");
        sessionStorage.removeItem("admin_email");
        window.location.href = "login.html";
    });

    // Function to show a specific content section and hide others
    function showContent(sectionId) {
        $(".content-section").hide();
        $("#" + sectionId).show();
        $(".sidebar .nav-link").removeClass("active");
        $("#" + sectionId.replace("Section", "Link")).addClass("active");
    }

    // Default load dashboard
    showContent("dashboardOverview");
    $("#dashboardLink").addClass("active");

    // Navigation actions
    $("#dashboardLink").click(function (e) {
        e.preventDefault();
        showContent("dashboardOverview");
    });

    $("#ordersLink").click(function (e) {
        e.preventDefault();
        showContent("ordersSection");
        loadOrders();
    });

    $("#productsLink").click(function (e) {
        e.preventDefault();
        showContent("productsSection");
        loadProducts(); // Load products when Products link is clicked
    });

    // $("#categoriesLink").click(function (e) {
    //     e.preventDefault();
    //     showContent("categoriesSection");
    // });

    $("#usersLink").click(function (e) {
        e.preventDefault();
        showContent("usersSection");
        loadUsers();
    });

    // -------------------- Orders Management Functions --------------------

    function loadOrders() {
        const token = sessionStorage.getItem("accessToken");
        if (!token) {
            window.location.href = "login.html";
            return;
        }

        $("#ordersSection").html('<h3>Manage Orders</h3><p>Loading orders...</p>');

        $.ajax({
            url: 'manage_orders.php?action=fetchOrders',
            type: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            dataType: 'json',
            success: function (data) {
                if (data.error) {
                    $("#ordersSection").html(`<div class="alert alert-danger">${data.error}</div>`);
                    return;
                }

                let ordersTable = `
                    <h3>Manage Orders</h3>
                    <div class="table-responsive">
                        <table class="table table-striped table-bordered">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Username</th>
                                    <th>Products</th>
                                    <th>Total Price</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                $.each(data, function (index, order) {
                    let productList = '';
                    let orderTotalPrice = 0;
                    $.each(order.items, function (i, item) {
                        const itemPrice = parseFloat(item.item_price);
                        const formattedPrice = isNaN(itemPrice) ? 0 : itemPrice.toFixed(2);

                        productList += `
                            <div class="d-flex align-items-center mb-2">
                                <img src="${item.image_url}" alt="${item.product_name}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px;">
                                <div>
                                    <h6 class="mb-0">${item.product_name}</h6>
                                    <small>Price: ₹${formattedPrice} x ${item.quantity}</small>
                                </div>
                                
                            </div>
                        `;
                        orderTotalPrice += itemPrice * item.quantity;
                    });

                    ordersTable += `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${order.user_name}</td>
                            <td>${productList}</td>
                            <td>₹${orderTotalPrice.toFixed(2)}</td>
                            <td>
                                <select class="form-select form-select-sm order-status-dropdown" data-order-id="${order.order_id}">
                                    <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                                    <option value="Dispatched" ${order.status === 'Dispatched' ? 'selected' : ''}>Dispatched</option>
                                    <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                                    <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                                </select>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-danger remove-order-btn" data-order-id="${order.order_id}">
                                    <i class="fas fa-trash-alt"></i> Remove Order
                                </button>
                            </td>
                        </tr>
                    `;
                });

                ordersTable += `
                            </tbody>
                        </table>
                    </div>
                `;
                $("#ordersSection").html(ordersTable);

                $("#ordersSection").on('change', '.order-status-dropdown', function () {
                    const orderId = $(this).data('order-id');
                    const newStatus = $(this).val();
                    updateOrderStatus(orderId, newStatus);
                });

                // $("#ordersSection").on('click', '.remove-item-btn', function () {
                //     const orderItemId = $(this).data('id');
                //     Swal.fire({
                //         title: 'Are you sure?',
                //         text: 'Do you want to remove this item from the order?',
                //         icon: 'warning',
                //         showCancelButton: true,
                //         confirmButtonColor: '#3085d6',
                //         cancelButtonColor: '#d33',
                //         confirmButtonText: 'Yes, remove it!'
                //     }).then((result) => {
                //         if (result.isConfirmed) {
                //             removeOrderItem(orderItemId);
                //         }
                //     });
                // });

                $("#ordersSection").on('click', '.remove-order-btn', function () {
                    const orderId = $(this).data('order-id');
                    Swal.fire({
                        title: 'Are you sure?',
                        text: 'Do you want to remove this entire order?',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Yes, remove it!'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            removeOrder(orderId);
                        }
                    });
                });
            },
            error: function (xhr, status, error) {
                $("#ordersSection").html(`<div class="alert alert-danger">Error loading orders: ${xhr.responseText}</div>`);
            }
        });
    }

    function updateOrderStatus(orderId, status) {
        const token = sessionStorage.getItem("accessToken");
        if (!token) {
            window.location.href = "login.html";
            return;
        }

        $.ajax({
            url: 'manage_orders.php',
            type: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            dataType: 'json',
            data: {
                action: 'updateOrderStatus',
                order_id: orderId,
                status: status
            },
            success: function (data) {
                if (data.error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.error,
                    });
                } else {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: data.message,
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        loadOrders();
                    });
                }
            },
            error: function (xhr, status, error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: `Failed to update order status: ${xhr.responseText}`,
                });
            }
        });
    }

    // function removeOrderItem(orderItemId) {
    //     const token = sessionStorage.getItem("accessToken");
    //     if (!token) {
    //         window.location.href = "login.html";
    //         return;
    //     }

    //     $.ajax({
    //         url: 'manage_orders.php',
    //         type: 'POST',
    //         headers: {
    //             'Authorization': 'Bearer ' + token
    //         },
    //         dataType: 'json',
    //         data: {
    //             action: 'removeOrderItem',
    //             order_item_id: orderItemId
    //         },
    //         success: function (data) {
    //             if (data.error) {
    //                 Swal.fire({
    //                     icon: 'error',
    //                     title: 'Error',
    //                     text: data.error,
    //                 });
    //             } else {
    //                 Swal.fire({
    //                     icon: 'success',
    //                     title: 'Success',
    //                     text: data.message,
    //                     timer: 1500,
    //                     showConfirmButton: false
    //                 }).then(() => {
    //                     loadOrders();
    //                 });
    //             }
    //         },
    //         error: function (xhr, status, error) {
    //             Swal.fire({
    //                 icon: 'error',
    //                 title: 'Error',
    //                 text: `Failed to remove order item: ${xhr.responseText}`,
    //             });
    //         }
    //     });
    // }

    function removeOrder(orderId) {
        const token = sessionStorage.getItem("accessToken");
        if (!token) {
            window.location.href = "login.html";
            return;
        }

        $.ajax({
            url: 'manage_orders.php',
            type: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            dataType: 'json',
            data: {
                action: 'removeOrder',
                order_id: orderId
            },
            success: function (data) {
                if (data.error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.error,
                    });
                } else {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: data.message,
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        loadOrders();
                    });
                }
            },
            error: function (xhr, status, error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: `Failed to remove order: ${xhr.responseText}`,
                });
            }
        });
    }

    // -------------------- Users Management Functions --------------------

    function loadUsers() {
        const token = sessionStorage.getItem("accessToken");
        if (!token) {
            window.location.href = "login.html";
            return;
        }

        $("#usersSection").html('<h3>Manage Users</h3><p>Loading users...</p>');

        $.ajax({
            url: 'manage_orders.php?action=fetchUsers',
            type: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            dataType: 'json',
            success: function (data) {
                if (data.error) {
                    $("#usersSection").html(`<div class="alert alert-danger">${data.error}</div>`);
                    return;
                }

                let usersTable = `
                    <h3>Manage Users</h3>
                    <div class="table-responsive">
                        <table class="table table-striped table-bordered">
                            <thead>
                                <tr>
                                    <th>User ID</th>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Total Orders</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                $.each(data, function (index, user) {
                    usersTable += `
                        <tr>
                            <td>${user.user_id}</td>
                            <td>${user.user_name}</td>
                            <td>${user.user_email}</td>
                            <td>${user.total_orders}</td>
                            <td>
                                <button class="btn btn-sm btn-danger remove-user-btn" data-user-id="${user.user_id}">
                                    <i class="fas fa-trash-alt"></i> Remove
                                </button>
                            </td>
                        </tr>
                    `;
                });

                usersTable += `
                            </tbody>
                        </table>
                    </div>
                `;
                $("#usersSection").html(usersTable);

                $("#usersSection").on('click', '.remove-user-btn', function () {
                    const userIdToRemove = $(this).data('user-id');
                    Swal.fire({
                        title: 'Are you sure?',
                        text: 'Do you want to remove this user?',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Yes, remove it!'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            removeUser(userIdToRemove);
                        }
                    });
                });
            },
            error: function (xhr, status, error) {
                $("#usersSection").html(`<div class="alert alert-danger">Error loading users: ${xhr.responseText}</div>`);
            }
        });
    }

    function removeUser(userId) {
        const token = sessionStorage.getItem("accessToken");
        if (!token) {
            window.location.href = "login.html";
            return;
        }

        $.ajax({
            url: 'manage_orders.php',
            type: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            dataType: 'json',
            data: {
                action: 'removeUser',
                user_id: userId
            },
            success: function (data) {
                if (data.error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.error,
                    });
                } else {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: data.message,
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        loadUsers();
                    });
                }
            },
            error: function (xhr, status, error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: `Error removing user: ${xhr.responseText}`,
                });
            }
        });
    }

    // -------------------- Products Management Functions --------------------

    function loadProducts() {
        const token = sessionStorage.getItem("accessToken");
        if (!token) {
            window.location.href = "login.html";
            return;
        }

        $("#productsSection").html('<h3>Manage Products</h3><p>Loading products...</p>');

        $.ajax({
            url: 'manage_orders.php?action=fetchProducts',
            type: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            dataType: 'json',
            success: function (data) {
                if (data.error) {
                    $("#productsSection").html(`<div class="alert alert-danger">${data.error}</div>`);
                    return;
                }

                let productsContent = `
                    <h3>Manage Products</h3>
                    <button class="btn btn-primary mb-3" id="addProductBtn"><i class="fa-solid fa-shirt"></i> Add New Product</button>
                    <div class="table-responsive">
                        <table class="table table-striped table-bordered">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th>Price</th>
                                    <th>Image</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                $.each(data, function (index, product) {
                    productsContent += `
                        <tr>
                            <td>${product.product_id}</td>
                            <td>${product.product_name}</td>
                            <td>${product.product_category}</td>
                            <td>${product.product_description || 'N/A'}</td>
                            <td>₹${parseFloat(product.product_price).toFixed(2)}</td>
                            <td><img src="${product.product_img_url}" alt="${product.product_name}" style="width: 50px; height: 50px; object-fit: cover;"></td>
                            <td>
                                <button class="btn btn-sm btn-danger remove-product-btn" data-product-id="${product.product_id}">
                                    <i class="fas fa-trash-alt"></i> Remove
                                </button>
                            </td>
                        </tr>
                    `;
                });

                productsContent += `
                            </tbody>
                        </table>
                    </div>
                `;
                $("#productsSection").html(productsContent);

                // Add product button click handler
                $("#addProductBtn").click(function () {
                    Swal.fire({
                        title: '<i class="fas fa-box me-2"></i>Add New Product',
                        html: `
                            <input type="text" id="productName" class="swal2-input" placeholder="Product Name" required>
                            <input type="text" id="productCategory" class="swal2-input" placeholder="Category" required>
                            <textarea id="productDescription" class="swal2-textarea" placeholder="Description (optional)"></textarea>
                            <input type="number" id="productPrice" class="swal2-input" placeholder="Price" step="0.01" required>
                            <input type="text" id="productImgUrl" class="swal2-input" placeholder="Image URL" required>
                        `,
                        focusConfirm: false,
                        showCancelButton: true,
                        confirmButtonText: 'Add Product',
                        preConfirm: () => {
                            const name = $("#productName").val();
                            const category = $("#productCategory").val();
                            const description = $("#productDescription").val();
                            const price = $("#productPrice").val();
                            const image_url = $("#productImgUrl").val();

                            if (!name || !category || !price || !image_url) {
                                Swal.showValidationMessage('Please fill in all required fields');
                                return false;
                            }
                            if (isNaN(price) || price <= 0) {
                                Swal.showValidationMessage('Price must be a valid positive number');
                                return false;
                            }

                            return { name, category, description, price, image_url };
                        }
                    }).then((result) => {
                        if (result.isConfirmed) {
                            addProduct(result.value);
                        }
                    });
                });

                // Remove product button click handler
                $("#productsSection").on('click', '.remove-product-btn', function () {
                    const productId = $(this).data('product-id');
                    Swal.fire({
                        title: 'Are you sure?',
                        text: 'Do you want to remove this product?',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Yes, remove it!'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            removeProduct(productId);
                        }
                    });
                });
            },
            error: function (xhr, status, error) {
                $("#productsSection").html(`<div class="alert alert-danger">Error loading products: ${xhr.responseText}</div>`);
            }
        });
    }

    function addProduct(productData) {
        const token = sessionStorage.getItem("accessToken");
        if (!token) {
            window.location.href = "login.html";
            return;
        }

        $.ajax({
            url: 'manage_orders.php',
            type: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            dataType: 'json',
            data: {
                action: 'addProduct',
                name: productData.name,
                category: productData.category,
                description: productData.description,
                price: productData.price,
                image_url: productData.image_url
            },
            success: function (data) {
                if (data.error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.error,
                    });
                } else {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: data.message,
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        loadProducts();
                    });
                }
            },
            error: function (xhr, status, error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: `Failed to add product: ${xhr.responseText}`,
                });
            }
        });
    }

    function removeProduct(productId) {
        const token = sessionStorage.getItem("accessToken");
        if (!token) {
            window.location.href = "login.html";
            return;
        }

        $.ajax({
            url: 'manage_orders.php',
            type: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            dataType: 'json',
            data: {
                action: 'removeProduct',
                product_id: productId
            },
            success: function (data) {
                if (data.error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.error,
                    });
                } else {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: data.message,
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        loadProducts();
                    });
                }
            },
            error: function (xhr, status, error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: `Failed to remove product: ${xhr.responseText}`,
                });
            }
        });
    }
    

    // Initially hide sections
    $("#ordersSection").hide();
    $("#usersSection").hide();
    $("#productsSection").hide();
});