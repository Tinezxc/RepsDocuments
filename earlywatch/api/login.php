<?php
require_once __DIR__ . "/helpers.php";
require_method("POST");

$d = json_input();
$email    = trim((string)($d["email"]    ?? ""));
$password = (string)($d["password"] ?? "");

if ($email === "" || $password === "") fail("Missing credentials.", 400);

$stmt = db()->prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) fail("Invalid email or password.", 401);

$stored = $user["password"];
$ok = false;

// Support both hashed and plain-text legacy passwords.
if (str_starts_with($stored, '$2y$') || str_starts_with($stored, '$argon2')) {
    $ok = verify_password($password, $stored);
} else {
    $ok = ($password === $stored);
    if ($ok) {
        // Upgrade to hash on first successful plain-text login.
        $upd = db()->prepare("UPDATE users SET password = ? WHERE id = ?");
        $upd->execute([hash_password($password), $user["id"]]);
    }
}

if (!$ok) fail("Invalid email or password.", 401);

// Set a session cookie so the browser can't restore a stale page via back button.
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$_SESSION["user_id"] = (int)$user["id"];
$_SESSION["role"]    = $user["role"];

$map = [
  "adviser"    => "adviser-dashboard.html",
  "instructor" => "instructor-dashboard.html",
  "student"    => "student-dashboard.html",
];
json_out([
  "role"      => $user["role"],
  "title"     => $user["title"],
  "name"      => $user["name"],
  "initials"  => $user["initials"],
  "email"     => $user["email"],
  "studentId" => $user["student_id"],
  "redirect"  => $map[$user["role"]] ?? "index.html",
]);