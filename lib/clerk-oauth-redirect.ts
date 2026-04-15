import * as AuthSession from 'expo-auth-session';

/**
 * Path segment for Clerk native OAuth (`useSSO` / `startSSOFlow`).
 * Must match `app/sso-callback.tsx` and the redirect URL allow list in
 * Clerk Dashboard → Native applications (e.g. `xtrimfitnessgymapp://sso-callback`).
 */
export const CLERK_SSO_REDIRECT_PATH = 'sso-callback';

export function getClerkOAuthRedirectUrl(): string {
	return AuthSession.makeRedirectUri({ path: CLERK_SSO_REDIRECT_PATH });
}
