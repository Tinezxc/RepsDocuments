<?php
require_once __DIR__ . "/helpers.php";
require_method("POST");

$d = json_input();
$email    = trim((string)($d["email"]    ?? ""));
$password = (string)($d["password"] ?? "");

if ($email === "" || $password === "") fail("Missing credentials.", 400);

$stmt = db()->prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND password = ? LIMIT 1");
$stmt->execute([$email, $password]);
$user = $stmt->fetch();
if (!$user) fail("Invalid email or password.", 401);

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