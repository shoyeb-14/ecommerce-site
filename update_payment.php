<?php
require 'db.php';

header('Content-Type: application/json');

// Get data from POST request
$order_id = isset($_POST['order_id']) ? $_POST['order_id'] : null;
$payment_id = isset($_POST['payment_id']) ? $_POST['payment_id'] : null;
$user_id = isset($_POST['user_id']) ? $_POST['user_id'] : null;

// Check if required parameters are present
if (!$order_id || !$payment_id || !$user_id) {
    echo json_encode(["success" => false, "message" => "Invalid input: Missing order_id, payment_id, or user_id"]);
    exit;
}

try {
    // Get PDO connection from db.php
    $pdo = getPDO();
    if (!$pdo) {
        echo json_encode(["success" => false, "message" => "Database connection failed"]);
        exit;
    }

    // Begin a transaction
    $pdo->beginTransaction();

    // Prepare and execute the update query for the orders table
    $stmt_update_order = $pdo->prepare("UPDATE orders SET payment_id = :payment_id, payment_status = 'paid', status = 'confirmed' WHERE id = :order_id");
    $stmt_update_order->bindParam(':payment_id', $payment_id, PDO::PARAM_STR);
    $stmt_update_order->bindParam(':order_id', $order_id, PDO::PARAM_INT);

    if (!$stmt_update_order->execute()) {
        throw new Exception("Failed to update order: " . implode(" ", $stmt_update_order->errorInfo()));
    }

    // Prepare and execute the query to clear the cart
    $stmt_clear_cart = $pdo->prepare("DELETE FROM cart WHERE user_id = :user_id");
    $stmt_clear_cart->bindParam(':user_id', $user_id, PDO::PARAM_INT);

    if (!$stmt_clear_cart->execute()) {
        throw new Exception("Failed to clear cart: " . implode(" ", $stmt_clear_cart->errorInfo()));
    }

    // Commit the transaction
    $pdo->commit();

    echo json_encode(["success" => true, "message" => "Payment updated and cart cleared"]);

} catch (PDOException $e) {
    // Rollback the transaction in case of database error
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);

} catch (Exception $e) {
    // Rollback the transaction in case of other errors
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
} finally {
    // Close the database connection (if your getPDO function doesn't handle this)
    $pdo = null;
}
?>