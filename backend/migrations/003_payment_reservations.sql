ALTER TABLE orders ADD COLUMN reserve_until DATETIME(6) NULL,
 ADD INDEX(status,reserve_until);
ALTER TABLE payments ADD COLUMN capture_requested_at DATETIME(6) NULL;
