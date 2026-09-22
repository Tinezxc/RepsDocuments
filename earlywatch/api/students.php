<?php
declare(strict_types=1);
require_once __DIR__ . "/helpers.php";

$pdo    = db();
$method = $_SERVER["REQUEST_METHOD"];

/* ---------- GET — list all students ---------- */
if ($method === "GET") {
    $rows = $pdo->query("SELECT * FROM students ORDER BY name")->fetchAll();
    json_out(array_map("student_row", $rows));
}

/* ---------- POST — create a student ---------- */
if ($method === "POST") {
    $d = json_input();

    $errors = [];
    $name   = trim((string)($d["name"] ?? ""));

    if ($name === "") $errors[] = "Name is required.";
    if ($errors) fail_many($errors, 400);

    // Sequential ID (never reused).
    $prefix = trim((string)($d["idPrefix"] ?? date("Y")));
    $id     = trim((string)($d["id"] ?? ""));
    if ($id === "") {
        $id = next_student_id($pdo, $prefix);
    } else {
        $exists = $pdo->prepare("SELECT 1 FROM students WHERE id = ?");
        $exists->execute([$id]);
        if ($exists->fetch()) fail("A student with that ID already exists.", 409);
    }

    // Get the seq_no that this ID consumed.
    $seqStmt = $pdo->query("SELECT MAX(seq_no) FROM students");
    $nextSeq = ((int)$seqStmt->fetchColumn()) + 1;

    $stmt = $pdo->prepare(
        "INSERT INTO students
         (id, seq_no, name, initials, course, section, adviser,
          gpa, attendance, missed, failed_subjects, case_status)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)"
    );
    $stmt->execute([
        $id,
        $nextSeq,
        $name,
        initials_from($name),
        $d["course"]        ?? "",
        $d["section"]       ?? "",
        $d["adviser"]       ?? "",
        (float)($d["gpa"]             ?? 0),
        (int)  ($d["attendance"]      ?? 0),
        (int)  ($d["missed"]          ?? 0),
        (int)  ($d["failedSubjects"]  ?? 0),
        $d["caseStatus"]    ?? "Monitoring",
    ]);

    json_out(load_student($pdo, $id), 201);
}

/* ---------- DELETE — remove a student ---------- */
if ($method === "DELETE") {
    $id = trim((string)($_GET["id"] ?? ""));
    if ($id === "") fail("Missing id.", 400);

    foreach (["alerts", "interventions"] as $table) {
        try {
            $pdo->prepare("DELETE FROM {$table} WHERE student_id = ?")->execute([$id]);
        } catch (Throwable $e) { /* table may not exist — ignore */ }
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM students WHERE id = ?");
        $stmt->execute([$id]);
    } catch (Throwable $e) {
        fail("Delete failed: " . $e->getMessage(), 500);
    }

    if ($stmt->rowCount() === 0) fail("Student not found.", 404);
    json_out(["ok" => true]);
}

fail("Method not allowed.", 405);