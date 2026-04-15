<?php

declare(strict_types=1);
require __DIR__ . '/lib.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed.', 405);
}

$input = read_json_body();
$clientName = trim((string)($input['client_name'] ?? ''));
$eventSlug = sanitize_slug($input['event_slug'] ?? $clientName);
$eventDate = trim((string)($input['event_date'] ?? '')) ?: null;

if ($clientName === '') {
    json_error('Client name is required.', 400);
}

$project = [
    'token' => create_token(),
    'client_name' => $clientName,
    'event_slug' => $eventSlug,
    'event_date' => $eventDate,
    'status' => 'invited',
    'created_at' => gmdate('c'),
    'last_saved_at' => null,
    'submitted_at' => null,
    'project_data' => [
        'project_token' => null,
        'client_name' => $clientName,
        'event_slug' => $eventSlug,
        'event_date' => $eventDate,
        'currentStep' => 1,
    ],
    'monogram_png' => null,
];

$project['project_data']['project_token'] = $project['token'];
save_project($project);
json_ok(['project' => $project], 201);
