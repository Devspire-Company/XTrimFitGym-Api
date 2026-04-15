import { setActiveIgnoringSessionConflict } from '@/lib/clerk-session-errors';
import { storage } from '@/utils/storage';

type SetActive = (params: { session: string }) => Promise<void>;

export async function storeTokenAfterClerkSession(
	createdSessionId: string | null | undefined,
	setActive: SetActive | undefined,
	getToken: () => Promise<string | null>,
): Promise<boolean> {
	if (!createdSessionId || !setActive) return false;
	await setActiveIgnoringSessionConflict(setActive, createdSessionId);
	const t = await getToken();
	if (t) await storage.setItem('auth_token', t);
	return true;
}
