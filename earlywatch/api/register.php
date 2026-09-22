<?php
require_once __DIR__ . "/helpers.php";
require_method("POST");

$d = json_input();
$name      = trim((string)($d["name"]      ?? ""));
$email     = strtolower(trim((string)($d["email"] ?? "")));
$password  = (string)($d["password"] ?? "");
$studentId = isset($d["studentId"]) ? trim((string)$d["studentId"]) : null;

$errs = [];
if ($name === "") $errs[] = "Full name is required.";
if ($email === "") $errs[] = "Email address is required.";
elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errs[] = "Please enter a valid email address.";
if ($password === "") $errs[] = "Password is required.";
elseif (strlen($password) < 6) $errs[] = "Password must be at least 6 characters.";
if ($errs) fail_many($errs, 400);

$chk = db()->prepare("SELECT 1 FROM users WHERE LOWER(email) = LOWER(?)");
$chk->execute([$email]);
if ($chk->fetch()) fail("An account with that email already exists.", 409);

$stmt = db()->prepare("INSERT INTO users (role,title,name,initials,email,password,student_id) VALUES ('student','Student', ?, ?, ?, ?, ?)");
$stmt->execute([$name, initials_from($name), $email, $password, ($studentId ?: null)]);
json_out(["ok" => true], 201);