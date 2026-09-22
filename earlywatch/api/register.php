<?php
require_once __DIR__ . "/helpers.php";
require_method("POST");

$d = json_input();
$name      = trim((string)($d["name"]      ?? ""));
$email     = strtolower(trim((string)($d["email"] ?? "")));
$password  = (string)($d["password"] ?? "");
$studentId = isset($d["studentId"]) ? trim((string)$d["studentId"]) : null;

$errs = [];

/* ---- Name ---- */
if ($name === "") $errs[] = "Full name is required.";

/* ---- Email ---- */
$ALLOWED_DOMAIN = "cmdi.edu.ph";

if ($email === "") {
    $errs[] = "Email address is required.";
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errs[] = "Please enter a valid email address.";
} elseif (!str_ends_with($email, "@" . $ALLOWED_DOMAIN)) {
    $errs[] = "Email address must end with @{$ALLOWED_DOMAIN}.";
}

/* ---- Password: 8–20 chars, at least one letter + one symbol ---- */
$errs = array_merge($errs, validate_password_strength($password));

if ($errs) fail_many($errs, 400);

/* ---- Uniqueness ---- */
$chk = db()->prepare("SELECT 1 FROM users WHERE LOWER(email) = LOWER(?)");
$chk->execute([$email]);
if ($chk->fetch()) fail("An account with that email already exists.", 409);

/* ---- Insert ---- */
$stmt = db()->prepare(
    "INSERT INTO users (role,title,name,initials,email,password,student_id)
     VALUES ('student','Student', ?, ?, ?, ?, ?)"
);
$stmt->execute([
    $name,
    initials_from($name),
    $email,
    hash_password($password),
    ($studentId ?: null)
]);

json_out(["ok" => true], 201);