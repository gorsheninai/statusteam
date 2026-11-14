<?php
declare(strict_types=1);

namespace StatusTeam;

use Endroid\QrCode\Bacon\MatrixFactory;
use Endroid\QrCode\QrCode;

final class TicketPdf
{
    public static function render(string $number, string $token, bool $test): string
    {
        $matrix = (new MatrixFactory())->create(new QrCode(data: $token));
        $count = $matrix->getBlockCount();
        $size = 6;
        $left = (420 - $count * $size) / 2;
        $content = '';
        foreach ([
            [28, 535, 'STATUS TEAM'],
            [20, 500, 'Puls Kontinenta'],
            [14, 468, $number],
            [12, 443, $test ? 'TEST TICKET' : 'EVENT TICKET'],
            [12, 138, '30 November 2026 | 18+ | Moscow time'],
            [12, 114, 'Doors 18:30 | Show 20:00'],
            [12, 90, 'LOTTE HOTEL MOSCOW'],
            [12, 70, '8 Novinsky Boulevard, Bldg. 2, Moscow'],
            [12, 46, 'One guest | One admission | Unassigned seating'],
        ] as [$fontSize, $y, $label]) {
            $label = strtr($label, ["\\" => "\\\\", '(' => '\(', ')' => '\)']);
            $content .= "BT /F1 $fontSize Tf 40 $y Td ($label) Tj ET\n";
        }

        for ($row = 0; $row < $count; ++$row) {
            for ($column = 0; $column < $count; ++$column) {
                if ($matrix->getBlockValue($row, $column) === 1) {
                    $x = $left + $column * $size;
                    $y = 165 + ($count - $row - 1) * $size;
                    $content .= "$x $y $size $size re\n";
                }
            }
        }
        $content .= "f\n";
        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 420 580] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
            '<< /Length '.strlen($content)." >>\nstream\n".$content."endstream",
        ];

        $pdf = "%PDF-1.4\n";
        $xref = "0000000000 65535 f \n";
        foreach ($objects as $index => $object) {
            $xref .= sprintf("%010d 00000 n \n", strlen($pdf));
            $pdf .= ($index + 1)." 0 obj\n".$object."\nendobj\n";
        }
        $offset = strlen($pdf);
        return $pdf."xref\n0 6\n".$xref."trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n".$offset."\n%%EOF\n";
    }
}
