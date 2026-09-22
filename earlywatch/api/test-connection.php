<?php
declare(strict_types=1);
require_once __DIR__ . "/config.php";

header("Content-Type: text/html; charset=utf-8");

try {
    $pdo = db();

    $version = $pdo->query("SELECT VERSION()")->fetchColumn();
    $dbname  = $pdo->query("SELECT DATABASE()")->fetchColumn();

    $tables = ["users","students","subjects","risk_history","notes","alerts","interventions"];
    $counts = [];
    foreach ($tables as $t) {
        try {
            $counts[$t] = (int) $pdo->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
        } catch (PDOException $e) {
            $counts[$t] = "MISSING";
        }
    }

    echo "<h1 style='color:#2a9d8f'>&#10003; Connected</h1>";
    echo "<p><strong>Host:</strong> " . htmlspecialchars(DB_HOST) . "</p>";
    echo "<p><strong>Database:</strong> " . htmlspecialchars((string)$dbname) . "</p>";
    echo "<p><strong>MySQL version:</strong> " . htmlspecialchars((string)$version) . "</p>";
    echo "<h3>Table row counts</h3><ul>";
    foreach ($counts as $t => $n) {
        $color = $n === "MISSING" ? "#e63946" : "#2a9d8f";
        echo "<li style='color:$color'>" . htmlspecialchars($t) . ": " . htmlspecialchars((string)$n) . "</li>";
    }
    echo "</ul>";

} catch (Throwable $e) {
    http_response_code(500);
    echo "<h1 style='color:#e63946'>&#10007; Failed</h1>";
    echo "<pre>" . htmlspecialchars($e->getMessage()) . "</pre>";
}