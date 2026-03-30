import { WalkInAttendanceLog } from '../walkIn/walk-in-schema.js';
export async function sumWalkInPaymentsTotal() {
    const r = await WalkInAttendanceLog.aggregate([
        { $group: { _id: null, t: { $sum: { $ifNull: ['$paymentPesos', 0] } } } },
    ]);
    return r[0]?.t ?? 0;
}
export async function sumWalkInPaymentsForLocalDate(ymd) {
    const r = await WalkInAttendanceLog.aggregate([
        { $match: { localDate: ymd } },
        { $group: { _id: null, t: { $sum: { $ifNull: ['$paymentPesos', 0] } } } },
    ]);
    return r[0]?.t ?? 0;
}
export async function walkInPaymentsByLocalDateRange(startYmd, endYmd) {
    const rows = await WalkInAttendanceLog.aggregate([
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
    const m = new Map();
    for (const row of rows) {
        m.set(row._id, { revenue: row.revenue, count: row.count });
    }
    return m;
}
/** Manila calendar YYYY-MM-DD for a Date */
export function manilaYmd(d) {
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
}
