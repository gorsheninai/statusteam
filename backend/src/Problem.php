<?php
declare(strict_types=1);
namespace StatusTeam;
final class Problem extends \RuntimeException {
    public function __construct(public int $status, string $code) {parent::__construct($code);}
}
