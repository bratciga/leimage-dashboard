<?php
// Auto-deploy webhook for GitHub pushes
$payload = file_get_contents('php://input');
$event = $_SERVER['HTTP_X_GITHUB_EVENT'] ?? '';

if ($event !== 'push') {
    echo 'Not a push event';
    exit;
}

// Force reset to match remote (handles orphaned history)
$dir = __DIR__;
$output = [];
exec("cd $dir && git fetch origin 2>&1", $output);
exec("cd $dir && git reset --hard origin/main 2>&1", $output);
exec("cd $dir && git clean -fd 2>&1", $output);

header('Content-Type: application/json');
echo json_encode(['status' => 'success', 'message' => 'Deployment started', 'output' => $output]);
