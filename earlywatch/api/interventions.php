<?php
require_once __DIR__ . "/helpers.php";
$pdo = db();

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    $sid = isset($_GET["studentId"]) ? trim((string)$_GET["studentId"]) : "";
    if ($sid !== "") {
        $stmt = $pdo->prepare("SELECT * FROM interventions WHERE student_id = ? ORDER BY date DESC");
        $stmt->execute([$sid]);
    } else {
        $stmt = $pdo->query("SELECT * FROM interventions ORDER BY date DESC");
    }
    json_out(array_map("intervention_row", $stmt->fetchAll()));
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $d = json_input();
    $item = [
      "id"        => uid("i"),
      "studentId" => $d["studentId"] ?? "",
      "type"      => $d["type"]      ?? "Counseling",
      "status"    => $d["status"]    ?? "pending",
      "assigned"  => $d["assigned"]  ?? "",
      "action"    => $d["action"]    ?? "",
      "date"      => $d["date"]      ?? today(),
      "deadline"  => $d["deadline"]  ?? null,
    ];
    if ($item["studentId"] === "") fail("studentId is required.", 400);
    $stmt = $pdo->prepare("INSERT INTO interventions (id,student_id,type,status,assigned,action,date,deadline) VALUES (?,?,?,?,?,?,?,?)");
    $stmt->execute([$item["id"],$item["studentId"],$item["type"],$item["status"],$item["assigned"],$item["action"],$item["date"],$item["deadline"]]);
    json_out($item, 201);
}
fail("Method not allowed.", 405);