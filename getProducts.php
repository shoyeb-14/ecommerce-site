<?php
include 'db.php';
header('Content-Type: application/json');

function getUserIdFromToken($token) {
    $pdo = getPDO();
    $sql = "SELECT id FROM users WHERE access_token = :token LIMIT 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':token' => $token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        return $user['id'];
    } else {
        return null; 
    }
}


try {
    $pdo = getPDO();
    if (!$pdo) {
        echo json_encode(["error" => "Database connection failed"]);
        exit;
    }

    // Token se user_id lo
    $headers = apache_request_headers();
    $token = str_replace("Bearer ", "", $headers['Authorization'] ?? '');
    if (!$token) {
        echo json_encode(["error" => "Authorization token required"]);
        exit;
    }
    $user_id = getUserIdFromToken($token);
    if (!$user_id) {
        echo json_encode(["error" => "Invalid or missing user_id from token"]);
        exit;
    }

    // Category logic
    $category = isset($_GET['category']) ? $_GET['category'] : null;
    $categoryMappings = [
        'mens' => 'Men',
        'womens' => 'Women',
        'jewelry' => 'Jewelry'
    ];
    $dbCategory = $category ? ($categoryMappings[$category] ?? null) : null;

    
    $sql = "
        SELECT 
            p.*, 
            COALESCE(c.quantity, 0) AS quantity 
        FROM products p 
        LEFT JOIN cart c ON p.id = c.product_id AND c.user_id = :user_id";
    $params = [':user_id' => $user_id];

    if ($dbCategory) {
        $sql .= " WHERE p.category = :category";
        $params[':category'] = $dbCategory;
    } else if ($category) {
        echo json_encode(["error" => "Invalid category specified"]);
        exit;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($products)) {
        echo json_encode([
            "error" => "No products found" . ($dbCategory ? " in this category" : "")
        ]);
    } else {
        echo json_encode($products);
    }
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>