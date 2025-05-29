<?php
session_start();
require 'db.php'; 

header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';

    if (empty($email) || empty($password)) {
        echo json_encode(['status' => 'error', 'message' => 'All fields are required']);
        exit;  
    }

    $pdo = getPDO();

    if (!$pdo) {
        echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM admin_users WHERE email = ?");
        $stmt->execute([$email]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($admin && password_verify($password, $admin['password'])) {
            $token = bin2hex(random_bytes(16));

            // NOTE: Column name is `id`, not `admin_id`
            $updateStmt = $pdo->prepare("UPDATE admin_users SET access_token = ? WHERE id = ?");
            $updateStmt->execute([$token, $admin['id']]);

            $_SESSION['admin_id'] = $admin['id'];
            $_SESSION['admin_username'] = $admin['username'];
            $_SESSION['admin_email'] = $admin['email'];
            $_SESSION['admin_token'] = $token;

            echo json_encode([
                'status' => 'success',
                'message' => 'Admin login successful',
                'access_token' => $token,
                'admin_id' => $admin['id'],
                'username' => $admin['username'],
                'email' => $admin['email']
            ]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Invalid credentials']);
        }
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
}
?>
