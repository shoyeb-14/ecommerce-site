<?php
session_start();
require 'db.php';
$conn = getPDO(); 
if (!$conn) {
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

$headers = apache_request_headers();
$authHeader = $headers['Authorization'] ?? '';

if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    echo json_encode(["error" => "Authorization token missing or invalid"]);
    exit;
}

$accessToken = $matches[1];
$stmt = $conn->prepare("SELECT id FROM users WHERE access_token = ?");
$stmt->execute([$accessToken]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(["error" => "Invalid or expired token"]);
    exit;
}

$user_id = $user['id'];

// Get cart items
$cartQuery = $conn->prepare("SELECT c.product_id, p.price, c.quantity 
                             FROM cart c 
                             JOIN products p ON c.product_id = p.id 
                             WHERE c.user_id = ?");
$cartQuery->execute([$user_id]);
$cartItems = $cartQuery->fetchAll(PDO::FETCH_ASSOC);

if (!$cartItems || count($cartItems) === 0) {
    echo json_encode(["success" => false, "message" => "Cart is empty"]);
    exit;
}

// Fetch address_id
$addressQuery = $conn->prepare("SELECT id FROM address WHERE user_id = ? ORDER BY id DESC LIMIT 1");
$addressQuery->execute([$user_id]);
$address = $addressQuery->fetch(PDO::FETCH_ASSOC);

if (!$address) {
    echo json_encode(["success" => false, "message" => "Address not found. Please add an address before ordering."]);
    exit;
}

$address_id = $address['id'];

// Calculate total amount
$total_amount = 0;
foreach ($cartItems as $item) {
    $total_amount += $item['price'] * $item['quantity'];
}

// Insert into orders
$orderInsert = $conn->prepare("INSERT INTO orders (user_id, total_amount, order_date, status, address_id, payment_status)
                               VALUES (?, ?, NOW(), 'pending', ?, 'unpaid')");
$orderInsert->execute([$user_id, $total_amount, $address_id]);
$order_id = $conn->lastInsertId();

// Insert into order_items
$orderItemStmt = $conn->prepare("INSERT INTO order_items (order_id, product_id, quantity, price) 
                                 VALUES (?, ?, ?, ?)");
foreach ($cartItems as $item) {
    $orderItemStmt->execute([
        $order_id,
        $item['product_id'],
        $item['quantity'],
        $item['price']
    ]);
}

// Clear cart
// $clearCart = $conn->prepare("DELETE FROM cart WHERE user_id = ?");
// $clearCart->execute([$user_id]);

// Return order_id and amount
echo json_encode([
    "success" => true,
    "message" => "Order placed. Proceed to payment.",
    "order_id" => $order_id,
    "amount" => $total_amount
]);
