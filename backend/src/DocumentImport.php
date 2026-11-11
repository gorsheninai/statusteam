<?php
declare(strict_types=1);

namespace StatusTeam;

final class DocumentImport
{
    public function __construct(private Db $db) {}

    /** @param list<array{id:string,version:string,href:string,body:string}> $documents */
    public function store(array $documents): void
    {
        if (!$documents || !array_is_list($documents)) {
            throw new \InvalidArgumentException('Expected a nonempty document list');
        }

        $seen = [];
        foreach ($documents as $document) {
            if (!is_array($document)) {
                throw new \InvalidArgumentException('Expected document metadata and body');
            }
            $id = $document['id'] ?? null;
            $version = $document['version'] ?? null;
            $href = $document['href'] ?? null;
            $body = $document['body'] ?? null;
            if (!is_string($id) || !preg_match('/^[a-z_]{2,40}$/D', $id) || isset($seen[$id])
                || !is_string($version) || trim($version) === '' || strlen($version) > 100
                || !is_string($href) || trim($href) === '' || strlen($href) > 500
                || !is_string($body) || trim($body) === '' || strlen($body) > 1_000_000
                || !mb_check_encoding($body, 'UTF-8') || str_contains($body, "\0")) {
                throw new \InvalidArgumentException('Invalid document or duplicate ID');
            }
            $seen[$id] = true;
        }

        $db = $this->db;
        $db->tx(function () use ($db, $documents) {
            $db->one('SELECT id FROM inventory WHERE id=1 FOR UPDATE');
            foreach ($documents as $document) {
                ['id' => $id, 'version' => $version, 'href' => $href, 'body' => $body] = $document;
                $sha = hash('sha256', $body);
                $old = $db->one('SELECT sha256,href FROM documents WHERE id=? AND version=?', [$id, $version]);
                if ($old && ($old['sha256'] !== $sha || $old['href'] !== $href)) {
                    throw new \RuntimeException('Document version immutable; assign a new version');
                }
                if (!$old) {
                    $db->run(
                        'INSERT INTO documents(id,version,body,sha256,href) VALUES(?,?,?,?,?)',
                        [$id, $version, $body, $sha, $href],
                    );
                }
                $db->run('UPDATE documents SET active=0 WHERE id=?', [$id]);
                $db->run('UPDATE documents SET active=1 WHERE id=? AND version=?', [$id, $version]);
            }
        });
    }
}
