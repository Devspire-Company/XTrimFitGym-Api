# Generated GraphQL Types

This directory contains automatically generated TypeScript types from your GraphQL schema and operations.

## ⚠️ Do Not Edit

**These files are automatically generated.** Any manual changes will be overwritten when you run `npm run generate`.

## Usage

After running `npm run generate`, import types from this file:

```typescript
import { 
  // Mutation types
  LoginMutation,
  LoginMutationVariables,
  CreateUserMutation,
  CreateUserMutationVariables,
  
  // Query types (if you have queries)
  GetUserQuery,
  GetUserQueryVariables,
  
  // Type definitions
  User,
  RoleType,
  AuthResponse,
  MemberDetails,
  CoachDetails,
} from '@/graphql/generated/types';
```

## Example: Typed Mutation Hook

```typescript
import { useMutation } from '@apollo/client/react';
import { LOGIN_MUTATION } from '@/graphql/mutations';
import { LoginMutation, LoginMutationVariables } from '@/graphql/generated/types';

const [login, { loading, error }] = useMutation<LoginMutation, LoginMutationVariables>(
  LOGIN_MUTATION,
  {
    onCompleted: (data) => {
      // data is now fully typed!
      // TypeScript knows: data.login.user.firstName is a string
      // TypeScript knows: data.login.token is a string
      const user = data.login.user;
      const token = data.login.token;
    },
  }
);
```

## Regenerating Types

Run `npm run generate` whenever:
- The GraphQL schema changes in the API
- You add or modify GraphQL operations (queries/mutations)
- You want to ensure types are up to date

