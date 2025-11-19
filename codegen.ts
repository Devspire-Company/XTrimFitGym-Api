import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
	schema: './src/graphql/**/*.graphql',
	generates: {
		'./src/types/types.ts': {
			plugins: ['typescript', 'typescript-resolvers'],
			config: {
				contextType: './src/context/auth-context.ts#IAuthContext',
				defaultMapper: 'Partial<{T}>',
			},
		},
	},
};

export default config;
