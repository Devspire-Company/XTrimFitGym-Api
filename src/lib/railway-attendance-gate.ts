import { ensureMySQLConnection } from '../database/mysql/connectMysql.js';
import type { RowDataPacket } from 'mysql2';

const hitCache = new Map<string, { expiry: number; value: boolean }>();
const CACHE_MS = 60_000;

/**
 * True if iVMS-synced Railway `attendance` has at least one row with a primary key `id`
 * whose `cardNo` matches the member's facility card (Mongo `attendanceId`).
 */
export async function hasRailwayAttendanceRowForCardNo(
	attendanceId: number | null | undefined,
): Promise<boolean> {
	if (attendanceId == null) return false;
	if (!Number.isFinite(attendanceId) || attendanceId <= 0) return false;

	const key = String(Math.trunc(attendanceId));
	const now = Date.now();
	const cached = hitCache.get(key);
	if (cached && cached.expiry > now) return cached.value;

	let value = false;
	try {
		const conn = await ensureMySQLConnection();
		const [rows] = await conn.execute<RowDataPacket[]>(
			'SELECT id FROM attendance WHERE TRIM(CAST(cardNo AS CHAR)) = ? LIMIT 1',
			[key],
		);
		value = Array.isArray(rows) && rows.length > 0 && rows[0]?.id != null;
	} catch {
		value = false;
	}

	hitCache.set(key, { expiry: now + CACHE_MS, value });
	return value;
}
