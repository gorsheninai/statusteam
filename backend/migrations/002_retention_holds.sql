CREATE TABLE retention_holds (
 kind VARCHAR(24) NOT NULL, reference_id CHAR(32) NOT NULL,
 reason_code VARCHAR(64) NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(kind,reference_id)
) ENGINE=InnoDB;
