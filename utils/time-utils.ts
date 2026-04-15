/**
 * Utility functions for time formatting
 */

/** Total minutes from midnight (0–1439). */
export function minutesOfDayFromDate(d: Date): number {
	return d.getHours() * 60 + d.getMinutes();
}

/** 12h label e.g. "2:30 PM" for picker slots. */
export function formatMinutesAs12hClock(totalM: number): string {
	const h24 = Math.floor(totalM / 60) % 24;
	const m = totalM % 60;
	const ampm = h24 >= 12 ? 'PM' : 'AM';
	const h12 = h24 % 12 || 12;
	return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

/** 15-minute steps from minM to maxM (inclusive). */
export function buildQuarterMinuteSlots(
	minM: number,
	maxM: number,
): { label: string; totalMinutes: number }[] {
	const out: { label: string; totalMinutes: number }[] = [];
	const step = 15;
	const first = Math.ceil(minM / step) * step;
	for (let t = first; t <= maxM; t += step) {
		out.push({ label: formatMinutesAs12hClock(t), totalMinutes: t });
	}
	return out;
}

/**
 * Formats a time string or hour number to 12-hour format (AM/PM)
 * @param time - Can be:
 *   - A string in format "HH" or "HH-MM" (24-hour format)
 *   - A number representing hours (0-23)
 *   - A string already in 12-hour format (will be returned as-is if it contains AM/PM)
 * @returns Formatted time string in 12-hour format (e.g., "8:00 AM", "2:30 PM")
 */
export const formatTimeTo12Hour = (time: string | number | null | undefined): string => {
	if (!time && time !== 0) return 'Not set';

	// If it's already in 12-hour format (contains AM/PM), return as-is
	if (typeof time === 'string' && (time.includes('AM') || time.includes('PM'))) {
		return time;
	}

	let hour: number;
	let minutes = 0;

	if (typeof time === 'number') {
		hour = time;
	} else if (typeof time === 'string') {
		// Handle "HH-MM" format (e.g., "8-18")
		if (time.includes('-') && !time.includes(' ')) {
			const [start] = time.split('-');
			hour = parseInt(start, 10);
		} else if (time.includes(':')) {
			// Handle "HH:MM" format
			const [h, m] = time.split(':');
			hour = parseInt(h, 10);
			minutes = parseInt(m || '0', 10);
		} else {
			// Handle "HH" format
			hour = parseInt(time, 10);
		}
	} else {
		return 'Not set';
	}

	if (isNaN(hour)) return 'Not set';

	const period = hour >= 12 ? 'PM' : 'AM';
	const displayHour = hour % 12 || 12;
	const displayMinutes = minutes.toString().padStart(2, '0');

	return minutes > 0
		? `${displayHour}:${displayMinutes} ${period}`
		: `${displayHour}:00 ${period}`;
};

/**
 * Formats a time range string (e.g., "8-18") to 12-hour format range
 * @param timeRange - Time range string in format "HH-HH" (24-hour format)
 * @returns Formatted time range string (e.g., "8:00 AM - 6:00 PM")
 */
/**
 * Parses membership `workOutTime` entry like "8-17" (24h whole hours) to minute bounds.
 */
export function parseWorkOutTimeRangeToMinutes(
	range: string | null | undefined
): { min: number; max: number } | null {
	if (!range || typeof range !== 'string') return null;
	const trimmed = range.trim();
	const m = /^(\d{1,2})\s*-\s*(\d{1,2})$/.exec(trimmed);
	if (!m) return null;
	const startH = parseInt(m[1], 10);
	const endH = parseInt(m[2], 10);
	if (Number.isNaN(startH) || Number.isNaN(endH)) return null;
	if (endH <= startH) return null;
	if (startH < 0 || endH > 24) return null;
	return { min: startH * 60, max: endH * 60 };
}

export function intersectMinuteBounds(
	a: { min: number; max: number },
	b: { min: number; max: number }
): { min: number; max: number } | null {
	const min = Math.max(a.min, b.min);
	const max = Math.min(a.max, b.max);
	if (max <= min) return null;
	return { min, max };
}

/** Intersection of preferred windows for all members (tightest overlap). */
export function preferredWorkoutMinuteBoundsForUsers(
	users: Array<{
		membershipDetails?: { workOutTime?: (string | null)[] | null } | null;
	} | null>
): { min: number; max: number } | null {
	let minM = 0;
	let maxM = 24 * 60;
	let count = 0;
	for (const u of users) {
		if (!u) continue;
		const raw = u.membershipDetails?.workOutTime?.[0];
		const p = parseWorkOutTimeRangeToMinutes(raw ?? undefined);
		if (!p) continue;
		count += 1;
		minM = Math.max(minM, p.min);
		maxM = Math.min(maxM, p.max);
	}
	if (count === 0) return null;
	if (maxM <= minM) return null;
	return { min: minM, max: maxM };
}

export const formatTimeRangeTo12Hour = (
	timeRange: string | null | undefined
): string => {
	if (!timeRange) return 'Not set';

	// If already in 12-hour format, return as-is
	if (timeRange.includes('AM') || timeRange.includes('PM')) {
		return timeRange;
	}

	// Handle "HH-HH" format
	if (timeRange.includes('-') && !timeRange.includes(' ')) {
		const [start, end] = timeRange.split('-');
		const startFormatted = formatTimeTo12Hour(parseInt(start, 10));
		const endFormatted = formatTimeTo12Hour(parseInt(end, 10));
		return `${startFormatted} - ${endFormatted}`;
	}

	// If it's a single time, format it
	return formatTimeTo12Hour(timeRange);
};

