<?php
declare(strict_types=1);

namespace StatusTeam;

use Endroid\QrCode\Bacon\MatrixFactory;
use Endroid\QrCode\QrCode;

final class TicketPdf
{
    public static function render(string $number, string $token, bool $test, int $amount, string $orderId): string
    {
        $font = json_decode(file_get_contents(__DIR__.'/TicketFont.json'), true, flags: JSON_THROW_ON_ERROR);
        $fontBytes = base64_decode($font['font'], true);
        $widths = '';
        foreach ($font['widths'] as $id => $width) {
            $widths .= "$id [$width] ";
        }

        $unicode = "/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n"
            ."/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n"
            ."/CMapName /TicketUnicode def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n";
        foreach (array_chunk($font['glyphs'], 100, true) as $chunk) {
            $unicode .= count($chunk)." beginbfchar\n";
            foreach ($chunk as $char => $id) {
                $unicode .= sprintf("<%04X> <%04X>\n", $id, $char);
            }
            $unicode .= "endbfchar\n";
        }
        $unicode .= "endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend\n";

        $content = "0.10 0.10 0.10 rg\n284 432 116 116 re f\n";
        foreach ([
            [11, 28, 545, $test ? 'ТЕСТОВЫЙ ЭЛЕКТРОННЫЙ БИЛЕТ' : 'ЭЛЕКТРОННЫЙ БИЛЕТ'],
            [23, 28, 510, TicketDetails::EVENT],
            [11, 28, 485, $number],
            [8, 28, 466, 'Заказ '.$orderId],
            [16, 28, 438, TicketDetails::price($amount)],
            [13, 28, 402, TicketDetails::DATE],
            [10, 28, 383, TicketDetails::TIME],
            [12, 28, 363, TicketDetails::VENUE],
            [9, 28, 346, TicketDetails::VENUE_ADDRESS],
            [40, 298, 476, TicketDetails::AGE],
            [10, 28, 125, TicketDetails::ADMISSION],
            [9, 28, 107, TicketDetails::ORGANIZER],
            [9, 28, 92, TicketDetails::REGISTRATION],
            [9, 28, 77, TicketDetails::LEGAL_ADDRESS],
            [9, 28, 58, 'Возврат: '.TicketDetails::REFUNDS_EMAIL],
            [9, 28, 42, 'Условия покупки и возврата'],
        ] as [$fontSize, $x, $y, $label]) {
            $color = $fontSize === 40 ? '1 g' : '0.10 g';
            $hex = '';
            foreach (mb_str_split($label) as $char) {
                $hex .= sprintf('%04X', $font['glyphs'][mb_ord($char)] ?? $font['glyphs'][63]);
            }
            $content .= "$color BT /F1 $fontSize Tf $x $y Td <$hex> Tj ET\n";
        }

        $matrix = (new MatrixFactory())->create(new QrCode(data: $token));
        $count = $matrix->getBlockCount();
        $size = floor(172 / $count * 100) / 100;
        $left = (420 - $count * $size) / 2;
        $content .= "0 g\n";
        for ($row = 0; $row < $count; ++$row) {
            for ($column = 0; $column < $count; ++$column) {
                if ($matrix->getBlockValue($row, $column) === 1) {
                    $x = $left + $column * $size;
                    $y = 150 + ($count - $row - 1) * $size;
                    $content .= sprintf("%.2F %.2F %.2F %.2F re\n", $x, $y, $size, $size);
                }
            }
        }
        $content .= "f\n";

        $stream = static fn (string $data, string $extra=''): string =>
            '<< /Length '.strlen($data)." $extra >>\nstream\n".$data."\nendstream";
        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 420 580] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R /Annots [10 0 R] >>',
            '<< /Type /Font /Subtype /Type0 /BaseFont /DejaVuSans /Encoding /Identity-H /DescendantFonts [6 0 R] /ToUnicode 9 0 R >>',
            $stream($content),
            '<< /Type /Font /Subtype /CIDFontType2 /BaseFont /DejaVuSans /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor 7 0 R /CIDToGIDMap /Identity /W ['.$widths.'] >>',
            '<< /Type /FontDescriptor /FontName /DejaVuSans /Flags 32 /FontBBox [-1021 -463 1794 1233] /ItalicAngle 0 /Ascent 928 /Descent -236 /CapHeight 729 /StemV 80 /FontFile2 8 0 R >>',
            $stream($fontBytes, '/Length1 '.strlen($fontBytes)),
            $stream($unicode),
            '<< /Type /Annot /Subtype /Link /Rect [27 39 174 52] /Border [0 0 0] /A << /S /URI /URI ('.TicketDetails::TERMS_URL.') >> >>',
        ];

        $pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
        $xref = "0000000000 65535 f \n";
        foreach ($objects as $index => $object) {
            $xref .= sprintf("%010d 00000 n \n", strlen($pdf));
            $pdf .= ($index + 1)." 0 obj\n".$object."\nendobj\n";
        }
        $offset = strlen($pdf);
        $entries = count($objects) + 1;
        return $pdf."xref\n0 $entries\n".$xref."trailer\n<< /Size $entries /Root 1 0 R >>\nstartxref\n".$offset."\n%%EOF\n";
    }
}
