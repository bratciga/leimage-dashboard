<?php

declare(strict_types=1);

require __DIR__ . '/lib.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed.', 405);
}

$data = read_json_body();
$title = trim((string)($data['title'] ?? 'Package upgrade'));
$upgrade = trim((string)($data['upgrade'] ?? ''));
$client = trim((string)($data['client'] ?? 'Wedding dashboard client'));
$eventDate = trim((string)($data['eventDate'] ?? ''));
$quantity = max(1, (int)($data['quantity'] ?? 1));
$price = (float)($data['price'] ?? 0);
$requestedAt = trim((string)($data['requestedAt'] ?? date(DATE_ATOM)));

$to = 'info@leimageinc.com';
$subject = 'Wedding dashboard upgrade request: ' . $title;
$body = implode("\n", [
    'A client requested a package upgrade from the wedding dashboard.',
    '',
    'Client: ' . $client,
    'Event date: ' . ($eventDate !== '' ? $eventDate : 'Not provided'),
    'Upgrade: ' . $title,
    'Upgrade key: ' . $upgrade,
    'Quantity: ' . $quantity,
    'Unit price: $' . number_format($price, 2),
    'Requested at: ' . $requestedAt,
]);
$headers = [
    'From: Le Image Dashboard <info@leimageinc.com>',
    'Reply-To: info@leimageinc.com',
    'Content-Type: text/plain; charset=UTF-8',
];

$sent = @mail($to, $subject, $body, implode("\r\n", $headers));

json_ok(['sent' => $sent]);
