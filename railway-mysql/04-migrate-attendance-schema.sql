-- Migration: old attendance table (id INT, authDateTime VARCHAR) -> new schema (ATTENDANCE_id VARCHAR, eventTime DATETIME)
-- Run this ONCE on an existing database that already has the old attendance table.
-- Backup your data before running.

USE railway;

-- 1) Create new table with corrected schema (if not exists)
CREATE TABLE IF NOT EXISTS attendance_new (
  ATTENDANCE_id   VARCHAR(50)  NOT NULL,
  eventTime       DATETIME     NOT NULL,
  authDate        VARCHAR(20)  DEFAULT '',
  authTime        VARCHAR(20)  DEFAULT '',
  personName      VARCHAR(255) DEFAULT '',
  cardNo          VARCHAR(255) DEFAULT NULL,
  direction       VARCHAR(10)  DEFAULT 'IN',
  deviceName      VARCHAR(255) DEFAULT '',
  deviceSerNum    VARCHAR(255) DEFAULT '',
  PRIMARY KEY (ATTENDANCE_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) Create log table if not exists
CREATE TABLE IF NOT EXISTS attendance_insert_log (
  id             INT          AUTO_INCREMENT PRIMARY KEY,
  attempted_at   DATETIME     NOT NULL,
  ATTENDANCE_id  VARCHAR(50)  NOT NULL,
  eventTime      DATETIME     NULL,
  personName     VARCHAR(255) DEFAULT NULL,
  cardNo         VARCHAR(255) DEFAULT NULL,
  direction      VARCHAR(10)  DEFAULT NULL,
  deviceName     VARCHAR(255) DEFAULT NULL,
  deviceSerNum   VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) Copy data from old table (id, authDateTime, authDate, authTime, direction, deviceName, deviceSerNum, personName, cardNo)
--    Generate ATTENDANCE_id as string from id + authDateTime to keep uniqueness
INSERT IGNORE INTO attendance_new (
  ATTENDANCE_id, eventTime, authDate, authTime, personName, cardNo, direction, deviceName, deviceSerNum
)
SELECT
  CONCAT('mig-', id, '-', REPLACE(REPLACE(REPLACE(authDateTime, ' ', '-'), ':', ''), '-', '')),
  CASE
    WHEN authDateTime REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN STR_TO_DATE(LEFT(authDateTime, 19), '%Y-%m-%d %H:%i:%s')
    ELSE NOW()
  END,
  IFNULL(authDate, ''),
  IFNULL(authTime, ''),
  IFNULL(personName, ''),
  cardNo,
  IFNULL(direction, 'IN'),
  IFNULL(deviceName, ''),
  IFNULL(deviceSerNum, '')
FROM attendance
WHERE 1=1;

-- 4) Replace old table with new
RENAME TABLE attendance TO attendance_old_backup, attendance_new TO attendance;

-- 5) Recreate trigger on new attendance table
DROP TRIGGER IF EXISTS tr_attendance_before_insert;
DELIMITER ;;
CREATE TRIGGER tr_attendance_before_insert
BEFORE INSERT ON attendance
FOR EACH ROW
BEGIN
  INSERT INTO attendance_insert_log (
    attempted_at, ATTENDANCE_id, eventTime, personName, cardNo, direction, deviceName, deviceSerNum
  ) VALUES (
    NOW(), NEW.ATTENDANCE_id, NEW.eventTime, NEW.personName, NEW.cardNo, NEW.direction, NEW.deviceName, NEW.deviceSerNum
  );
END;;
DELIMITER ;

-- 6) Optional: drop backup after verifying
-- DROP TABLE attendance_old_backup;
