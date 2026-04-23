/**
 * Philippine mobile: UI collects national digits only (10 digits, typically 9XXXXXXXXX).
 * Strips pasted "+63" / "63" and leading "0" from local-style entry (e.g. 09… → 9…).
 */
export function sanitizePhilippineMobileNationalDigits(raw: string): string {
	let d = raw.replace(/\D/g, '');
	if (d.startsWith('63')) {
		d = d.slice(2);
	}
	while (d.startsWith('0')) {
		d = d.slice(1);
	}
	return d.slice(0, 10);
}

export function nationalDigitsFromStoredPhone(
	value: string | number | undefined | null
): string {
	return sanitizePhilippineMobileNationalDigits(String(value ?? ''));
}

/** PH mobile numbers use 9 + nine further digits. */
export function isValidPhilippineMobileNational(national: string): boolean {
	return /^9\d{9}$/.test(national);
}

export function formatPhilippinePhoneDisplay(
	value: string | number | undefined | null
): string | null {
	const d = nationalDigitsFromStoredPhone(value);
	if (!d) return null;
	return `+63 ${d}`;
}
