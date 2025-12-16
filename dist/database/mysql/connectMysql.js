import mysql from 'mysql2/promise';
let connection = null;
export const connectMySQL = async (config) => {
    if (connection && connection.state !== 'disconnected') {
        return connection;
    }
    try {
        connection = await mysql.createConnection({
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password,
            database: config.database,
            multipleStatements: false,
        });
        console.log('MySQL database connected successfully');
        return connection;
    }
    catch (error) {
        console.error('Error connecting to MySQL:', error);
        throw error;
    }
};
export const getMySQLConnection = () => {
    return connection;
};
export const closeMySQLConnection = async () => {
    if (connection) {
        await connection.end();
        connection = null;
        console.log('MySQL connection closed');
    }
};
