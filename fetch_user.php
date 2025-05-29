<?php
session_start();
header('Content-Type: application/json');

include 'db.php';

if (!isset($_SESSION['email'])) {
    echo json_encode(['name' => null]);
    exit;
}

$pdo = getPDO();
$stmt = $pdo->prepare("SELECT name FROM users WHERE email = :email LIMIT 1");
$stmt->execute(['email' => $_SESSION['email']]);
$user = $stmt->fetch();

echo json_encode(['name' => $user ? $user['name'] : null]);
