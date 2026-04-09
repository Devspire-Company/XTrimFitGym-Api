/**
 * Shared helpers for membership subscription length (months from start + optional extra days).
 */

export function planMonthDuration(membership: {
	monthDuration?: number | null;
	durationType?: string | null;
}): number {
	let months = membership.monthDuration;
	if (months != null && months >= 1) {
		return months;
	}
	const durationType = (membership.durationType || 'monthly').toLowerCase();
	if (durationType === 'monthly') return 1;
	if (durationType === 'quarterly') return 3;
	if (durationType === 'yearly') return 12;
	return 1;
}

export function addMonthsPreserveDay(start: Date, months: number): Date {
	const d = new Date(start.getTime());
	d.setMonth(d.getMonth() + months);
	return d;
}

export function computeExpiresAtFromStart(
	startedAt: Date,
	monthDuration: number,
	extraDays = 0
): Date {
	if (monthDuration < 1) {
		throw new Error('monthDuration must be at least 1');
	}
	const expiresAt = addMonthsPreserveDay(startedAt, monthDuration);
	if (extraDays > 0) {
		expiresAt.setDate(expiresAt.getDate() + extraDays);
	}
	return expiresAt;
}

export function resolveTransactionMonthDuration(
	transaction: { monthDuration?: number | null },
	membershipPlan: { monthDuration?: number | null; durationType?: string | null } | null | undefined
): number {
	if (transaction.monthDuration != null && transaction.monthDuration >= 1) {
		return transaction.monthDuration;
	}
	if (membershipPlan) {
		return planMonthDuration(membershipPlan);
	}
	return 1;
}
