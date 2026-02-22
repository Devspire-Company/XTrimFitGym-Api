-- Database 'railway' is created by MYSQL_DATABASE env; we just create the table
USE railway;

CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  authDateTime VARCHAR(50) NOT NULL,
  authDate VARCHAR(20) NOT NULL,
  authTime VARCHAR(20) NOT NULL,
  direction VARCHAR(10) NOT NULL,
  deviceName VARCHAR(255) NOT NULL DEFAULT '',
  deviceSerNum VARCHAR(255) NOT NULL DEFAULT '',
  personName VARCHAR(255) NOT NULL DEFAULT '',
  cardNo VARCHAR(255) NULL
);
