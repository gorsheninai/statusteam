<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>STATUS TEAM — билет</title><link rel="stylesheet" href="app.css?v=3"><?php if($route==='staff'): ?><script src="scanner.min.js" defer></script><?php endif; ?><script src="app.js?v=live-control-1" defer></script><body data-page="<?=htmlspecialchars($route,ENT_QUOTES,'UTF-8')?>"><main>
<h1>STATUS TEAM</h1><p id="message" role="status" aria-live="polite"></p>
<?php if($testCheckout): ?><p><strong>Тестовый режим ЮKassa</strong></p><?php endif; ?>
<?php if($route==='ticket'): ?>
<?php $escape = static fn(string $value): string => htmlspecialchars($value, ENT_QUOTES, 'UTF-8'); $details=\StatusTeam\TicketDetails::class; ?>
<article id="ticket" hidden>
<div class="ticket-heading">
<div><p><?=$testCheckout ? 'Тестовый электронный билет' : 'Электронный билет'?></p>
<p id="control-ticket" hidden>Контрольный билет. Для прохода недействителен.</p>
<h2><?=$escape($details::EVENT)?></h2><p id="number"></p><p id="ticket-price"></p></div>
<strong class="ticket-age" id="ticket-age"><?=$escape($details::AGE)?></strong>
</div>
<p><?=$escape($details::DATE)?><br><?=$escape($details::TIME)?></p>
<p><?=$escape($details::VENUE)?><br><?=$escape($details::VENUE_ADDRESS)?></p>
<img id="qr" alt="QR-код билета" width="320" height="320"><p id="ticket-status"></p>
<p><?=$escape($details::ADMISSION)?></p>
<p><span id="ticket-order"></span><br><?=$escape($details::ORGANIZER)?><br><?=$escape($details::REGISTRATION)?><br><?=$escape($details::LEGAL_ADDRESS)?></p>
<p id="support"></p><p>Возврат: <a href="mailto:<?=$escape($details::REFUNDS_EMAIL)?>"><?=$escape($details::REFUNDS_EMAIL)?></a><br>
<a href="<?=$escape($details::TERMS_URL)?>">Условия покупки и возврата</a></p>
<button id="print">Распечатать</button></article>
<?php elseif($route==='return'): ?>
<h2>Ваш заказ</h2><p>Статус проверяется на сервере. Возвращение со страницы оплаты само по себе не подтверждает оплату.</p><button id="refresh">Проверить статус</button><p><a id="new-order" href="<?=$testCheckout ? 'index.php?r=purchase' : '/#tickets'?>" hidden>Оформить ещё один билет</a></p><p><a id="open-ticket" hidden>Открыть билет</a></p><p><a id="pay" hidden>Продолжить оплату</a></p>
<?php else: ?>
<form id="login" method="post"><h2>Вход сотрудника</h2><label>Логин<input name="username" autocomplete="username" required maxlength="80"></label><label>Пароль<input name="password" type="password" autocomplete="current-password" required maxlength="512"></label><button>Войти</button></form>
<section id="staff" hidden><button id="logout">Выйти</button><h2>Проверка билета</h2><button id="camera">Включить камеру</button><video id="video" playsinline muted></video><form id="check"><label>Код из QR или номер ST-...<input name="token" id="token" autocomplete="off" required maxlength="64" pattern="([a-f0-9]{64}|[Ss][Tt]-[A-Fa-f0-9]{16})"></label><button>Проверить</button></form><button id="admit" disabled>Подтвердить проход</button><p id="check-result" role="status"></p>
<section id="admin" hidden><h2>Кабинет администратора</h2><button id="dashboard">Обновить списки</button><div id="lists"></div>
<?php if($controlCheckout): ?>
<p><a href="/?control=1#tickets">Открыть форму сайта · контрольная оплата 1 ₽</a></p>
<?php endif; ?>
<?php if($testCheckout): ?>
<section><h3><?=$controlCheckout ? 'Контрольная оплата 1 ₽' : 'Тестовая покупка'?></h3><?php if($testCheckout): ?><p><a href="index.php?r=purchase">Обычная форма покупки в тестовом режиме</a></p><?php endif; ?>
<p><?=$controlCheckout ? 'С карты спишется 1 ₽. Укажите email для доставки билета и чека.' : 'Введите вымышленные имя и телефон, а также email для тестового билета.'?></p>
<button id="prepare-checkout" type="button">Открыть форму</button>
<form id="test-checkout" method="post" data-control="<?=$controlCheckout ? 'yes' : 'no'?>" hidden>
<p id="test-price"></p>
<label>Имя и фамилия<input name="name" required maxlength="200" ></label>
<label>Email для билета<input name="email" type="email" required maxlength="254"></label>
<label>Телефон<input name="phone" type="tel" required maxlength="32" value="+79990000000"></label>
<ul id="test-documents"></ul>
<label><input name="termsAccepted" type="checkbox" value="yes" required> Подтверждаю ознакомление</label>
<button><?=$controlCheckout ? 'Перейти к реальной оплате 1 ₽' : 'Перейти к тестовой оплате картой'?></button>
</form></section>
<?php endif; ?>
<form id="application-detail"><label>Номер заявки<input name="id" required maxlength="32"></label><button>Открыть заявку</button></form><pre id="application-data"></pre>
<form id="resend"><label>Номер заказа<input name="orderId" required maxlength="32"></label><button>Отправить тот же билет повторно</button></form>
<form id="refund"><h3>Возврат</h3><label>Номер заказа<input name="orderId" required maxlength="32"></label><label>Сумма в рублях<input name="amount" type="number" min="1" step="0.01" required></label><label>Повторите сумму в рублях<input name="confirm" type="number" min="1" step="0.01" required></label><button>Подтвердить возврат указанной суммы</button></form>
<form id="mail-retry"><label>Номер неудавшегося письма<input name="id" type="number" min="1" required></label><button>Повторить отправку</button></form></section></section>
<?php endif; ?></main></body></html>
