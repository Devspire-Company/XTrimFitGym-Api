import mysql from 'mysql2/promise';

export interface MySQLConfig {
	host: string;
	port: number;
	user: string;
	password: string;
	database: string;
}

let connection: mysql.Connection | null = null;
let mysqlConfig: MySQLConfig | null = null;

/**
 * Set MySQL config (useful for storing config even if initial connection fails)
 */
export const setMySQLConfig = (config: MySQLConfig): void => {
	mysqlConfig = config;
};

export const connectMySQL = async (
	config: MySQLConfig,
): Promise<mysql.Connection> => {
	// Store config for potential reconnection
	mysqlConfig = config;

	// Check if connection exists and is still valid
	if (connection) {
		try {
			// Try to ping the connection to see if it's still alive
			await connection.ping();
			return connection;
		} catch (error) {
			// Connection is dead, reset it
			connection = null;
		}
	}

	try {
		connection = await mysql.createConnection({
			host: config.host,
			port: config.port,
			user: config.user,
			password: config.password,
			database: config.database,
			multipleStatements: false,
			// Render → Railway TCP proxy: fail fast instead of hanging; keep TCP alive across idle
			connectTimeout: 25_000,
			enableKeepAlive: true,
			keepAliveInitialDelay: 10_000,
		});

		// Verify we're connected to the correct database
		const [dbRows] = await connection.execute<mysql.RowDataPacket[]>(
			'SELECT DATABASE() as current_db',
		);
		const currentDb = dbRows[0]?.current_db;

		console.log(`MySQL database connected successfully`);
		console.log(`   Database: ${currentDb || config.database}`);
		console.log(`   Host: ${config.host}:${config.port}`);

		return connection;
	} catch (error: any) {
		console.error('Error connecting to MySQL:', error);
		const errorMessage = error?.message || 'Unknown error';
		const errorCode = error?.code || 'UNKNOWN';
		throw new Error(
			`Failed to connect to MySQL: ${errorMessage} (${errorCode}). Please check your database configuration.`,
		);
	}
};

export const getMySQLConnection = (): mysql.Connection | null => {
	return connection;
};

/**
 * Ensure MySQL connection is available, attempt to reconnect if needed
 */
export const ensureMySQLConnection = async (): Promise<mysql.Connection> => {
	if (connection) {
		try {
			await connection.ping();
			return connection;
		} catch (error) {
			// Connection is dead, reset it
			connection = null;
		}
	}

	// Try to reconnect if config is available
	if (mysqlConfig) {
		try {
			return await connectMySQL(mysqlConfig);
		} catch (error) {
			throw new Error(
				'MySQL connection not available. Please check your database configuration and ensure MySQL is running.',
			);
		}
	}

	// If no config is stored, try to get it from environment variables
	const fallbackConfig: MySQLConfig = {
		host: process.env.MYSQLHOST || 'mysql.railway.internal',
		port: Number(process.env.MYSQLPORT) || 3306,
		user: process.env.MYSQLUSER || 'root',
		password: process.env.MYSQLPASSWORD || '',
		database: process.env.MYSQLDATABASE || 'railway',
	};

	try {
		// Store the config for future use
		mysqlConfig = fallbackConfig;
		return await connectMySQL(fallbackConfig);
	} catch (error: any) {
		const errorMessage = error?.message || 'Unknown error';
		throw new Error(
			`MySQL connection failed: ${errorMessage}. Please check your database configuration and ensure MySQL is running.`,
		);
	}
};

export const closeMySQLConnection = async (): Promise<void> => {
	if (connection) {
		await connection.end();
		connection = null;
		console.log('MySQL connection closed');
	}
};
