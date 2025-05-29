<?php
include 'db.php';

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

// Validate access token
$stmt = $pdo->prepare("SELECT id FROM users WHERE access_token = ?");
$stmt->execute([$accessToken]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(["error" => "Invalid or expired token"]);
    exit;
}

$user_id = $user['id'];

// Get action and product_id
$action = $_GET['action'] ?? $_POST['action'] ?? null;
$product_id = $_POST['product_id'] ?? null;

try {
    $pdo->beginTransaction();

    if ($action === 'fetch') {
        // Fetch cart items along with product details
        $stmt = $pdo->prepare("
            SELECT c.*, p.name, p.price, p.image_url
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ?
        ");
        $stmt->execute([$user_id]);
        $cartItems = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Check if cart items exist
        if (empty($cartItems)) {
            echo json_encode(["error" => "Your cart is empty"]);
            exit;
        }

        echo json_encode($cartItems);

    } elseif ($action === 'add' && $product_id) {
        // Add product to cart
        $stmt = $pdo->prepare("SELECT id FROM products WHERE id = ?");
        $stmt->execute([$product_id]);
        if (!$stmt->fetch()) {
            throw new Exception("Product does not exist");
        }

        // Check if item is already in the cart
        $stmt = $pdo->prepare("
            UPDATE cart
            SET quantity = quantity + 1
            WHERE user_id = ? AND product_id = ?
        ");
        $stmt->execute([$user_id, $product_id]);

        if ($stmt->rowCount() === 0) {
            // Add new item to the cart if not present
            $stmt = $pdo->prepare("
                INSERT INTO cart (user_id, product_id, quantity)
                VALUES (?, ?, 1)
            ");
            $stmt->execute([$user_id, $product_id]);
        }

        echo json_encode(["success" => true, "message" => "Item added to cart", "product_id" => $product_id]);

    } elseif ($action === 'remove' && $product_id) {
        // Remove product from cart
        $stmt = $pdo->prepare("DELETE FROM cart WHERE user_id = ? AND product_id = ?");
        $stmt->execute([$user_id, $product_id]);
        echo json_encode(["success" => true]);

    } elseif ($action === 'increase' && $product_id) {
        // Increase quantity of a product in the cart
        $stmt = $pdo->prepare("UPDATE cart SET quantity = quantity + 1 WHERE user_id = ? AND product_id = ?");
        $stmt->execute([$user_id, $product_id]);
        echo json_encode(["success" => true]);

    } elseif ($action === 'decrease' && $product_id) {
        // Decrease quantity of a product in the cart
        $stmt = $pdo->prepare("UPDATE cart SET quantity = quantity - 1 WHERE user_id = ? AND product_id = ? AND quantity > 0");
        $stmt->execute([$user_id, $product_id]);

        // Remove item from cart if quantity is zero
        $stmt = $pdo->prepare("DELETE FROM cart WHERE user_id = ? AND product_id = ? AND quantity <= 0");
        $stmt->execute([$user_id, $product_id]);

        echo json_encode(["success" => true]);

    } elseif ($action === 'count') {
        // Get the number of unique products in the cart
        $stmt = $pdo->prepare("SELECT COUNT(DISTINCT product_id) FROM cart WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $count = $stmt->fetchColumn();
        echo json_encode((int)$count);

    } elseif ($action === 'checkout') {
        // Fetch cart items with price
        $stmt = $pdo->prepare("
            SELECT c.product_id, c.quantity, p.price
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ?
        ");
        $stmt->execute([$user_id]);
        $cartItems = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
        if (empty($cartItems)) {
            echo json_encode(["error" => "Your cart is empty"]);
            exit;
        }
    
        // Fetch address_id
        $addressQuery = $pdo->prepare("SELECT id FROM address WHERE user_id = ? ORDER BY id DESC LIMIT 1");
        $addressQuery->execute([$user_id]);
        $address = $addressQuery->fetch(PDO::FETCH_ASSOC);
    
        if (!$address) {
            echo json_encode(["success" => false, "message" => "Address not found. Please add an address before ordering."]);
            exit;
        }
    
        $address_id = $address['id'];
    
        // Calculate total
        $totalAmount = 0;
        foreach ($cartItems as $item) {
            if (!isset($item['price'])) {
                $pdo->rollBack();
                echo json_encode(["error" => "Missing product price. Checkout failed."]);
                exit;
            }
            $totalAmount += $item['price'] * $item['quantity'];
        }
    
        // Insert into orders
        $stmt = $pdo->prepare("INSERT INTO orders (user_id, total_amount, order_date, status, address_id, payment_status)
                               VALUES (?, ?, NOW(), 'pending', ?, 'unpaid')");
        $stmt->execute([$user_id, $totalAmount, $address_id]);
        $orderId = $pdo->lastInsertId();
    
        // Insert into order_items
        foreach ($cartItems as $item) {
            $stmt = $pdo->prepare("INSERT INTO order_items (order_id, product_id, quantity, price)
                                   VALUES (?, ?, ?, ?)");
            $stmt->execute([$orderId, $item['product_id'], $item['quantity'], $item['price']]);
        }
    
        // Clear cart
        // $stmt = $pdo->prepare("DELETE FROM cart WHERE user_id = ?");
        // $stmt->execute([$user_id]);
    
        echo json_encode([
            "success" => true,
            "message" => "Checkout complete",
            "order_id" => $orderId,
            "total_amount" => $totalAmount
        ]);
    } else {
        echo json_encode(["error" => "Invalid action or missing product_id"]);
    }

    $pdo->commit();

} catch (PDOException $e) {
    $pdo->rollBack();
    error_log("Database error: " . $e->getMessage());
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);

} catch (Exception $e) {
    $pdo->rollBack();
    error_log("Application error: " . $e->getMessage());
    echo json_encode(["error" => $e->getMessage()]);
}
?>