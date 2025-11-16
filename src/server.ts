import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import express from 'express';
import connectDb from './database/connectDb';
import cookieParser from 'cookie-parser';

const typeDefs = `
type Kita {
  message: String
  author: String
}

type Query {
  msg: Kita
}
`;
const resolvers = {};
const port = process.env.PORT ?? 8080;

const server = new ApolloServer({ typeDefs, resolvers });
const app = express();

async function startServer() {
	await server.start();
	await connectDb();

	app.use(cookieParser(), express.json(), expressMiddleware(server));

	app.listen(port, () => {
		console.log(`Server is up and runnin @ http://localhost:${port}/graphql`);
	});
}

startServer();
