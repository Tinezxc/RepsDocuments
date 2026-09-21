<?php
require_once __DIR__ . "/helpers.php";
$pdo = db();
$m = $_SERVER["REQUEST_METHOD"];
$id = trim((string)($_GET["id"] ?? ""));
if ($id === "") fail("Missing student id.", 400);

if ($m === "GET") {
    $s = load_student($pdo, $id);
    if (!$s) fail("Student not found.", 404);
    json_out($s);
}
if ($m === "PUT") {
    $d = json_input();
    $q = $pdo->prepare("SELECT * FROM students WHERE id = ?");
    $q->execute([$id]);
    $row = $q->fetch();
    if (!$row) fail("Student not found.", 404);
    $name = $d["name"] ?? $row["name"];
    $stmt = $pdo->prepare("UPDATE students SET name=?, initials=?, course=?, section=?, adviser=?, gpa=?, attendance=?, missed=?, failed_subjects=?, case_status=? WHERE id=?");
    $stmt->execute([
        $name, initials_from($name),
        $d["course"]  ?? $row["course"],
        $d["section"] ?? $row["section"],
        $d["adviser"] ?? $row["adviser"],
        isset($d["gpa"])            ? (float)$d["gpa"]           : (float)$row["gpa"],
        isset($d["attendance"])     ? (int)$d["attendance"]      : (int)$row["attendance"],
        isset($d["missed"])         ? (int)$d["missed"]          : (int)$row["missed"],
        isset($d["failedSubjects"]) ? (int)$d["failedSubjects"]  : (int)$row["failed_subjects"],
        $d["caseStatus"] ?? $row["case_status"],
        $id,
    ]);
    json_out(load_student($pdo, $id));
}
if ($m === "DELETE") {
    $stmt = $pdo->prepare("DELETE FROM students WHERE id = ?");
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) fail("Student not found.", 404);
    json_out(["ok" => true]);
}
fail("Method not allowed.", 405);