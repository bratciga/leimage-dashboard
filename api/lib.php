<?php

declare(strict_types=1);

const PROJECTS_DIR = __DIR__ . '/../data/projects';

header('X-Robots-Tag: noindex, nofollow, noarchive');
header('Content-Type: application/json; charset=utf-8');

function ensure_projects_dir(): void {
    if (!is_dir(PROJECTS_DIR)) {
        mkdir(PROJECTS_DIR, 0775, true);
    }
}

function read_json_body(): array {
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function sanitize_token(?string $token): string {
    $token = (string)($token ?? '');
    if (!preg_match('/^pb_[a-z0-9]{12,64}$/', $token)) {
        json_error('Invalid project token.', 400);
    }
    return $token;
}

function sanitize_slug(?string $slug): string {
    $slug = strtolower(trim((string)($slug ?? '')));
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';
    $slug = trim($slug, '-');
    if ($slug === '') {
        json_error('Invalid event slug.', 400);
    }
    return $slug;
}

function project_path(string $token): string {
    return PROJECTS_DIR . '/' . $token . '.json';
}

function load_project(string $token): ?array {
    ensure_projects_dir();
    $path = project_path($token);
    if (!is_file($path)) return null;
    $raw = file_get_contents($path);
    $data = json_decode((string)$raw, true);
    return is_array($data) ? $data : null;
}

function save_project(array $project): array {
    ensure_projects_dir();
    $token = sanitize_token($project['token'] ?? null);
    $path = project_path($token);
    $json = json_encode($project, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        json_error('Failed to encode project.', 500);
    }
    file_put_contents($path, $json . PHP_EOL, LOCK_EX);
    return $project;
}

function list_projects(): array {
    ensure_projects_dir();
    $files = glob(PROJECTS_DIR . '/*.json') ?: [];
    $projects = [];
    foreach ($files as $file) {
        $raw = file_get_contents($file);
        $data = json_decode((string)$raw, true);
        if (is_array($data)) $projects[] = $data;
    }
    usort($projects, static function (array $a, array $b): int {
        $aTime = strtotime((string)($a['submitted_at'] ?? $a['last_saved_at'] ?? $a['created_at'] ?? '')) ?: 0;
        $bTime = strtotime((string)($b['submitted_at'] ?? $b['last_saved_at'] ?? $b['created_at'] ?? '')) ?: 0;
        return $bTime <=> $aTime;
    });
    return $projects;
}

function create_token(): string {
    return 'pb_' . substr(bin2hex(random_bytes(16)), 0, 28);
}

function json_ok(array $data = [], int $status = 200): void {
    http_response_code($status);
    echo json_encode(['ok' => true] + $data, JSON_UNESCAPED_SLASHES);
    exit;
}

function json_error(string $message, int $status = 400): void {
    http_response_code($status);
    echo json_encode(['ok' => false, 'error' => $message], JSON_UNESCAPED_SLASHES);
    exit;
}
