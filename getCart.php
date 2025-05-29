<?php
include 'db.php';

header('Content-Type: application/json');

session_start();
$user_id = $_SESSION['user_email'] ?? null;

if (!$user_id) {
    echo json_encode([]);
    exit;
}

try {
    $pdo = getPDO();
    if (!$pdo) {
        echo json_encode(["error" => "Database connection failed"]);
        exit;
    }

    $stmt = $pdo->prepare("SELECT c.*, p.name, p.price, p.image_url FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_email = ?");
    $stmt->execute([$user_id]);
    $cart_items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($cart_items);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>