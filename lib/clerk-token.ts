/** Set by ClerkTokenBridge so Apollo can attach the active Clerk session JWT. */
let getTokenFromClerk: (() => Promise<string | null>) | null = null;

export function setClerkTokenGetter(fn: (() => Promise<string | null>) | null) {
	getTokenFromClerk = fn;
}

export async function getClerkBearerToken(): Promise<string | null> {
	if (!getTokenFromClerk) return null;
	try {
		return await getTokenFromClerk();
	} catch {
		return null;
	}
}
