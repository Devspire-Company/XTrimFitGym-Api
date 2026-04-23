import { formatTimeTo12Hour } from '@/utils/time-utils';

export type AttendanceRecordLike = {
	id?: string | null;
	authDateTime?: string | null;
	authDate?: string | null;
	authTime?: string | null;
	direction?: string | null;
	deviceName?: string | null;
};

export function localDateKeyFromJsDate(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

/** ~9 months back / forward for schedule + calendar without loading entire history. */
export function attendanceQueryDateRange(): { startDate: string; endDate: string } {
	const start = new Date();
	start.setMonth(start.getMonth() - 9);
	const end = new Date();
	end.setMonth(end.getMonth() + 9);
	return {
		startDate: localDateKeyFromJsDate(start),
		endDate: localDateKeyFromJsDate(end),
	};
}

/**
 * Day bucket for calendar UI. Prefer `authDate` (IVMS / door “business date”) when it is a
 * valid YYYY-MM-DD so time-in and time-out on the same gym night stay on one tile; using
 * `authDateTime` alone can shift “out” past local midnight into the next calendar day.
 */
export function localDateKeyFromAttendanceRecord(r: AttendanceRecordLike): string | null {
	const ad = r.authDate?.trim();
	if (ad && /^\d{4}-\d{2}-\d{2}/.test(ad)) {
		return ad.slice(0, 10);
	}
	if (r.authDateTime) {
		const d = new Date(r.authDateTime);
		if (!Number.isNaN(d.getTime())) return localDateKeyFromJsDate(d);
	}
	return null;
}

/** Sort order within a selected calendar day (chronological). */
export function attendanceRecordSortMs(
	r: AttendanceRecordLike,
	dayKey: string
): number {
	if (r.authDateTime) {
		const t = new Date(r.authDateTime).getTime();
		if (!Number.isNaN(t)) return t;
	}
	const tp = String(r.authTime || '').trim();
	if (tp) {
		const hm = tp.includes(':') ? tp.slice(0, 5) : '00:00';
		const d = new Date(`${dayKey}T${hm}:00`);
		const t = d.getTime();
		if (!Number.isNaN(t)) return t;
	}
	return 0;
}

export function buildAttendanceDaySet(
	records: readonly AttendanceRecordLike[]
): Set<string> {
	const set = new Set<string>();
	for (const r of records) {
		const k = localDateKeyFromAttendanceRecord(r);
		if (k) set.add(k);
	}
	return set;
}

export function attendanceRecordsForDay(
	records: readonly AttendanceRecordLike[],
	dayKey: string
): AttendanceRecordLike[] {
	return records.filter((r) => localDateKeyFromAttendanceRecord(r) === dayKey);
}

export function formatAttendanceClockLabel(r: AttendanceRecordLike): string {
	if (r.authDateTime) {
		const d = new Date(r.authDateTime);
		if (!Number.isNaN(d.getTime())) {
			return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
		}
	}
	if (r.authTime) {
		const t = String(r.authTime).trim();
		if (t.includes(':')) return formatTimeTo12Hour(t.slice(0, 5));
		return formatTimeTo12Hour(t);
	}
	return '—';
}

export function isAttendanceTimedOut(direction: string | null | undefined): boolean {
	const d = (direction || '').toUpperCase().trim();
	return d === 'OUT' || d === 'EXIT';
}

export function formatAttendanceDirectionLabel(direction: string | null | undefined): string {
	const d = (direction || 'IN').toUpperCase().trim();
	if (d === 'IN' || d === 'ENTRY') return 'Timed in';
	if (d === 'OUT' || d === 'EXIT') return 'Timed out';
	return d.charAt(0) + d.slice(1).toLowerCase();
}
