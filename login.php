<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

session_start();
require_once __DIR__ . "/db.php";

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    try {
        $pdo = getPDO();
        if (!$pdo) {
            echo json_encode(["success" => false, "message" => "Database connection failed"]);
            exit;
        }

        $email = $_POST['email'] ?? null;
        $password = $_POST['password'] ?? null;

        if (!$email || !$password) {
            echo json_encode(["success" => false, "message" => "Email or password missing"]);
            exit;
        }

        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($password, $user['password'])) {
            // Generate and store access token
            $accessToken = bin2hex(random_bytes(32)); // 64-character token
            $updateToken = $pdo->prepare("UPDATE users SET access_token = ? WHERE id = ?");
            $updateToken->execute([$accessToken, $user['id']]);

            // Save user info in session
            $_SESSION['user']['user_id'] = $user['id'];
            $_SESSION['user']['user_email'] = $user['email'];
            $_SESSION['user']['user_name'] = $user['name'];

            echo json_encode([
                "success" => true,
                "message" => "Login successful",
                "name" => $user['name'],
                "email" => $user['email'],
                "id" => $user['id'],
                "access_token" => $accessToken
            ]);
            exit;
        } else {
            echo json_encode(["success" => false, "message" => "Invalid email or password"]);
            exit;
        }
    } catch (Exception $e) {
        echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
        exit;
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
    exit;
}
?>
