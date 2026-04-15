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

// Get the API URL based on the platform and environment
const getApiUrl = () => {
	if (__DEV__) {
		// Get API URL from app.json (if configured)
		// This is useful for physical devices that need the actual IP address
		const configApiUrl = Constants.expoConfig?.extra?.apiUrl;

		// ✅ Single source of truth: if apiUrl is set in app.json, always use it
		// for BOTH emulator and physical devices. This avoids port/host drift.
		if (configApiUrl) return configApiUrl;

		// For emulators/simulators we want localhost-style URLs that
		// always work out of the box, and reserve configApiUrl for
		// **physical devices** only.
		const isPhysicalDevice = Constants.isDevice;

		// Platform-specific URL logic
		if (Platform.OS === 'android') {
			if (!isPhysicalDevice) {
				// Android Emulator uses 10.0.2.2 to access host machine's localhost,
				// BUT if we have a LAN IP configured, prefer it (more reliable).
				const lanFallback = 'http://192.168.254.154:8000/graphql';
				console.log('✅ [Android] Using emulator API URL (LAN):', lanFallback);
				return lanFallback;
			}

			// Physical Android devices - must use the machine's LAN IP from app.json
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

			// Sensible fallback for misconfigured physical device
			const fallbackUrl = 'http://10.0.2.2:8000/graphql';
			console.warn('   Falling back to emulator URL:', fallbackUrl);
			return fallbackUrl;
		} else if (Platform.OS === 'ios') {
			if (!isPhysicalDevice) {
				// iOS Simulator can use localhost directly
				const apiUrl = 'http://localhost:8000/graphql';
				console.log('✅ [iOS] Using simulator API URL:', apiUrl);
				console.log('   (Physical devices should use apiUrl in app.json)');
				return apiUrl;
			}

			// Physical iOS devices - must use the machine's LAN IP from app.json
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

			// Sensible fallback for misconfigured physical device
			const fallbackUrl = 'http://localhost:8000/graphql';
			console.warn('   Falling back to simulator URL:', fallbackUrl);
			return fallbackUrl;
		} else if (Platform.OS === 'web') {
			// Web platform - prefer config URL, fallback to localhost
			if (configApiUrl) {
				console.log('✅ [Web] Using API URL from app.json:', configApiUrl);
				return configApiUrl;
			}
			const apiUrl = 'http://localhost:8000/graphql';
			console.log('✅ [Web] Using localhost API URL:', apiUrl);
			return apiUrl;
		} else {
			// Unknown platform - use config URL or fallback
			if (configApiUrl) {
				console.log(
					'✅ [Unknown Platform] Using API URL from app.json:',
					configApiUrl,
				);
				return configApiUrl;
			}

			// Fallback - this should ideally be set in app.json
			const fallbackUrl = 'http://192.168.254.237:8000/graphql';
			console.warn('⚠️ [Unknown Platform] No API URL configured in app.json');
			console.warn("   Please add your computer's IP address to app.json:");
			console.warn('   "extra": { "apiUrl": "http://YOUR_IP:8000/graphql" }');
			console.warn('   Using fallback URL:', fallbackUrl);
			return fallbackUrl;
		}
	}

	// Production: use extra.apiUrl from app.json (baked in at build time)
	const configApiUrl = Constants.expoConfig?.extra?.apiUrl;
	if (configApiUrl) return configApiUrl;
	return 'https://xtrimfitgym-api.onrender.com/graphql';
};

export const API_URL = getApiUrl();
console.log('✅ [Apollo Client] GraphQL endpoint:', API_URL);

/** Render and other cold hosts can exceed 30s; avoid hanging the UI forever. */
const GRAPHQL_FETCH_TIMEOUT_MS = 75_000;

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
	credentials: 'include', // Important for cookies
	fetch: fetchWithTimeout,
});

// Auth link to add token header (fallback if cookies don't work)
/** First token fetch after cold start can be slow; avoid falling back to a stale stored JWT too early. */
const CLERK_TOKEN_WAIT_MS = 20_000;

const authLink = setContext(async (_, { headers }) => {
	try {
		const clerkToken = await Promise.race([
			getClerkBearerToken(),
			new Promise<string | null>((resolve) =>
				setTimeout(() => resolve(null), CLERK_TOKEN_WAIT_MS)
			),
		]);
		const stored = await storage.getItem('auth_token');
		const token = clerkToken || stored;

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

// Error link for handling errors
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

// Create Apollo Client
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
