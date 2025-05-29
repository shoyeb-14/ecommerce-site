<?php
include 'db.php';
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

$pdo = getPDO();
if (!$pdo) {
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

// Get token from Authorization header
$headers = apache_request_headers();
$authHeader = $headers['Authorization'] ?? '';

if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    echo json_encode(["error" => "Authorization token missing or invalid"]);
    exit;
}

$accessToken = $matches[1];

// Validate admin access token
$stmt = $pdo->prepare("SELECT id, username FROM admin_users WHERE access_token = ?");
$stmt->execute([$accessToken]);
$admin = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$admin) {
    echo json_encode(["error" => "Invalid admin token"]);
    exit;
}

$admin_id = $admin['id'];
$admin_username = $admin['username'];

// Handle actions
$action = $_GET['action'] ?? $_POST['action'] ?? null;

if ($action === 'fetchOrders') {
    try {
        $stmt = $pdo->prepare("
            SELECT
                o.id AS order_id,
                o.order_date,
                o.total_amount,
                o.status,
                u.name AS user_name,
                oi.id AS order_item_id,
                oi.product_id,
                oi.quantity,
                p.price AS item_price,
                p.name AS product_name,
                p.image_url
            FROM orders o
            JOIN users u ON o.user_id = u.id
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            ORDER BY o.order_date DESC
        ");
        $stmt->execute();
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $formattedOrders = [];
        foreach ($orders as $orderItem) {
            $orderId = $orderItem['order_id'];
            if (!isset($formattedOrders[$orderId])) {
                $formattedOrders[$orderId] = [
                    'order_id' => $orderId,
                    'order_date' => $orderItem['order_date'],
                    'user_name' => $orderItem['user_name'],
                    'total_amount' => $orderItem['total_amount'],
                    'status' => $orderItem['status'],
                    'items' => [],
                ];
            }
            $formattedOrders[$orderId]['items'][] = [
                'id' => $orderItem['order_item_id'],
                'product_id' => $orderItem['product_id'],
                'product_name' => $orderItem['product_name'],
                'image_url' => $orderItem['image_url'],
                'quantity' => $orderItem['quantity'],
                'item_price' => $orderItem['item_price'],
            ];
        }

        echo json_encode(array_values($formattedOrders));
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $e->getMessage()]);
    }

} elseif ($action === 'updateOrderStatus' && isset($_POST['order_id']) && isset($_POST['status'])) {
    $orderId = $_POST['order_id'];
    $newStatus = $_POST['status'];

    $allowedStatuses = ['Pending', 'Dispatched', 'Delivered', 'Cancelled'];
    if (!in_array($newStatus, $allowedStatuses)) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid order status"]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $stmt->execute([$newStatus, $orderId]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(["success" => true, "message" => "Order status updated to " . $newStatus]);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Order not found"]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $e->getMessage()]);
    }
}
// } elseif ($action === 'removeOrderItem' && isset($_POST['order_item_id'])) {
//     $orderItemId = $_POST['order_item_id'];

//     if (!is_numeric($orderItemId)) {
//         http_response_code(400);
//         echo json_encode(["error" => "Invalid order_item_id"]);
//         exit;
//     }
//     $orderItemId = (int)$orderItemId;

//     try {
//         $stmt = $pdo->prepare("DELETE FROM order_items WHERE id = ?");
//         $stmt->execute([$orderItemId]);

//         if ($stmt->rowCount() > 0) {
//             echo json_encode(["success" => true, "message" => "Order item removed"]);
//         } else {
//             http_response_code(404);
//             echo json_encode(["error" => "Order item not found"]);
//         }
//     } catch (PDOException $e) {
//         http_response_code(500);
//         echo json_encode(["error" => "Database error: " . $e->getMessage()]);
//     }
// }
  elseif ($action === 'removeOrder' && isset($_POST['order_id'])) {
    $orderId = $_POST['order_id'];

    if (!is_numeric($orderId)) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid order_id"]);
        exit;
    }
    $orderId = (int)$orderId;

    try {
        $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ?");
        $stmt->execute([$orderId]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(["success" => true, "message" => "Order item removed"]);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Order item not found"]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $e->getMessage()]);
    }

} elseif ($action === 'fetchUsers') {
    try {
        $stmt = $pdo->query("
            SELECT
                u.id AS user_id,
                u.name AS user_name,
                u.email AS user_email,
                COUNT(o.id) AS total_orders
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id
            GROUP BY u.id, u.name, u.email
            ORDER BY u.id ASC
        ");
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($users);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $e->getMessage()]);
    }
} elseif ($action === 'removeUser' && isset($_POST['user_id'])) {
    $userIdToRemove = $_POST['user_id'];

    if (!is_numeric($userIdToRemove)) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid user_id"]);
        exit;
    }
    $userIdToRemove = (int)$userIdToRemove;

    try {
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$userIdToRemove]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(["success" => true, "message" => "User removed successfully"]);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "User not found"]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $e->getMessage()]);
    }
} elseif ($action === 'fetchProducts') {
    try {
        $stmt = $pdo->query("
            SELECT
                id AS product_id,
                name AS product_name,
                category AS product_category,
                description AS product_description,
                price AS product_price,
                image_url AS product_img_url
            FROM products
            ORDER BY id DESC
        ");
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($products);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Database error fetching products: " . $e->getMessage()]);
    }
} elseif ($action === 'addProduct') {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $name = $_POST['name'] ?? '';
        $category = $_POST['category'] ?? '';
        $description = $_POST['description'] ?? '';
        $price = $_POST['price'] ?? '';
        $image_url = $_POST['image_url'] ?? '';

        if (empty($name) || empty($category) || empty($price) || !is_numeric($price)) {
            http_response_code(400);
            echo json_encode(["error" => "Missing or invalid product details"]);
            exit;
        }

        try {
            $stmt = $pdo->prepare("
                INSERT INTO products (name, category, description, price, image_url)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([$name, $category, $description, $price, $image_url]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(["success" => true, "message" => "Product added successfully"]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Failed to add product"]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Database error adding product: " . $e->getMessage()]);
        }
    } else {
        http_response_code(405); // Method Not Allowed
        echo json_encode(["error" => "Invalid request method"]);
    }
} elseif ($action === 'removeProduct' && isset($_POST['product_id'])) {
    $productIdToRemove = $_POST['product_id'];

    if (!is_numeric($productIdToRemove)) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid product_id"]);
        exit;
    }
    $productIdToRemove = (int)$productIdToRemove;

    try {
        $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
        $stmt->execute([$productIdToRemove]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(["success" => true, "message" => "Product removed successfully"]);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Product not found"]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Database error removing product: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["error" => "Invalid action"]);
}
?>