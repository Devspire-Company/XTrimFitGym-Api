import { getClerkBearerToken } from '@/lib/clerk-token';
import { storage } from '@/utils/storage';
import {
	ApolloClient,
	InMemoryCache,
	createHttpLink,
	from,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiUrl = () => {
	if (__DEV__) {
		const configApiUrl = Constants.expoConfig?.extra?.apiUrl;

		if (configApiUrl) return configApiUrl;

		const isPhysicalDevice = Constants.isDevice;

		if (Platform.OS === 'android') {
			if (!isPhysicalDevice) {
				const lanFallback = 'http://192.168.254.154:8000/graphql';
				console.log('✅ [Android] Using emulator API URL (LAN):', lanFallback);
				return lanFallback;
			}

			if (configApiUrl) {
				console.log(
					'✅ [Android] Using API URL from app.json for physical device:',
					configApiUrl,
				);
				return configApiUrl;
			}

			console.warn(
				'⚠️ [Android] Physical device detected but no extra.apiUrl configured.',
			);
			console.warn(
				'   Please set "extra.apiUrl" in app.json to "http://YOUR_IP:8000/graphql".',
			);

			const fallbackUrl = 'http://10.0.2.2:8000/graphql';
			console.warn('   Falling back to emulator URL:', fallbackUrl);
			return fallbackUrl;
		} else if (Platform.OS === 'ios') {
			if (!isPhysicalDevice) {
				const apiUrl = 'http://localhost:8000/graphql';
				console.log('✅ [iOS] Using simulator API URL:', apiUrl);
				console.log('   (Physical devices should use apiUrl in app.json)');
				return apiUrl;
			}

			if (configApiUrl) {
				console.log(
					'✅ [iOS] Using API URL from app.json for physical device:',
					configApiUrl,
				);
				return configApiUrl;
			}

			console.warn(
				'⚠️ [iOS] Physical device detected but no extra.apiUrl configured.',
			);
			console.warn(
				'   Please set "extra.apiUrl" in app.json to "http://YOUR_IP:8000/graphql".',
			);

			const fallbackUrl = 'http://localhost:8000/graphql';
			console.warn('   Falling back to simulator URL:', fallbackUrl);
			return fallbackUrl;
		} else if (Platform.OS === 'web') {
			if (configApiUrl) {
				console.log('✅ [Web] Using API URL from app.json:', configApiUrl);
				return configApiUrl;
			}
			const apiUrl = 'http://localhost:8000/graphql';
			console.log('✅ [Web] Using localhost API URL:', apiUrl);
			return apiUrl;
		} else {
			if (configApiUrl) {
				console.log(
					'✅ [Unknown Platform] Using API URL from app.json:',
					configApiUrl,
				);
				return configApiUrl;
			}

			const fallbackUrl = 'http://192.168.254.237:8000/graphql';
			console.warn('⚠️ [Unknown Platform] No API URL configured in app.json');
			console.warn("   Please add your computer's IP address to app.json:");
			console.warn('   "extra": { "apiUrl": "http://YOUR_IP:8000/graphql" }');
			console.warn('   Using fallback URL:', fallbackUrl);
			return fallbackUrl;
		}
	}

	const configApiUrl = Constants.expoConfig?.extra?.apiUrl;
	if (configApiUrl) return configApiUrl;
	return 'https://xtrimfitgym-api.onrender.com/graphql';
};

export const API_URL = getApiUrl();
console.log('✅ [Apollo Client] GraphQL endpoint:', API_URL);

const GRAPHQL_FETCH_TIMEOUT_MS = 45_000;

function fetchWithTimeout(
	input: RequestInfo | URL,
	init?: RequestInit
): Promise<Response> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), GRAPHQL_FETCH_TIMEOUT_MS);
	const outer = init?.signal;
	const onOuterAbort = () => {
		clearTimeout(timeout);
		controller.abort();
	};
	if (outer) {
		if (outer.aborted) {
			clearTimeout(timeout);
			const err = new Error('Aborted');
			err.name = 'AbortError';
			return Promise.reject(err);
		}
		outer.addEventListener('abort', onOuterAbort, { once: true });
	}
	return fetch(input, { ...init, signal: controller.signal }).finally(() => {
		clearTimeout(timeout);
		outer?.removeEventListener('abort', onOuterAbort);
	});
}

const httpLink = createHttpLink({
	uri: API_URL,
	credentials: 'include',
	fetch: fetchWithTimeout,
});

const CLERK_TOKEN_WAIT_MS = 6_000;

const authLink = setContext(async (_, { headers }) => {
	try {
		const clerkToken = await Promise.race([
			getClerkBearerToken(),
			new Promise<string | null>((resolve) =>
				setTimeout(() => resolve(null), CLERK_TOKEN_WAIT_MS)
			),
		]);
		const stored = await storage.getItem('auth_token');
		// Prefer app-stored token first (supports dev coach fallback JWT flow),
		// then fallback to Clerk session token.
		const token = stored || clerkToken;

		if (token) {
			return {
				headers: {
					...headers,
					authorization: `Bearer ${token}`,
				},
			};
		}
	} catch (error) {
		console.error('❌ [Apollo Client] Auth header error:', error);
	}

	return { headers: { ...headers } };
});

const errorLink = onError((error: any) => {
	if (error.graphQLErrors) {
		error.graphQLErrors.forEach((graphQLError: any) => {
			console.error(
				`[GraphQL error]: Message: ${graphQLError.message}, Location: ${graphQLError.locations}, Path: ${graphQLError.path}`,
			);
		});
	}

	if (error.networkError) {
		console.error(
			`[Network error]: ${error.networkError.message || error.networkError}`,
		);
	}
});

const client = new ApolloClient({
	link: from([errorLink, authLink, httpLink]),
	cache: new InMemoryCache(),
	defaultOptions: {
		watchQuery: {
			errorPolicy: 'all',
		},
		query: {
			errorPolicy: 'all',
		},
	},
});

export default client;
