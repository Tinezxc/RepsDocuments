<?php
require_once __DIR__ . "/helpers.php";
require_method("POST");
db()->exec("UPDATE alerts SET acknowledged = 1 WHERE acknowledged = 0");
json_out(["ok" => true]);