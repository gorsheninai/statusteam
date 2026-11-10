<?php
declare(strict_types=1);
// CLI only. No public installer exists.
if(PHP_SAPI!=='cli') {http_response_code(404);exit;}
use StatusTeam\{Crypto,App,Mailer};
require dirname(__DIR__).'/vendor/autoload.php';
$command=$argv[1]??'help';
if($command==='preflight') {
    $missing=[];foreach(['pdo_mysql','curl','mbstring','sodium','openssl','SimpleXML'] as $extension) if(!extension_loaded($extension)) $missing[]=$extension;
    echo json_encode(['php'=>PHP_VERSION,'supported'=>PHP_VERSION_ID>=80400 && PHP_VERSION_ID<80600,'missingExtensions'=>$missing],JSON_PRETTY_PRINT).PHP_EOL;
    exit($missing || PHP_VERSION_ID<80400 || PHP_VERSION_ID>=80600 ?1:0);
}
try {
    $app=require dirname(__DIR__).'/bootstrap.php';$db=$app->db;
    switch($command) {
        case 'migrate':
            $lock=$db->one("SELECT GET_LOCK('statusteam_migrate',10) acquired");
            if((int)$lock['acquired']!==1) throw new RuntimeException('Migration is already running');
            try {
                $db->run('CREATE TABLE IF NOT EXISTS schema_migrations(version VARCHAR(100) PRIMARY KEY,sha256 CHAR(64) NOT NULL,applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB');
                foreach(glob(dirname(__DIR__).'/migrations/*.sql') as $file) {
                    $version=basename($file);$hash=hash_file('sha256',$file);
                    $old=$db->one('SELECT sha256 FROM schema_migrations WHERE version=?',[$version]);
                    if($old) {if($old['sha256']!==$hash) throw new RuntimeException('Applied migration checksum changed');continue;}
                    // DDL is not transactionally rolled back by MySQL. On failure STOP and inspect before retry.
                    foreach(explode(';',file_get_contents($file)) as $sql) if(trim($sql)!=='') $db->pdo->exec($sql);
                    $db->run('INSERT INTO schema_migrations(version,sha256) VALUES(?,?)',[$version,$hash]);echo $version." applied\n";
                }
            } finally {$db->run("SELECT RELEASE_LOCK('statusteam_migrate')");}
            break;
        case 'document-import':
            [$id,$version,$href,$file]=array_slice($argv,2)+['','','',''];
            if(!preg_match('/^[a-z_]{2,40}$/D',$id) || !$version || strlen($version)>100 || !$href || strlen($href)>500 || !is_file($file)) throw new RuntimeException('Usage: document-import ID VERSION HREF /private/approved.txt');
            $body=file_get_contents($file);if(!$body || strlen($body)>1000000) throw new RuntimeException('Invalid document');
            $db->tx(function() use($db,$id,$version,$href,$body) {
                $db->one('SELECT id FROM inventory WHERE id=1 FOR UPDATE');
                $old=$db->one('SELECT * FROM documents WHERE id=? AND version=?',[$id,$version]);
                if($old && ($old['sha256']!==hash('sha256',$body) || $old['href']!==$href)) throw new RuntimeException('Document version immutable; assign a new version');
                if(!$old) $db->run('INSERT INTO documents(id,version,body,sha256,href) VALUES(?,?,?,?,?)',[$id,$version,$body,hash('sha256',$body),$href]);
                $db->run('UPDATE documents SET active=0 WHERE id=?',[$id]);$db->run('UPDATE documents SET active=1 WHERE id=? AND version=?',[$id,$version]);
            });echo "Approved document snapshot stored. Set the SAME href/version in src/content/legal.ts and rebuild.\n";break;
        case 'staff-add':
            $username=$argv[2]??'';$role=$argv[3]??'';
            if(!preg_match('/^[a-zA-Z0-9_.-]{3,80}$/D',$username) || !in_array($role,['admin','controller'],true)) throw new RuntimeException('Usage: staff-add USER admin|controller (password entered privately)');
            echo 'Password (hidden): ';system('stty -echo');try {$password=rtrim(fgets(STDIN),"\r\n");} finally {system('stty echo');echo PHP_EOL;}
            if(strlen($password)<14 || strlen($password)>512) throw new RuntimeException('Use a unique password of 14+ characters');
            $db->run('INSERT INTO staff(username,password_hash,role) VALUES(?,?,?)',[$username,password_hash($password,PASSWORD_DEFAULT),$role]);echo "Staff account created\n";break;
        case 'staff-disable':$db->run('UPDATE staff SET active=0 WHERE username=?',[$argv[2]??'']);echo "Account disabled\n";break;
        case 'mail':echo App::json((new Mailer($app))->work()).PHP_EOL;break;
        case 'reconcile':
            $result=$app->reconcile();echo App::json($result).PHP_EOL;exit($result['needsAttention']?1:0);
        case 'refund-sync':$app->syncRefund($argv[2]??'');echo "Refund checked through provider API\n";break;
        case 'smtp-test':
            $to=StatusTeam\Validation::email($argv[2]??'');
            (new Mailer($app))->send($to,'STATUS TEAM — проверка SMTP','Тестовое служебное письмо. Персональных данных покупателей нет.',Crypto::id());
            echo "SMTP accepted message. Verify inbox, spam and authentication headers manually.\n";break;
        case 'purge':echo App::json((new StatusTeam\Retention($app))->purge(($argv[2]??'')==='--apply')).PHP_EOL;break;
        case 'hold':
            $kind=$argv[2]??'';$id=$argv[3]??'';$reason=$argv[4]??'';
            if(!in_array($kind,['application','order'],true) || !preg_match('/^[a-f0-9]{32}$/D',$id) || !preg_match('/^[a-z_]{3,64}$/D',$reason)) throw new RuntimeException('Usage: hold application|order ID reason_code');
            $db->run('INSERT INTO retention_holds(kind,reference_id,reason_code) VALUES(?,?,?) ON DUPLICATE KEY UPDATE reason_code=VALUES(reason_code)',[$kind,$id,$reason]);echo "Retention hold recorded\n";break;
        case 'health':
            $db->run('DELETE FROM rate_limits WHERE expires_at<UTC_TIMESTAMP()');
            $result=[
                'dbVersion'=>$db->one('SELECT VERSION() version')['version'],
                'failedMail'=>$db->one("SELECT COUNT(*) n FROM mail_queue WHERE status='failed'")['n'],
                'lateTicketMail'=>$db->one("SELECT COUNT(*) n FROM mail_queue WHERE kind='ticket' AND status NOT IN ('sent','canceled') AND created_at<DATE_SUB(UTC_TIMESTAMP(),INTERVAL 45 MINUTE)")['n'],
                'manualPayments'=>$db->one("SELECT COUNT(*) n FROM payments WHERE status='manual_review'")['n'],
                'manualRefunds'=>$db->one("SELECT COUNT(*) n FROM refunds WHERE status='manual_review'")['n'],
                'receiptIssues'=>$db->one("SELECT COUNT(*) n FROM payments WHERE status='succeeded' AND (receipt_status IS NULL OR receipt_status<>'succeeded')")['n'],
            ]; echo App::json($result).PHP_EOL;break;
        default:echo "Commands: preflight, migrate, document-import, staff-add, staff-disable, mail, reconcile, smtp-test, health\n";
    }
} catch(Throwable $e) {
    // Commands never echo provider/SMTP/SQL exception data (may contain PII).
    fwrite(STDERR,"Command failed; check private configuration, schema and documented prerequisites. No credentials or customer data were logged.\n");exit(1);
}
