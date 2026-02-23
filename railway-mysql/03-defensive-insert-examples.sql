-- Defensive attendance inserts for iVMS-4200 / MySQL
-- Use these patterns so duplicate or retry inserts do not cause connection failure.
-- IVMS may send raw INSERT; if your setup can use a stored procedure or proxy, use SP_Attendance_Insert.

-- ---------------------------------------------------------------------------
-- 1) INSERT IGNORE: duplicate ATTENDANCE_id is ignored (no error, connection stays up)
-- ---------------------------------------------------------------------------
-- INSERT IGNORE INTO attendance (
--   ATTENDANCE_id, eventTime, authDate, authTime, personName, cardNo, direction, deviceName, deviceSerNum
-- ) VALUES (
--   ?, ?, ?, ?, ?, ?, ?, ?, ?
-- );

-- ---------------------------------------------------------------------------
-- 2) ON DUPLICATE KEY UPDATE: duplicate ATTENDANCE_id updates the row instead of failing
-- ---------------------------------------------------------------------------
-- INSERT INTO attendance (
--   ATTENDANCE_id, eventTime, authDate, authTime, personName, cardNo, direction, deviceName, deviceSerNum
-- ) VALUES (
--   ?, ?, ?, ?, ?, ?, ?, ?, ?
-- )
-- ON DUPLICATE KEY UPDATE
--   eventTime    = VALUES(eventTime),
--   authDate     = VALUES(authDate),
--   authTime     = VALUES(authTime),
--   personName   = VALUES(personName),
--   cardNo       = VALUES(cardNo),
--   direction    = VALUES(direction),
--   deviceName   = VALUES(deviceName),
--   deviceSerNum = VALUES(deviceSerNum);

-- ---------------------------------------------------------------------------
-- 3) Stored procedure: single point for logging + defensive insert
-- Call this from a proxy or middleware if IVMS cannot call it directly.
-- ---------------------------------------------------------------------------
USE railway;

DROP PROCEDURE IF EXISTS SP_Attendance_Insert;

DELIMITER ;;
CREATE PROCEDURE SP_Attendance_Insert(
  IN p_ATTENDANCE_id VARCHAR(50),
  IN p_eventTime     DATETIME,
  IN p_authDate      VARCHAR(20),
  IN p_authTime      VARCHAR(20),
  IN p_personName    VARCHAR(255),
  IN p_cardNo        VARCHAR(255),
  IN p_direction     VARCHAR(10),
  IN p_deviceName    VARCHAR(255),
  IN p_deviceSerNum  VARCHAR(255)
)
BEGIN
  DECLARE v_dup INT DEFAULT 0;

  -- Log every attempt (including duplicates)
  INSERT INTO attendance_insert_log (
    attempted_at, ATTENDANCE_id, eventTime, personName, cardNo, direction, deviceName, deviceSerNum
  ) VALUES (
    NOW(), p_ATTENDANCE_id, p_eventTime, p_personName, p_cardNo, p_direction, p_deviceName, p_deviceSerNum
  );

  -- Defensive insert: ignore duplicate key so connection is not dropped
  INSERT IGNORE INTO attendance (
    ATTENDANCE_id, eventTime, authDate, authTime, personName, cardNo, direction, deviceName, deviceSerNum
  ) VALUES (
    p_ATTENDANCE_id, p_eventTime, IFNULL(p_authDate,''), IFNULL(p_authTime,''),
    IFNULL(p_personName,''), p_cardNo, IFNULL(p_direction,'IN'), IFNULL(p_deviceName,''), IFNULL(p_deviceSerNum,'')
  );

END;;
DELIMITER ;

-- Example call:
-- CALL SP_Attendance_Insert(
--   'evt-001', '2026-02-23 14:30:00', '2026-02-23', '14:30:00',
--   'John Doe', '12345', 'IN', 'XTrimFitGym-Attendance', 'DS-K1A802...'
-- );
