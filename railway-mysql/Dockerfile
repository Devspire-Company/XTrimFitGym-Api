# MySQL 5.7 - uses mysql_native_password by default (compatible with iVMS-4200)
FROM mysql:5.7

EXPOSE 3306

# Init scripts run in alphabetical order on first start only
COPY 01-attendance.sql /docker-entrypoint-initdb.d/
COPY 02-init-user.sh /docker-entrypoint-initdb.d/
RUN chmod +x /docker-entrypoint-initdb.d/02-init-user.sh
