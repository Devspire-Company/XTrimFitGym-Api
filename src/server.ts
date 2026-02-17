import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';
import connectDb from './database/connectDb.js';
import { connectMySQL } from './database/mysql/connectMysql.js';
import { attendanceMonitor } from './services/attendance-monitor.js';
import cookieParser from 'cookie-parser';
import schema from './graphql/schema.js';
import authContext from './context/auth-context.js';

const port = Number(process.env.PORT) || 8000;

const server = new ApolloServer({ schema });
const app = express();
const httpServer = createServer(app);

// CORS configuration
app.use(
	cors({
		origin: true, // Allow all origins in development
		credentials: true, // Allow cookies
		methods: ['GET', 'POST', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
	}),
);

async function startServer() {
	await server.start();
	await connectDb();

	// Connect to MySQL for attendance monitoring
	// Store config even if connection fails initially - it can be retried later
	const mysqlConfig = {
		host: process.env.MYSQLHOST || 'mysql.railway.internal',
		port: Number(process.env.MYSQLPORT) || 3306,
		user: process.env.MYSQLUSER || 'root',
		password: process.env.MYSQLPASSWORD || '',
		database: process.env.MYSQLDATABASE || 'railway',
	};

	// Store config for potential reconnection attempts
	const { setMySQLConfig } = await import('./database/mysql/connectMysql.js');
	setMySQLConfig(mysqlConfig);

	try {
		await connectMySQL(mysqlConfig);
		console.log('✅ MySQL connected for attendance monitoring');

		// Initialize and start attendance monitoring
		// Don't throw if initialization fails - it might just be that the table doesn't exist yet
		try {
			await attendanceMonitor.initialize();
			attendanceMonitor.startPolling();
			console.log(
				'✅ Attendance monitor started - listening for real-time updates',
			);
		} catch (initError) {
			// If initialization fails, still start polling - it will check for table existence
			console.warn(
				'⚠️  Attendance monitor initialization had issues, but polling will continue',
			);
			console.warn(
				'   It will automatically detect when the attendance table is created.',
			);
			attendanceMonitor.startPolling();
		}
	} catch (error: any) {
		console.error(
			'⚠️  Failed to connect to MySQL at startup:',
			error?.message || error,
		);
		console.error(
			'   The server will continue, but attendance features will not be available.',
		);
		console.error(
			'   Connection will be retried when attendance queries are made.',
		);
		console.error(
			`   Config: ${mysqlConfig.host}:${mysqlConfig.port}/${mysqlConfig.database}`,
		);
	}

	// Middleware order matters! cookieParser must come before expressMiddleware
	app.use(cookieParser()); // Global cookie parser
	app.use(express.json()); // Global JSON parser

	// Upload routes (must come before GraphQL)
	const uploadRouter = await import('./routes/upload.js');
	app.use('/api/upload', uploadRouter.default);

	app.use(
		'/graphql',
		expressMiddleware(server, {
			context: ({ req, res }) => authContext({ req, res }),
		}),
	);

	// WebSocket server for subscriptions
	const wsServer = new WebSocketServer({
		server: httpServer,
		path: '/graphql',
	});

	const serverCleanup = useServer(
		{
			schema,
			context: async (ctx) => {
				// Extract auth token from connection params
				const authHeader = ctx.connectionParams?.authorization as
					| string
					| undefined;
				const token = authHeader?.replace('Bearer ', '') || '';
				// Create a mock request/response for auth context
				const mockReq = {
					headers: { authorization: `Bearer ${token}` },
				} as any;
				const mockRes = {} as any;
				const authCtx = await authContext({ req: mockReq, res: mockRes });
				// Also add user directly for compatibility with subscription resolvers
				return {
					...authCtx,
					user: authCtx.auth.user, // Add user for backward compatibility
				};
			},
		},
		wsServer,
	);

	// Listen on all network interfaces (0.0.0.0) to allow connections from devices
	httpServer.listen(port, '0.0.0.0', () => {
		console.log(`Server is up and running @ http://localhost:${port}/graphql`);
		console.log(
			`Server accessible from network @ http://0.0.0.0:${port}/graphql`,
		);
		console.log(`WebSocket server running @ ws://localhost:${port}/graphql`);
		console.log('\nTo connect from devices:');
		console.log(`  - Android Emulator: http://10.0.2.2:${port}/graphql`);
		console.log(`  - iOS Simulator: http://localhost:${port}/graphql`);
		console.log(`  - Physical devices: http://YOUR_LOCAL_IP:${port}/graphql`);
	});
}

startServer();
