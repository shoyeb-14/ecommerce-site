<?php
include 'db.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);
$email = $data['email'] ?? '';
$passwordInput = $data['password'] ?? '';
$role = $data['role'] ?? 'user';

try {
    if ($role === 'admin') {
        $stmt = $pdo->prepare("SELECT * FROM admin_users WHERE email = ?");
        $stmt->execute([$email]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($admin && password_verify($passwordInput, $admin['password'])) {
            echo json_encode([
                "success" => true,
                "access_token" => $admin['access_token'],
                "admin_id" => $admin['admin_id']
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "Invalid admin credentials"]);
        }
    } else {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($passwordInput, $user['password'])) {
            echo json_encode([
                "success" => true,
                "access_token" => $user['access_token'],
                "name" => $user['name'],
                "user_email" => $user['email']
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "Invalid user credentials"]);
        }
    }
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
