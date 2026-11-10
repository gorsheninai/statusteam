<?php
declare(strict_types=1);
namespace StatusTeam;
use PDO;
final class Db {
    public PDO $pdo;
    public function __construct(array $c) {
        $this->pdo = new PDO($c['dsn'], $c['user'], $c['password'], [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES=>false, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
        $this->pdo->exec("SET time_zone = '+00:00'");
    }
    public function run(string $sql, array $p=[]): \PDOStatement { $s=$this->pdo->prepare($sql); $s->execute($p); return $s; }
    public function one(string $sql, array $p=[]): ?array { return $this->run($sql,$p)->fetch() ?: null; }
    public function tx(callable $fn): mixed {
        $this->pdo->beginTransaction();
        try { $v=$fn(); $this->pdo->commit(); return $v; }
        catch (\Throwable $e) { if($this->pdo->inTransaction()) $this->pdo->rollBack(); throw $e; }
    }
}
