<?php
declare(strict_types=1);
namespace StatusTeam;
use PHPMailer\PHPMailer\PHPMailer;
final class Mailer {
    public function __construct(private App $app) {}
    public function send(string $to,string $subject,string $body,string $messageId, ?array $attachment=null): void {
        $c=$this->app->c['smtp'];
        $m = new PHPMailer(true);
        $m->isMail();
        $m->CharSet='UTF-8';$m->setFrom($c['from'],'STATUS TEAM');$m->addAddress($to);$m->Subject=$subject;$m->Body=$body;
        $m->MessageID='<'.$messageId.'@statusteam-official.ru>';
        if ($attachment !== null) {
            if (isset($attachment['html'])) {
                $m->isHTML(true);
                $m->Body=$attachment['html'];
                $m->AltBody=$body;
                $m->addReplyTo(TicketDetails::SUPPORT_EMAIL,'STATUS TEAM');
            }
            $m->addStringAttachment($attachment['pdf'], $attachment['name'], 'base64', 'application/pdf');
        }
        $m->send();
    }
    private static function ticketMessage(string $number, string $url, string $notice): array
    {
        $date=TicketDetails::DATE;
        $time=TicketDetails::TIME;
        $venue=TicketDetails::VENUE;
        $address=TicketDetails::VENUE_ADDRESS;
        $event=TicketDetails::EVENT;
        $support=TicketDetails::SUPPORT_EMAIL;
        $access='18+ · Один билет — один гость · Без закреплённого места';
        $entry='На входе покажите QR-код с телефона или из распечатанного PDF во вложении.';
        $help='Вопросы по билету';
        $body=($notice === '' ? '' : $notice."\n\n")
            .$event."\nБилет № ".$number."\n\n".$date."\n".$time."\n".$venue."\n".$address."\n".$access
            ."\n\nОткрыть билет: ".$url."\n\n".($notice === '' ? $entry."\n" : '').$help.': '.$support."\n";

        $escape=static fn (string $value): string => htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $noticeHtml=$notice === '' ? '' : '<p style="margin:0 0 18px;color:#761028;font-weight:bold">'.$escape($notice).'</p>';
        $entryHtml=$notice === '' ? '<p style="margin:22px 0 0;font-size:14px;color:#403538">'.$escape($entry).'</p>' : '';
        [$safeNumber,$safeUrl,$safeEvent,$safeDate,$safeTime,$safeVenue,$safeAddress,$safeAccess]=array_map(
            $escape,[$number,$url,$event,$date,$time,$venue,$address,$access]);
        $html=<<<HTML
<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f4f0ee;color:#25181a">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f0ee">
<tr><td align="center" style="padding:20px 12px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:540px;background:#fff;font-family:Arial,sans-serif">
<tr><td bgcolor="#2c0914" style="padding:25px 26px;color:#fff">
<p style="margin:0 0 12px;font-size:12px;letter-spacing:2px;color:#e1c8a5">STATUS TEAM</p>
<h1 style="margin:0;font-size:27px;line-height:1.2;color:#fff">{$safeEvent}</h1>
<p style="margin:10px 0 0;font-size:13px;color:#f0dbdc">Билет № {$safeNumber}</p>
</td></tr>
<tr><td style="padding:24px 26px 26px;font-size:16px;line-height:1.5">
{$noticeHtml}
<p style="margin:0 0 14px"><strong>{$safeDate}</strong><br>{$safeTime}</p>
<p style="margin:0 0 13px"><strong>{$safeVenue}</strong><br>{$safeAddress}</p>
<p style="margin:0 0 22px;font-size:13px;color:#403538">{$safeAccess}</p>
<table role="presentation" cellspacing="0" cellpadding="0"><tr>
<td bgcolor="#761028" style="border-radius:4px"><a href="{$safeUrl}" style="display:inline-block;padding:12px 23px;font-size:16px;font-weight:bold;color:#fff;text-decoration:none">Открыть билет</a></td>
</tr></table>
{$entryHtml}
<p style="margin:18px 0 0;font-size:13px;color:#403538">{$help}: <a href="mailto:{$support}" style="color:#761028">{$support}</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>
HTML;
        return [$body,$html];
    }

    public function work(?callable $transport=null): array {
        $db=$this->app->db;$sent=0;$failed=0;
        // MySQL row lock + expiring lease. PHPMailer timeout < lease; one worker owns each job.
        for($i=0;$i<20;$i++) {
            $job=$db->tx(function() use($db) {
                $r=$db->one("SELECT * FROM mail_queue WHERE ((status='pending' AND available_at<=UTC_TIMESTAMP()) OR (status='sending' AND locked_at<DATE_SUB(UTC_TIMESTAMP(),INTERVAL 5 MINUTE))) AND attempts<10 ORDER BY id LIMIT 1 FOR UPDATE");
                if(!$r) return null;
                $r['lock_token']=Crypto::id();
                $db->run("UPDATE mail_queue SET status='sending',locked_at=UTC_TIMESTAMP(),lock_token=?,attempts=attempts+1 WHERE id=?",[$r['lock_token'],$r['id']]);return $r;
            });
            if(!$job) break;
            try {
                $attachment=null;
                if($job['kind']==='ticket') {
                    $t=$db->one("SELECT t.token_cipher,t.number,o.amount,o.launch_ticket FROM tickets t JOIN orders o ON o.id=t.order_id WHERE t.order_id=? AND o.status='paid' AND t.status IN ('valid','used')",[$job['reference_id']]);
                    if(!$t) {
                        $db->run("UPDATE mail_queue SET status='canceled',lock_token=NULL WHERE id=? AND lock_token=?",[$job['id'],$job['lock_token']]);continue;
                    }
                    $token=$this->app->crypto->open($t['token_cipher']);
                    $url=$this->app->ticketUrl($token);
                    $amount=(int)$t['amount'];
                    $test=$this->app->c['environment']==='test';
                    $control=App::controlTicket($amount,(bool)$t['launch_ticket']);
                    $notice=$control
                        ? 'Контрольный билет. Для прохода недействителен.'
                        : ($test ? 'Тестовый билет. Для прохода недействителен.' : '');
                    $subject=($notice === ''
                        ? 'Ваш билет на «'.TicketDetails::EVENT.'»'
                        : ($control ? 'Контрольный билет · ' : 'Тестовый билет · ').TicketDetails::EVENT);
                    [$body,$html]=self::ticketMessage($t['number'],$url,$notice);
                    $attachment=[
                        'pdf'=>TicketPdf::render($t['number'],$token,$test,$amount,$job['reference_id'],(bool)$t['launch_ticket']),
                        'name'=>$t['number'].'.pdf',
                        'html'=>$html,
                    ];
                } else {
                    $subject='Новая заявка STATUS TEAM';
                    // Applicant data stay in MySQL; authenticated admin reads them in the same Russian infrastructure.
                    $body="Сохранена новая заявка. Откройте защищённый кабинет:\n".$this->app->c['base_url'].'/index.php?r=staff';
                }
                $args=[$this->app->crypto->open($job['recipient']),$subject,$body,'queue-'.$job['id']];
                $args[]=$attachment;
                if($transport) $transport(...$args); else $this->send(...$args);
                $db->run("UPDATE mail_queue SET status='sent',sent_at=UTC_TIMESTAMP(),lock_token=NULL,last_error=NULL WHERE id=? AND lock_token=?",[$job['id'],$job['lock_token']]);$sent++;
            } catch(\Throwable) {
                $attempt=(int)$job['attempts']+1;$delay=min(3600,30*(2**min($attempt,7)));
                $db->run('UPDATE mail_queue SET status=?,available_at=DATE_ADD(UTC_TIMESTAMP(),INTERVAL ? SECOND),last_error=?,lock_token=NULL WHERE id=? AND lock_token=?',[$attempt>=10?'failed':'pending',$delay,'smtp_delivery_failed',$job['id'],$job['lock_token']]);$failed++;
            }
        }
        // A worker that crashed on its last attempt leaves an observable failure.
        $db->run("UPDATE mail_queue SET status='failed',last_error='worker_lease_expired',lock_token=NULL WHERE status='sending' AND attempts>=10 AND locked_at<DATE_SUB(UTC_TIMESTAMP(),INTERVAL 5 MINUTE)");
        return ['sent'=>$sent,'failed'=>$failed];
    }
}
