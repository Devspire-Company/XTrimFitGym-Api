import type { CodegenConfig } from '@graphql-codegen/cli';

/**
 * Alternative codegen config that uses schema files from the API repository
 * instead of fetching via introspection.
 * 
 * Usage:
 * 1. Make sure the API repo is in a sibling directory: ../XTrimFitGym-Api
 * 2. Run: graphql-codegen --config codegen-schema-files.ts
 * 
 * Or update package.json to add:
 * "generate:schema": "graphql-codegen --config codegen-schema-files.ts"
 */

const config: CodegenConfig = {
	// Schema source: Use schema files from API repository
	schema: [
		// Update this path to match your API repository location
		'../XTrimFitGym-Api/src/graphql/**/*.graphql',
	],
	// Documents: All GraphQL operations in the app
	documents: ['graphql/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
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

