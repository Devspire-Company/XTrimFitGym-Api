/**
 * Age of majority for gym membership / liability rules (Philippines-style default).
 */
export const AGE_OF_MAJORITY = 18;

/** Minimum age to register (matches onboarding product rule). */
export const MIN_APP_AGE = 10;

function toDate(d: Date | string): Date {
	return typeof d === 'string' ? new Date(d) : d;
}

/**
 * Full years since birthday (calendar-correct).
 */
export function getAgeYears(
	dateOfBirth: Date | string,
	reference: Date = new Date()
): number {
	const birth = toDate(dateOfBirth);
	if (Number.isNaN(birth.getTime())) return NaN;

	let age = reference.getFullYear() - birth.getFullYear();
	const m = reference.getMonth() - birth.getMonth();
	if (m < 0 || (m === 0 && reference.getDate() < birth.getDate())) {
		age--;
	}
	return age;
}

export function isMinorAt(
	dateOfBirth: Date | string | undefined | null,
	reference: Date = new Date()
): boolean {
	if (!dateOfBirth) return false;
	const age = getAgeYears(dateOfBirth, reference);
	if (Number.isNaN(age)) return false;
	return age < AGE_OF_MAJORITY;
}

/**
 * Minors need a recorded parent/guardian liability waiver (`agreedToLiabilityWaiver` on User).
 * Adults are not blocked by this check.
 */
export function minorNeedsGuardianWaiver(
	dateOfBirth: Date | string | undefined | null,
	agreedToLiabilityWaiver: boolean | null | undefined
): boolean {
	if (!dateOfBirth) return false;
	if (!isMinorAt(dateOfBirth)) return false;
	return !agreedToLiabilityWaiver;
}

export function isBelowMinAppAge(dateOfBirth: Date | string): boolean {
	return getAgeYears(dateOfBirth) < MIN_APP_AGE;
}
