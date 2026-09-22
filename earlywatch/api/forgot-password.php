<?php
require_once __DIR__ . "/helpers.php";
require_method("POST");

$d = json_input();
$email = strtolower(trim((string)($d["email"] ?? "")));

if ($email === "" || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail("Please enter a valid email address.", 400);
}

$stmt = db()->prepare("SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1");
$stmt->execute([$email]);
$user = $stmt->fetch();

// Always respond OK to avoid leaking which emails exist.
if (!$user) {
    json_out(["ok" => true, "message" => "If that email exists, a reset link has been sent."]);
}

$token = bin2hex(random_bytes(32));
$expires = date("Y-m-d H:i:s", time() + 3600); // 1 hour

$pdo = db();
$pdo->prepare("DELETE FROM password_resets WHERE user_id = ?")->execute([$user["id"]]);
$pdo->prepare("INSERT INTO password_resets (user_id, token, expires_at) VALUES (?,?,?)")
    ->execute([$user["id"], $token, $expires]);

// In production, email this link. For demo, we return it in the JSON.
$resetLink = "reset-password.html?token=" . urlencode($token);

json_out([
    "ok" => true,
    "message" => "If that email exists, a reset link has been sent.",
    "demoResetLink" => $resetLink
]);