#!/bin/bash
set -e
# Create ivms user (MySQL 5.5: no IF NOT EXISTS; init runs only on first start)
mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" -e "
CREATE USER 'ivms'@'%' IDENTIFIED BY '${MYSQL_IVMS_PASSWORD}';
GRANT ALL PRIVILEGES ON railway.* TO 'ivms'@'%';
FLUSH PRIVILEGES;
"
