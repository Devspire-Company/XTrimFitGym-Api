import { WalkInAttendanceLog } from '../walkIn/walk-in-schema.js';

export async function sumWalkInPaymentsTotal(): Promise<number> {
	const r = await WalkInAttendanceLog.aggregate<{ t: number }>([
		{ $group: { _id: null, t: { $sum: { $ifNull: ['$paymentPesos', 0] } } } },
	]);
	return r[0]?.t ?? 0;
}

export async function sumWalkInPaymentsForLocalDate(ymd: string): Promise<number> {
	const r = await WalkInAttendanceLog.aggregate<{ t: number }>([
		{ $match: { localDate: ymd } },
		{ $group: { _id: null, t: { $sum: { $ifNull: ['$paymentPesos', 0] } } } },
	]);
	return r[0]?.t ?? 0;
}

export async function walkInPaymentsByLocalDateRange(
	startYmd: string,
	endYmd: string,
): Promise<Map<string, { revenue: number; count: number }>> {
	const rows = await WalkInAttendanceLog.aggregate<{
		_id: string;
		revenue: number;
		count: number;
	}>([
		{
			$match: {
				localDate: { $gte: startYmd, $lte: endYmd },
			},
		},
		{
			$group: {
				_id: '$localDate',
				revenue: { $sum: { $ifNull: ['$paymentPesos', 0] } },
				count: { $sum: 1 },
			},
		},
	]);
	const m = new Map<string, { revenue: number; count: number }>();
	for (const row of rows) {
		m.set(row._id, { revenue: row.revenue, count: row.count });
	}
	return m;
}

/** Manila calendar YYYY-MM-DD for a Date */
export function manilaYmd(d: Date): string {
	return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
}
