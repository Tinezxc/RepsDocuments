<?php
require_once __DIR__ . "/helpers.php";
require_method("POST");
$d = json_input();
$item = [
  "id" => uid("a"),
  "studentId" => $d["studentId"] ?? "",
  "severity"  => $d["severity"]  ?? "medium",
  "kind"      => $d["kind"]      ?? "Note",
  "message"   => $d["message"]   ?? "",
  "date"      => $d["date"]      ?? today(),
];
if ($item["studentId"] === "") fail("studentId is required.", 400);
$stmt = db()->prepare("INSERT INTO alerts (id,student_id,severity,kind,message,date,acknowledged) VALUES (?,?,?,?,?,?,0)");
$stmt->execute([$item["id"],$item["studentId"],$item["severity"],$item["kind"],$item["message"],$item["date"]]);
json_out($item, 201);