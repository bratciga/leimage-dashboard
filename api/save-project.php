<?php

declare(strict_types=1);
require __DIR__ . '/lib.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed.', 405);
}

$input = read_json_body();
$token = sanitize_token($input['token'] ?? null);
$existing = load_project($token);
if (!$existing) {
    json_error('Project not found.', 404);
}

$project = array_merge($existing, [
    'client_name' => trim((string)($input['client_name'] ?? $existing['client_name'] ?? '')),
    'event_slug' => sanitize_slug($input['event_slug'] ?? $existing['event_slug'] ?? ''),
    'event_date' => trim((string)($input['event_date'] ?? $existing['event_date'] ?? '')) ?: null,
    'status' => trim((string)($input['status'] ?? $existing['status'] ?? 'draft')) ?: 'draft',
    'last_saved_at' => trim((string)($input['last_saved_at'] ?? '')) ?: gmdate('c'),
    'submitted_at' => array_key_exists('submitted_at', $input)
        ? (trim((string)$input['submitted_at']) ?: null)
        : ($existing['submitted_at'] ?? null),
    'project_data' => is_array($input['project_data'] ?? null) ? $input['project_data'] : ($existing['project_data'] ?? []),
    'monogram_png' => array_key_exists('monogram_png', $input)
        ? (($input['monogram_png'] === null || $input['monogram_png'] === '') ? null : (string)$input['monogram_png'])
        : ($existing['monogram_png'] ?? null),
]);

save_project($project);
json_ok(['project' => $project]);
