<?php
require_once __DIR__ . "/helpers.php";
require_method("POST");
$id = trim((string)($_GET["id"] ?? ""));
if ($id === "") fail("Missing alert id.", 400);
$stmt = db()->prepare("UPDATE alerts SET acknowledged = 1 WHERE id = ?");
$stmt->execute([$id]);
json_out(["ok" => true]);