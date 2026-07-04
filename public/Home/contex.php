<?php
$dbServername = "localhost";
$dbUsername = "root"; 
$dbPassword = "";
$dbName = "log";

try {
    // 1. Initial connection without database name to ensure database exists
    $conn = new PDO("mysql:host=$dbServername", $dbUsername, $dbPassword);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Auto-create database
    $conn->exec("CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    
    // Select the database
    $conn->exec("USE `$dbName`");
    
    // Auto-create the users table if it does not exist
    $createTableSql = "
        CREATE TABLE IF NOT EXISTS `ourlog` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `fullname` VARCHAR(255) NULL,
            `user` VARCHAR(255) UNIQUE NOT NULL,
            `password` VARCHAR(255) NOT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;
    ";
    $conn->exec($createTableSql);
    
} catch(PDOException $e) {
    die("Database Connection failed: " . $e->getMessage());
}

// Check if email input exists
if (isset($_POST['email'])) {
    $action = isset($_POST['action']) ? $_POST['action'] : 'login';
    $email = trim($_POST['email']);
    $password = $_POST['password'];

    if ($action === 'signup') {
        $fullname = isset($_POST['fullname']) ? trim($_POST['fullname']) : '';
        $confirm_password = isset($_POST['confirm_password']) ? $_POST['confirm_password'] : '';

        // Validations
        if (empty($email) || empty($password)) {
            echo "Error: Email and Password are required fields.";
            exit();
        }
        if ($password !== $confirm_password) {
            echo "Error: Password confirmation does not match.";
            exit();
        }

        // Check if user already exists
        $checkStmt = $conn->prepare("SELECT id FROM ourlog WHERE user = :email LIMIT 1");
        $checkStmt->execute(['email' => $email]);
        if ($checkStmt->fetch()) {
            echo "Error: An account with this email already exists.";
            exit();
        }

        // Hash the password securely
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

        // Insert new user
        try {
            $insertStmt = $conn->prepare("INSERT INTO ourlog (fullname, user, password) VALUES (:fullname, :email, :password)");
            $insertStmt->execute([
                'fullname' => $fullname,
                'email' => $email,
                'password' => $hashedPassword
            ]);
            echo "Registration successful! You have successfully signed up. Please log in.";
            exit();
        } catch(PDOException $e) {
            echo "Error: Registration failed. " . $e->getMessage();
            exit();
        }

    } else {
        // Default behavior: Login check
        if (empty($email) || empty($password)) {
            echo "Error: Email and Password are required fields.";
            exit();
        }

        $stmt = $conn->prepare("SELECT * FROM ourlog WHERE user = :email LIMIT 1");
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            // Verify password
            if (password_verify($password, $user['password']) || $password === $user['password']) {
                echo "You Have Successfully logged in";
                exit();
            }
        }
        
        echo "You Have Entered Incorrect Password";
        exit();
    }
}
?>