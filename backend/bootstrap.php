<?php
declare(strict_types=1);
use StatusTeam\{Db,Crypto,App,YooKassa};
require __DIR__.'/vendor/autoload.php';
$configPath=getenv('STATUS_CONFIG') ?: __DIR__.'/config.php';
if(!is_file($configPath)) throw new RuntimeException('Private configuration missing');
$config=require $configPath;
date_default_timezone_set('UTC');
return new App(new Db($config['db']),$config,new Crypto($config['key']),new YooKassa($config['yookassa']));
