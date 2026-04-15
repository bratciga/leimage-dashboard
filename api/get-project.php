<?php

declare(strict_types=1);
require __DIR__ . '/lib.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed.', 405);
}

$token = sanitize_token($_GET['token'] ?? null);
$project = load_project($token);
if (!$project) {
    json_error('Project not found.', 404);
}

json_ok(['project' => $project]);
