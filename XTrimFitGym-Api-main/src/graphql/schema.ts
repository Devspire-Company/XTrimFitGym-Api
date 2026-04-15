import { makeExecutableSchema } from '@graphql-tools/schema';
import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const typeDefsArray = loadFilesSync(path.join(__dirname, './**/*.graphql'));
const resolversArray = loadFilesSync(
	path.join(__dirname, './**/*-resolvers.{ts,js}')
);

const schema = makeExecutableSchema({
	typeDefs: mergeTypeDefs(typeDefsArray),
	resolvers: mergeResolvers(resolversArray),
});

export default schema;
