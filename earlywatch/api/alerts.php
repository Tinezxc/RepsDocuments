<?php
require_once __DIR__ . "/helpers.php";
require_method("GET");

$sid    = isset($_GET["studentId"]) ? trim((string)$_GET["studentId"]) : "";
$unread = isset($_GET["unread"]) && $_GET["unread"] === "1";
$sql    = "SELECT * FROM alerts";
$where  = [];
$args   = [];

if ($sid !== "") { $where[] = "student_id = ?"; $args[] = $sid; }
if ($unread)     { $where[] = "acknowledged = 0"; }
if ($where)      $sql .= " WHERE " . implode(" AND ", $where);
$sql .= " ORDER BY date DESC";

$stmt = db()->prepare($sql);
$stmt->execute($args);
json_out(array_map("alert_row", $stmt->fetchAll()));