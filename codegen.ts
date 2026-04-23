import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
	schema: '../../api/XTrimFitGym-Api-clean/src/graphql/**/*.graphql',
	// Documents: All GraphQL operations in the app
	documents: ['graphql/mutations.ts', 'graphql/queries.ts', 'app/**/*.{ts,tsx}'],
	// Output configuration
	generates: {
		'./graphql/generated/types.ts': {
			plugins: [
				'typescript',
				'typescript-operations',
				'typescript-react-apollo',
			],
			config: {
				reactApolloVersion: 3,
				withHooks: true,
				withComponent: false,
				withHOC: false,
				// Apollo Client 4: hooks live in @apollo/client/react, not on the core namespace
				apolloReactHooksImportFrom: '@apollo/client/react',
				// Generate types for scalars
				scalars: {
					DateTime: 'string',
					Date: 'string',
				},
				// Naming conventions
				skipTypename: false,
				// Use const enums for better performance
				enumsAsTypes: true,
				// Generate input types
				skipDocumentsValidation: false,
			},
		},
	},
	// Ignore patterns
	ignoreNoDocuments: true,
};

export default config;
