<?php
declare(strict_types=1);
require __DIR__.'/fixtures.php';
try {
    $app=testApp();
    if($argv[1]==='purchase') $app->order(purchase(),'127.0.0.1');
    else $app->admit($argv[2],1);
    exit(0);
} catch(StatusTeam\Problem $e) {exit($e->status===409?2:3);}
