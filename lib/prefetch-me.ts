import client from '@/lib/apollo-client';
import { MeDocument } from '@/graphql/generated/types';
import { store } from '@/store';
import { setUser } from '@/store/slices/userSlice';
import { convertGraphQLUser } from '@/utils/graphql-utils';

/**
 * Load `me` into Redux before navigating to `/` so Index skips an extra loading round-trip.
 * If the request fails, Index still runs `useMeQuery` as a fallback.
 */
export async function prefetchMeIntoRedux(): Promise<void> {
	try {
		const { data } = await client.query({
			query: MeDocument,
			fetchPolicy: 'network-only',
		});
		if (data?.me) {
			store.dispatch(setUser(convertGraphQLUser(data.me)));
		}
	} catch {
		/* Index will retry via useMeQuery */
	}
}
