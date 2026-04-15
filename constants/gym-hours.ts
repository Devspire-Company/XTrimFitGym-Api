/**
 * X-Trim gym hours (local time).
 * Mon–Thu & Sat–Sun: 10:00 AM – 10:00 PM
 * Fri: 2:00 PM – 10:00 PM
 *
 * When no session date: default to standard hours (most days) — 10:00 AM – 10:00 PM.
 */

export type GymMinutesBounds = { min: number; max: number };

const MIN_STANDARD = 10 * 60; // 10:00 AM
const MAX_STANDARD = 22 * 60; // 10:00 PM
const MIN_FRIDAY = 14 * 60; // 2:00 PM
const MAX_FRIDAY = 22 * 60; // 10:00 PM

/** JS Date.getDay(): 0 = Sun, 1 = Mon, … 5 = Fri, 6 = Sat */
export function getGymMinutesBoundsForWeekday(day: number): GymMinutesBounds {
	if (day === 5) return { min: MIN_FRIDAY, max: MAX_FRIDAY };
	return { min: MIN_STANDARD, max: MAX_STANDARD };
}

/** No session date (custom preferred workout, teaching time): safe every day. */
export function getGymMinutesBoundsNoReferenceDate(): GymMinutesBounds {
	return { min: MIN_STANDARD, max: MAX_STANDARD };
}

export function minutesOfDay(d: Date): number {
	return d.getHours() * 60 + d.getMinutes();
}

export function setMinutesOnSameCalendarDay(d: Date, totalMinutes: number): Date {
	const out = new Date(d);
	const h = Math.floor(totalMinutes / 60);
	const m = totalMinutes % 60;
	out.setHours(h, m, 0, 0);
	return out;
}

export function toMinutes24From12(
	hour12: number,
	minute: number,
	isPM: boolean
): number {
	let h24: number;
	if (hour12 === 12) h24 = isPM ? 12 : 0;
	else h24 = isPM ? hour12 + 12 : hour12;
	return h24 * 60 + minute;
}

export function clampMinutesToBounds(
	m: number,
	bounds: GymMinutesBounds
): number {
	return Math.max(bounds.min, Math.min(bounds.max, m));
}

export function clampTimeToBounds(d: Date, bounds: GymMinutesBounds): Date {
	const mod = minutesOfDay(d);
	const c = clampMinutesToBounds(mod, bounds);
	if (c === mod) return d;
	return setMinutesOnSameCalendarDay(d, c);
}
