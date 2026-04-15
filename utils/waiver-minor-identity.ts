import { isDrawnSignature } from '@/components/WaiverSignaturePad';

export function normalizeJoinedName(parts: (string | undefined | null)[]): string {
	return parts
		.map((p) => (p ?? '').trim())
		.filter(Boolean)
		.join(' ')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase();
}

/**
 * Returns an error message if invalid, otherwise undefined.
 */
export function validateMinorPrintedNameMatchesAccount(
	printed: string,
	account: { firstName?: string | null; middleName?: string | null; lastName?: string | null }
): string | undefined {
	const expected = normalizeJoinedName([
		account.firstName,
		account.middleName,
		account.lastName,
	]);
	const got = normalizeJoinedName([printed]);
	if (got.length < 3) {
		return 'Enter your full legal name (first, middle if any, and last)';
	}
	if (expected.length < 2) {
		return 'Your account name is not set; contact support.';
	}
	if (got !== expected) {
		return 'Must match your registered name on this account exactly';
	}
	return undefined;
}

export function validateMinorDrawnSignature(sig: string): string | undefined {
	if (!isDrawnSignature(sig)) {
		return 'You (the minor member) must sign in the signature box';
	}
	return undefined;
}
