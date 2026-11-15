<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__.'/set-public-price.php';
$command=$argv[1]??'';
try {
    if ($command==='status') {
        $app=require dirname(__DIR__).'/bootstrap.php';
        $order=$app->db->one("SELECT o.id,o.status,p.provider_id FROM orders o JOIN payments p ON p.order_id=o.id
            WHERE o.launch_ticket=1 ORDER BY o.status IN ('canceled','expired'),o.created_at DESC LIMIT 1");
        if (!$order) {
            echo "Заказ с действительным билетом за 1 ₽ ещё не создан.\n";
            exit;
        }
        if ($order['provider_id']!==null) {
            try {
                $app->syncPayment($order['provider_id']);
            } catch (\StatusTeam\Problem $error) {
                if ($error->status!==503) throw $error;
                echo "ЮKassa временно недоступна. Показаны сохранённые статусы.\n";
            }
        }
        $state=$app->db->one("SELECT o.amount,o.status AS order_status,p.status AS payment_status,p.receipt_status,
            t.number,t.status AS ticket_status,m.status AS email_status
            FROM orders o JOIN payments p ON p.order_id=o.id
            LEFT JOIN tickets t ON t.order_id=o.id
            LEFT JOIN mail_queue m ON m.dedupe=CONCAT('ticket:',o.id) WHERE o.id=?",[$order['id']]);
        echo json_encode($state, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR), PHP_EOL;
        exit;
    }

    if (!in_array($command,['1','30000'],true)) {
        throw new RuntimeException('Использование: php launch-checkout.php 1|status|30000');
    }
    installPublicPrice($command==='1');
    echo $command==='1' ? "Открыта публичная продажа за 1 ₽.\n" : "Открыта продажа за 30 000 ₽.\n";
} catch (\StatusTeam\Problem $error) {
    fwrite(STDERR,"Ошибка проверки статуса: ".$error->getMessage().PHP_EOL);
    exit(1);
} catch (RuntimeException $error) {
    // PDOException and provider internals can contain deployment details.
    $message=$error instanceof PDOException ? 'Ошибка доступа к базе.' : $error->getMessage();
    fwrite(STDERR,$message.PHP_EOL);
    exit(1);
}
