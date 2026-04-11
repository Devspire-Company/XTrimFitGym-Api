/**
 * Shared helpers for membership subscription length (months and/or calendar days from start).
 */
export function isDailyDurationType(durationType) {
    return (durationType || '').toLowerCase() === 'daily';
}
export function addMonthsPreserveDay(start, months) {
    const d = new Date(start.getTime());
    d.setMonth(d.getMonth() + months);
    return d;
}
export function addCalendarDays(start, days) {
    const d = new Date(start.getTime());
    d.setDate(d.getDate() + days);
    return d;
}
export function computeExpiresAtFromStart(startedAt, monthDuration, extraDays = 0) {
    if (monthDuration < 1) {
        throw new Error('monthDuration must be at least 1');
    }
    const expiresAt = addMonthsPreserveDay(startedAt, monthDuration);
    if (extraDays > 0) {
        expiresAt.setDate(expiresAt.getDate() + extraDays);
    }
    return expiresAt;
}
export function planMonthDuration(membership) {
    if (isDailyDurationType(membership.durationType)) {
        return 1;
    }
    let months = membership.monthDuration;
    if (months != null && months >= 1) {
        return months;
    }
    const durationType = (membership.durationType || 'monthly').toLowerCase();
    if (durationType === 'monthly')
        return 1;
    if (durationType === 'quarterly')
        return 3;
    if (durationType === 'yearly')
        return 12;
    return 1;
}
/** For DAILY catalog plans, `monthDuration` in Mongo stores calendar days. */
export function planDayLengthFromDailyMembership(membership) {
    if (!isDailyDurationType(membership.durationType))
        return 0;
    const d = membership.monthDuration;
    if (d != null && d >= 1)
        return d;
    return 1;
}
/**
 * Computes expiry and persisted length fields for a new or updated subscription.
 * - DAILY plans use calendar days (`dayDuration` on the transaction; `monthDuration` stored as 0).
 * - Other plans use months (`monthDuration` >= 1; `dayDuration` null).
 */
export function resolveSubscriptionLength(startedAt, membership, opts) {
    const extra = Math.max(0, opts?.extraDays ?? 0);
    if (!opts?.forceMonthBased && isDailyDurationType(membership.durationType)) {
        const fromPlan = planDayLengthFromDailyMembership(membership);
        let days = opts?.lengthDays != null && opts.lengthDays >= 1
            ? opts.lengthDays
            : opts?.lengthMonths != null && opts.lengthMonths >= 1
                ? opts.lengthMonths
                : fromPlan;
        if (days < 1)
            days = 1;
        const expiresAt = addCalendarDays(startedAt, days + extra);
        return { expiresAt, monthDuration: 0, dayDuration: days };
    }
    const months = opts?.lengthMonths != null && opts.lengthMonths >= 1
        ? opts.lengthMonths
        : planMonthDuration(membership);
    if (months < 1) {
        throw new Error('monthDuration must be at least 1');
    }
    const expiresAt = computeExpiresAtFromStart(startedAt, months, extra);
    return { expiresAt, monthDuration: months, dayDuration: null };
}
export function resolveTransactionMonthDuration(transaction, membershipPlan) {
    if (transaction.dayDuration != null && transaction.dayDuration >= 1) {
        return transaction.monthDuration != null && transaction.monthDuration >= 1
            ? transaction.monthDuration
            : 0;
    }
    if (transaction.monthDuration != null && transaction.monthDuration >= 1) {
        return transaction.monthDuration;
    }
    if (membershipPlan) {
        return planMonthDuration(membershipPlan);
    }
    return 1;
}
