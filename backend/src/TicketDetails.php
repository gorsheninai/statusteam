<?php
declare(strict_types=1);

namespace StatusTeam;

final class TicketDetails
{
    public const EVENT = 'Пульс Континента';
    public const DATE = '30 ноября 2026';
    public const TIME = 'Сбор гостей 18:30 · начало 20:00 (Москва)';
    public const VENUE = 'LOTTE HOTEL MOSCOW';
    public const VENUE_ADDRESS = 'Москва, Новинский бульвар, д. 8, стр. 2';
    public const ORGANIZER = 'Общество с ограниченной ответственностью «СТАТУС»';
    public const REGISTRATION = 'ИНН 9714064863 · ОГРН 1247700777136';
    public const LEGAL_ADDRESS = '127051, Москва, ул. Петровка, д. 26, стр. 3, помещ. 6/3';
    public const AGE = '18+';
    public const ADMISSION = 'Один гость · один проход · без закреплённого места';
    public const TERMS_URL = 'https://statusteam-official.ru/documents/terms/';
    public const SUPPORT_EMAIL = 'status.team.tickets@mail.ru';

    public static function price(int $kopecks): string
    {
        $rubles = number_format(intdiv($kopecks, 100), 0, '', ' ');
        $fraction = $kopecks % 100;
        return $rubles.($fraction === 0 ? '' : sprintf(',%02d', $fraction)).' ₽';
    }
}
