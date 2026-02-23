# MySQL 5.5 - documented compatible with iVMS-4200 3.13.x (SSL off, old protocol)
FROM mysql:5.5

EXPOSE 3306

# Disable SSL so iVMS client can connect (it does not support SSL)
COPY custom.cnf /etc/mysql/conf.d/custom.cnf

# Init scripts run in alphabetical order on first start only
COPY 01-attendance.sql /docker-entrypoint-initdb.d/
COPY 02-init-user.sh /docker-entrypoint-initdb.d/
COPY 03-defensive-insert-examples.sql /docker-entrypoint-initdb.d/
RUN chmod +x /docker-entrypoint-initdb.d/02-init-user.sh
