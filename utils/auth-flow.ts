import { storage } from '@/utils/storage';

/** Persists whether the user last chose login vs signup (for routing when Clerk is signed in but `me` is null). */
export const AUTH_FLOW_STORAGE_KEY = 'auth_flow';

export type AuthFlowIntent = 'login' | 'signup';

export async function setAuthFlowIntent(flow: AuthFlowIntent): Promise<void> {
	await storage.setItem(AUTH_FLOW_STORAGE_KEY, flow);
}

export async function clearAuthFlowIntent(): Promise<void> {
	await storage.removeItem(AUTH_FLOW_STORAGE_KEY);
}

/** Returns `signup` only when explicitly set; otherwise `login` (safe default: never force complete-registration). */
export async function getAuthFlowIntent(): Promise<AuthFlowIntent> {
	const v = await storage.getItem(AUTH_FLOW_STORAGE_KEY);
	return v === 'signup' ? 'signup' : 'login';
}
