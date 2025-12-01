import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import express from 'express';
import cors from 'cors';
import connectDb from './database/connectDb.js';
import cookieParser from 'cookie-parser';
import schema from './graphql/schema.js';
import authContext from './context/auth-context.js';

const port = Number(process.env.PORT) || 8080;

const server = new ApolloServer({ schema });
const app = express();

// CORS configuration
app.use(
	cors({
		origin: true, // Allow all origins in development
		credentials: true, // Allow cookies
		methods: ['GET', 'POST', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
	})
);

async function startServer() {
	await server.start();
	await connectDb();

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
		})
	);

	// Listen on all network interfaces (0.0.0.0) to allow connections from devices
	app.listen(port, '0.0.0.0', () => {
		console.log(`Server is up and running @ http://localhost:${port}/graphql`);
		console.log(
			`Server accessible from network @ http://0.0.0.0:${port}/graphql`
		);
		console.log('\nTo connect from devices:');
		console.log('  - Android Emulator: http://10.0.2.2:8080/graphql');
		console.log('  - iOS Simulator: http://localhost:8080/graphql');
		console.log('  - Physical devices: http://YOUR_LOCAL_IP:8080/graphql');
	});
}

startServer();
