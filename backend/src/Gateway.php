<?php
declare(strict_types=1);
namespace StatusTeam;
interface Gateway { public function call(string $method,string $path,?array $body=null,?string $key=null): array; }
