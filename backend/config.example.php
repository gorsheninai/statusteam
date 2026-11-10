<?php
// Copy OUTSIDE public_html to backend/config.php. chmod 600. Never commit secrets.
return [
    'environment' => 'test',
    'origin' => 'https://statusteam-official.ru',
    'base_url' => 'https://statusteam-official.ru/api',
    'forms_enabled' => false,
    'checkout_enabled' => false,
    'live_approved' => false, // only after acceptance checklist; not an alternative to fiscal checks
    'documents_approved' => false,
    'minor_forms_enabled' => false, // awaiting approved guardian document
    'support' => '', // organizer-confirmed support email/phone
    'application_recipient' => '', // approved Russian-hosted mailbox; no applicant data in notification
    'key' => '', // php -r 'echo base64_encode(random_bytes(32)), PHP_EOL;'
    'db' => ['dsn' => 'mysql:host=localhost;dbname=a1325854_data;charset=utf8mb4', 'user' => 'a1325854_data', 'password' => ''],
    // Never trust forwarded headers unless REMOTE_ADDR is on this exact-IP list.
    'trusted_proxies' => [],
    'smtp' => ['host' => '', 'port' => 0, 'encryption' => '', 'user' => 'tickets@statusteam-official.ru', 'password' => '', 'from' => 'tickets@statusteam-official.ru'],
    'yookassa' => ['shop_id' => '', 'secret' => '', 'test' => true],
    'fiscal' => [
        // This implementation uses: payment+receipt together, refund+receipt together.
        'approved' => false,
        'integration' => 'payment_with_receipt',
        'tax_system_code' => null, 'vat_code' => null,
        'payment_subject' => '', 'payment_mode' => '',
        'refund_payment_mode' => '',
        // Only full_payment may go live in this version. Prepayment needs closing receipts.
    ],
    // Partial refunds disabled until the organizer selects keep/void and lawyer approves.
    'partial_refund_policy' => 'disabled',
    // Absolute retention dates per purpose must be approved. No arbitrary automatic deletion.
    'retention' => ['applications_before' => null, 'orders_before' => null, 'consents_before' => null],
];
