/**
 * Logs a dev-only hint when the GraphQL host and Clerk publishable key "mode"
 * look mismatched. The API verifies session JWTs with CLERK_SECRET_KEY; that
 * secret must be from the same Clerk application (Dashboard → API keys) as the
 * publishable key embedded in the app. Otherwise `me` is often null while
 * Clerk still shows a signed-in session.
 */
export function logClerkApiPairingHint(apiUrl: string, publishableKey: string): void {
	if (!__DEV__) return;
	const key = publishableKey.trim();
	if (!key || !apiUrl) return;

	let host = '';
	try {
		host = new URL(apiUrl).hostname;
	} catch {
		return;
	}

	const isRemoteApi = host !== 'localhost' && host !== '127.0.0.1' && !host.startsWith('10.0.2.2');
	const isTestPk = key.startsWith('pk_test_');
	const isLivePk = key.startsWith('pk_live_');

	if (isRemoteApi && isTestPk) {
		console.warn(
			'[Clerk] App uses pk_test_* against a remote API. On Render, CLERK_SECRET_KEY must be the matching sk_test_* for this same Clerk instance. If it is sk_live_* from another instance, GraphQL `me` will stay null.',
		);
	}
	if (isRemoteApi && isLivePk) {
		console.warn(
			'[Clerk] App uses pk_live_* against a remote API. Ensure Render uses the sk_live_* secret from this same Clerk instance.',
		);
	}
}
