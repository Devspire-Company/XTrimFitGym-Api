-- Attendance table for iVMS-4200 Third-Party Database (DS-K1A802AMF)
-- Schema designed to avoid insert failures that cause IVMS to disconnect and retry stale/corrupt data.
-- Charset: utf8mb4. Primary key: id (VARCHAR). No strict constraints.

USE railway;

ALTER DATABASE railway CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance (
  id             VARCHAR(50)  NOT NULL,
  authDateTime   DATETIME     NOT NULL,
  authDate       VARCHAR(20)  DEFAULT '',
  authTime       VARCHAR(20)  DEFAULT '',
  personName     VARCHAR(255) DEFAULT '',
  cardNo         VARCHAR(255) DEFAULT NULL,
  direction      VARCHAR(10)  DEFAULT 'IN',
  deviceName     VARCHAR(255) DEFAULT '',
  deviceSerNum   VARCHAR(255) DEFAULT '',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Log table: every insert attempt (BEFORE INSERT trigger logs here; includes attempts that later fail on duplicate)
CREATE TABLE IF NOT EXISTS attendance_insert_log (
  id             INT          AUTO_INCREMENT PRIMARY KEY,
  attempted_at   DATETIME     NOT NULL,
  attendance_id  VARCHAR(50)  NOT NULL,
  authDateTime   DATETIME     NULL,
  personName     VARCHAR(255) DEFAULT NULL,
  cardNo         VARCHAR(255) DEFAULT NULL,
  direction      VARCHAR(10)  DEFAULT NULL,
  deviceName     VARCHAR(255) DEFAULT NULL,
  deviceSerNum   VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trigger: log each attempt before it is applied (runs even if the insert later fails on duplicate key)
DROP TRIGGER IF EXISTS tr_attendance_before_insert;
DELIMITER ;;
CREATE TRIGGER tr_attendance_before_insert
BEFORE INSERT ON attendance
FOR EACH ROW
BEGIN
  INSERT INTO attendance_insert_log (
    attempted_at, attendance_id, authDateTime, personName, cardNo, direction, deviceName, deviceSerNum
  ) VALUES (
    NOW(), NEW.id, NEW.authDateTime, NEW.personName, NEW.cardNo, NEW.direction, NEW.deviceName, NEW.deviceSerNum
  );
END;;
DELIMITER ;
