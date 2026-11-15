<?php
declare(strict_types=1);

/** Change just the two checkout keys; verify the rest of the loaded config. */
function stagePublicPrice(string $configPath, string $target, bool $control, bool $open): void
{
    $config = require $configPath;
    if (($config['environment'] ?? '') !== 'live' ||
        ($config['base_url'] ?? '') !== 'https://statusteam-official.ru/api' ||
        ($config['yookassa']['test'] ?? null) !== false) {
        throw new RuntimeException('Нужен боевой конфиг statusteam-official.ru.');
    }
    $source = file_get_contents($configPath);
    if ($source === false || !preg_match("~(['\"]checkout_enabled['\"]\s*=>\s*)(true|false)\b~", $source)) {
        throw new RuntimeException('Не найден существующий checkout_enabled.');
    }
    $expected = $config;
    if ($open) {
        $source = preg_replace("~(['\"]checkout_enabled['\"]\s*=>\s*)false\b~", '${1}true', $source);
        $expected['checkout_enabled'] = true;
    }
    $value = $control ? 'true' : 'false';
    if (array_key_exists('public_control_price', $config)) {
        $source = preg_replace("~(['\"]public_control_price['\"]\s*=>\s*)(true|false)\b~", '${1}'.$value, $source, -1, $count);
    } else {
        $source = preg_replace("~(['\"]checkout_enabled['\"]\s*=>\s*(?:true|false)\s*,)~",
            '${1}'."\n    'public_control_price' => ".$value.",", $source, -1, $count);
    }
    $expected['public_control_price'] = $control;
    if ($count !== 1 || file_put_contents($target, $source) !== strlen($source)) {
        throw new RuntimeException('Не удалось однозначно изменить цену. Рабочий конфиг сохранён.');
    }
    $loaded = require $target;
    ksort($loaded);
    ksort($expected);
    if ($loaded !== $expected) {
        throw new RuntimeException('Проверка изменения конфигурации не прошла.');
    }
}

if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    if (PHP_SAPI !== 'cli' || !in_array($argv[1] ?? '', ['1', '30000'], true)) {
        echo "Использование: php set-public-price.php 1|30000\n";
        exit(1);
    }
    umask(0077);
    $config = realpath(getenv('STATUS_CONFIG') ?: dirname(__DIR__).'/config.php');
    $tmp = $config ? tempnam(dirname($config), '.checkout-price.') : false;
    if (!$tmp) exit(1);
    try {
        stagePublicPrice($config, $tmp, $argv[1] === '1', false);
        $backup = tempnam(dirname($config), 'config.price-backup.');
        if (!$backup || !copy($config, $backup) || !rename($tmp, $config)) {
            throw new RuntimeException('Не удалось записать конфиг.');
        }
        echo 'Настроена публичная цена: ', $argv[1], " ₽.\n";
    } catch (Throwable $error) {
        @unlink($tmp);
        echo $error->getMessage(), PHP_EOL;
        exit(1);
    }
}
