import { isClerkAPIResponseError } from '@clerk/clerk-expo';

function lowerText(err: unknown): string {
	if (isClerkAPIResponseError(err)) {
		return (
			err.errors?.map((e) => `${e.message ?? ''} ${(e as { longMessage?: string }).longMessage ?? ''}`).join(' ') ?? ''
		).toLowerCase();
	}
	if (err instanceof Error) return err.message.toLowerCase();
	return String(err).toLowerCase();
}

/** setActive() can throw if a session is already active after email verification. */
export function isSessionAlreadyActiveError(err: unknown): boolean {
	const t = lowerText(err);
	return (
		(t.includes('session') && (t.includes('already') || t.includes('exist'))) ||
		t.includes('already signed in')
	);
}

export async function setActiveIgnoringSessionConflict(
	setActive: ((p: { session: string }) => Promise<void>) | undefined,
	sessionId: string | null | undefined,
): Promise<void> {
	if (!sessionId || !setActive) return;
	try {
		await setActive({ session: sessionId });
	} catch (e) {
		if (!isSessionAlreadyActiveError(e)) throw e;
	}
}
