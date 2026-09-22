<?php
require_once __DIR__ . "/helpers.php";
require_method("POST");

$d = json_input();
$token    = trim((string)($d["token"] ?? ""));
$password = (string)($d["password"] ?? "");

if ($token === "") fail("Missing reset token.", 400);

$errs = validate_password_strength($password);
if ($errs) fail_many($errs, 400);

$pdo = db();
$stmt = $pdo->prepare("SELECT user_id, expires_at FROM password_resets WHERE token = ? LIMIT 1");
$stmt->execute([$token]);
$row = $stmt->fetch();

if (!$row) fail("Invalid or expired reset token.", 400);
if (strtotime($row["expires_at"]) < time()) {
    $pdo->prepare("DELETE FROM password_resets WHERE token = ?")->execute([$token]);
    fail("Reset token has expired. Please request a new one.", 400);
}

$pdo->prepare("UPDATE users SET password = ? WHERE id = ?")
    ->execute([hash_password($password), $row["user_id"]]);
$pdo->prepare("DELETE FROM password_resets WHERE token = ?")->execute([$token]);

json_out(["ok" => true, "message" => "Password has been reset. You can now sign in."]);