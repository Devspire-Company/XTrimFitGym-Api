#!/bin/bash
set -e
# Create ivms user (MySQL 5.7 uses mysql_native_password by default - works with iVMS)
mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" -e "
CREATE USER IF NOT EXISTS 'ivms'@'%' IDENTIFIED BY '${MYSQL_IVMS_PASSWORD}';
GRANT ALL PRIVILEGES ON railway.* TO 'ivms'@'%';
FLUSH PRIVILEGES;
"
