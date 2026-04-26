<?php

declare(strict_types=1);
require __DIR__ . '/lib.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed.', 405);
}

$input = read_json_body();
$token = sanitize_token($input['token'] ?? null);
$path = project_path($token);

if (!is_file($path)) {
    json_error('Project not found.', 404);
}

if (!unlink($path)) {
    json_error('Failed to delete project.', 500);
}

json_ok(['deleted' => true, 'token' => $token]);
