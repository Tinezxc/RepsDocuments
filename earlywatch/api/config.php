<?php
declare(strict_types=1);

const DB_HOST = "127.0.0.1";
const DB_NAME = "earlywatch";
const DB_USER = "root";
const DB_PASS = "";

function db(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $dsn = sprintf("mysql:host=%s;dbname=%s;charset=utf8mb4", DB_HOST, DB_NAME);

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        header("Content-Type: application/json; charset=utf-8");
        echo json_encode([
            "error"   => "Database connection failed.",
            "details" => $e->getMessage()
        ]);
        exit;
    }

    return $pdo;
}