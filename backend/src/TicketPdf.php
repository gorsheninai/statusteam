<?php
declare(strict_types=1);

namespace StatusTeam;

use Endroid\QrCode\Bacon\MatrixFactory;
use Endroid\QrCode\QrCode;

final class TicketPdf
{
    // The precompiled theme contains the approved artwork, static text, embedded
    // font subsets, and PDF objects. No recipient or order data is stored in it.
    public static function render(string $number, string $token, bool $test, int $amount, string $orderId): string
    {
        $theme = json_decode(file_get_contents(__DIR__.'/TicketTheme.json'), true, flags: JSON_THROW_ON_ERROR);
        $control = $amount === App::CONTROL_PRICE;
        $type = $control ? 'КОНТРОЛЬНЫЙ БИЛЕТ' : ($test ? 'ТЕСТОВЫЙ БИЛЕТ' : 'ЭЛЕКТРОННЫЙ БИЛЕТ');
        $content = base64_decode($theme['content'], true)."\n";
        $content .= self::label($theme['fonts']['Body'], $type, 30, 521, 8, '0.820 0.749 0.761', 1.35);
        $qrLabel = $control ? 'QR-код контрольного билета' : ($test ? 'QR-код тестового билета' : 'Покажите QR-код на входе');
        $content .= self::label($theme['fonts']['Bold'], $qrLabel, 179, 225, 12, '0.945 0.933 0.910');
        $content .= self::label($theme['fonts']['Mono'], 'БИЛЕТ № '.$number, 179, 165, 9.3, '0.820 0.749 0.761');
        $content .= self::label($theme['fonts']['Bold'], TicketDetails::price($amount), 179, 137, 22, '0.776 0.659 0.486');
        if ($control || $test) {
            $content .= self::label($theme['fonts']['Bold'], 'ДЛЯ ПРОХОДА НЕДЕЙСТВИТЕЛЕН', 179, 120, 7.6, '0.820 0.749 0.761');
        }

        $matrix = (new MatrixFactory())->create(new QrCode(data: $token));
        $count = $matrix->getBlockCount();
        $step = 112.2 / ($count + 8);
        // Four quiet modules on every side, on the white square in the theme.
        $left = 28 + 4 * $step;
        $bottom = 128.8 + 4 * $step;
        $content .= "0.05 g\n";
        for ($row = 0; $row < $count; ++$row) {
            for ($column = 0; $column < $count; ++$column) {
                if ($matrix->getBlockValue($row, $column) === 1) {
                    $content .= sprintf("%.4F %.4F %.4F %.4F re\n",
                        $left + $column * $step, $bottom + ($count - $row - 1) * $step, $step, $step);
                }
            }
        }
        $content .= "f\n";

        $pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
        $xref = "0000000000 65535 f \n";
        foreach ($theme['objects'] as $index => $encoded) {
            $id = $index + 1;
            $object = $id === $theme['dynamic']
                ? '<< /Length '.strlen($content)." >>\nstream\n".$content."\nendstream"
                : base64_decode($encoded, true);
            $xref .= sprintf("%010d 00000 n \n", strlen($pdf));
            $pdf .= "$id 0 obj\n".$object."\nendobj\n";
        }
        $offset = strlen($pdf);
        $entries = count($theme['objects']) + 1;
        $catalog = $theme['catalog'];
        return $pdf."xref\n0 $entries\n".$xref."trailer\n<< /Size $entries /Root $catalog 0 R >>\nstartxref\n".$offset."\n%%EOF\n";
    }

    private static function label(array $font, string $text, int $x, int $y, float $size, string $color, float $spacing = 0): string
    {
        $hex = '';
        foreach (mb_str_split($text, encoding: 'UTF-8') as $char) {
            if (!isset($font['glyphs'][$char])) {
                throw new \UnexpectedValueException('Unsupported ticket PDF character');
            }
            $hex .= $font['glyphs'][$char];
        }
        return sprintf("%s rg BT %s %.2F Tf %.2F Tc %d %d Td <%s> Tj ET\n",
            $color, $font['resource'], $size, $spacing, $x, $y, $hex);
    }
}
