<?php
include 'db.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['user_id']) && isset($data['product_id'])) {
    $user_id = intval($data['user_id']);
    $product_id = intval($data['product_id']);

    try {
        $stmt = $pdo->prepare("INSERT INTO cart (user_id, product_id) VALUES (?, ?)");
        $stmt->execute([$user_id, $product_id]);
        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        echo json_encode(["error" => $e->getMessage()]);
    }
} else {
    echo json_encode(["error" => "User ID and Product ID are required"]);
}
?>
