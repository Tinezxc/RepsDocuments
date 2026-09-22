<?php
/* ============================================================
   Shared helpers used by every endpoint.
   ============================================================ */

declare(strict_types=1);

require_once __DIR__ . "/config.php";

/* ---------- Request / response ---------- */
function json_input(): array {
    $raw = file_get_contents("php://input");
    if ($raw === false || $raw === "") return [];
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function json_out($data, int $status = 200): void {
    http_response_code($status);
    header("Content-Type: application/json; charset=utf-8");
    header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
    header("Pragma: no-cache");
    header("Expires: 0");
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $message, int $status = 400): void {
    json_out(["errors" => [$message]], $status);
}

function fail_many(array $errors, int $status = 400): void {
    json_out(["errors" => array_values($errors)], $status);
}

function require_method(string $method): void {
    if ($_SERVER["REQUEST_METHOD"] !== $method) {
        fail("Method not allowed. Expected $method.", 405);
    }
}

/* ---------- Utilities ---------- */
function initials_from(string $name): string {
    $parts = preg_split("/\s+/", trim($name));
    $out = "";
    foreach (array_slice($parts, 0, 2) as $p) {
        if ($p !== "") $out .= strtoupper($p[0]);
    }
    return $out !== "" ? $out : "??";
}

function uid(string $prefix): string {
    return $prefix . "_" . bin2hex(random_bytes(4));
}

function today(): string {
    return date("Y-m-d");
}

/* ---------- Password security ---------- */
function hash_password(string $plain): string {
    return password_hash($plain, PASSWORD_DEFAULT);
}

function verify_password(string $plain, string $hash): bool {
    return password_verify($plain, $hash);
}

/* Password policy: 8–20 chars, at least one letter and one symbol. */
function validate_password_strength(string $password): array {
    $errors = [];
    $len = strlen($password);
    if ($len < 8)  $errors[] = "Password must be at least 8 characters long.";
    if ($len > 20) $errors[] = "Password must not exceed 20 characters.";
    if (!preg_match('/[A-Za-z]/', $password)) {
        $errors[] = "Password must include at least one letter.";
    }
    if (!preg_match('/[!@#$%^&*()_+\-=\[\]{};\':"\\\\|,.<>\/?~`]/', $password)) {
        $errors[] = "Password must include at least one symbol (e.g. ! @ # $ % ^ & *).";
    }
    return $errors;
}

/* ---------- Unique sequential student IDs (never reused) ---------- */
function next_student_id(PDO $pdo, string $prefix = ""): string {
    // Insert a row into id_sequence to consume the auto-increment value.
    $pdo->exec("INSERT INTO id_sequence () VALUES ()");
    $seq = (int) $pdo->lastInsertId();

    // Never reuse: if the student with this seq already exists (shouldn't),
    // bump until we find a free slot.
    do {
        $candidate = ($prefix !== "" ? $prefix . "-" : "") . str_pad((string)$seq, 5, "0", STR_PAD_LEFT);
        $chk = $pdo->prepare("SELECT 1 FROM students WHERE seq_no = ?");
        $chk->execute([$seq]);
        if (!$chk->fetch()) break;
        $seq++;
    } while (true);

    return $candidate;
}

/* ---------- Row → API shape mappers ---------- */
function student_row(array $r): array {
    return [
        "id"             => $r["id"],
        "seqNo"          => (int) ($r["seq_no"] ?? 0),
        "name"           => $r["name"],
        "initials"       => $r["initials"],
        "course"         => $r["course"],
        "section"        => $r["section"],
        "adviser"        => $r["adviser"],
        "gpa"            => (float) $r["gpa"],
        "attendance"     => (int)   $r["attendance"],
        "missed"         => (int)   $r["missed"],
        "failedSubjects" => (int)   $r["failed_subjects"],
        "caseStatus"     => $r["case_status"],
        "createdAt"      => $r["created_at"],
        "updatedAt"      => $r["updated_at"],
    ];
}

function alert_row(array $r): array {
    return [
        "id"           => $r["id"],
        "studentId"    => $r["student_id"],
        "severity"     => $r["severity"],
        "kind"         => $r["kind"],
        "message"      => $r["message"],
        "date"         => $r["date"],
        "acknowledged" => (bool) $r["acknowledged"],
    ];
}

function intervention_row(array $r): array {
    return [
        "id"        => $r["id"],
        "studentId" => $r["student_id"],
        "type"      => $r["type"],
        "status"    => $r["status"],
        "assigned"  => $r["assigned"],
        "action"    => $r["action"],
        "date"      => $r["date"],
        "deadline"  => $r["deadline"],
    ];
}

/* ---------- Load one student with children ---------- */
function load_student(PDO $pdo, string $id): ?array {
    $stmt = $pdo->prepare("SELECT * FROM students WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) return null;

    $out = student_row($row);

    $s = $pdo->prepare(
        "SELECT code, name, instructor, grade, prelim, midterm, attendance
         FROM subjects WHERE student_id = ? ORDER BY id"
    );
    $s->execute([$id]);
    $out["subjects"] = array_map(fn($x) => [
        "code"       => $x["code"],
        "name"       => $x["name"],
        "instructor" => $x["instructor"],
        "grade"      => $x["grade"]   !== null ? (int)$x["grade"]   : null,
        "prelim"     => $x["prelim"]  !== null ? (int)$x["prelim"]  : null,
        "midterm"    => $x["midterm"] !== null ? (int)$x["midterm"] : null,
        "attendance" => (int) $x["attendance"],
    ], $s->fetchAll());

    $h = $pdo->prepare("SELECT term, risk FROM risk_history WHERE student_id = ? ORDER BY id");
    $h->execute([$id]);
    $out["history"] = array_map(fn($x) => [
        "term" => $x["term"],
        "risk" => (int) $x["risk"],
    ], $h->fetchAll());

    $n = $pdo->prepare("SELECT date, author, text FROM notes WHERE student_id = ? ORDER BY id DESC");
    $n->execute([$id]);
    $out["notes"] = $n->fetchAll();

    return $out;
}