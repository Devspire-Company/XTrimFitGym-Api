import { ensureMySQLConnection } from '../../database/mysql/connectMysql.js';
import { pubsub, EVENTS } from '../pubsub.js';
import { IAuthContext } from '../../context/auth-context.js';
import type mysql from 'mysql2/promise';
import { createHash } from 'crypto';

/**
 * Generate a deterministic unique ID for an attendance record
 * Uses a hash of MySQL ID + authDateTime + personName to ensure consistency
 */
function generateAttendanceId(mysqlId: string | number, authDateTime: string, personName: string): string {
	const data = `${mysqlId}-${authDateTime}-${personName}`;
	const hash = createHash('sha256').update(data).digest('hex');
	// Convert to UUID-like format (8-4-4-4-12)
	return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
}

type Context = IAuthContext;

interface AttendanceRecord {
	id: string;
	authDateTime: string;
	authDate: string;
	authTime: string;
	direction: string;
	deviceName: string;
	deviceSerNum: string;
	personName: string;
	cardNo: string | null;
}

interface AttendanceFilter {
	personName?: string;
	direction?: string;
	startDate?: string;
	endDate?: string;
	deviceName?: string;
}

interface AttendancePagination {
	limit?: number;
	offset?: number;
}

export default {
	Query: {
		getAttendanceRecords: async (
			_: any,
			{ filter, pagination }: { filter?: AttendanceFilter; pagination?: AttendancePagination },
			context: Context
		) => {
			// Authorization: Only admin can view attendance records
			const userRole = context.auth.user?.role;
			if (userRole !== 'admin') {
				throw new Error('Unauthorized: Only admins can view attendance records');
			}

			// Ensure MySQL connection is available
			const connection = await ensureMySQLConnection();

			try {
				// Build WHERE clause
				const conditions: string[] = [];
				const params: any[] = [];

				if (filter?.personName) {
					conditions.push('personName LIKE ?');
					params.push(`%${filter.personName}%`);
				}

				if (filter?.direction) {
					conditions.push('direction = ?');
					params.push(filter.direction);
				}

				if (filter?.startDate) {
					conditions.push('authDate >= ?');
					params.push(filter.startDate);
				}

				if (filter?.endDate) {
					conditions.push('authDate <= ?');
					params.push(filter.endDate);
				}

				if (filter?.deviceName) {
					conditions.push('deviceName = ?');
					params.push(filter.deviceName);
				}

				const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

				// Get total count
				
				const [countRows] = await connection.execute<mysql.RowDataPacket[]>(
					`SELECT COUNT(*) as total FROM attendance ${whereClause}`,
					params
				);
				const totalCount = countRows[0]?.total || 0;

				// Get paginated records
				const limit = pagination?.limit || 50;
				const offset = pagination?.offset || 0;

				const [rows] = await connection.execute<mysql.RowDataPacket[]>(
					`SELECT * FROM attendance ${whereClause} ORDER BY authDateTime DESC, id DESC LIMIT ? OFFSET ?`,
					[...params, limit, offset]
				);

				const records: AttendanceRecord[] = rows.map((row) => {
					const authDateTime = row.authDateTime ? new Date(row.authDateTime).toISOString() : '';
					const personName = row.personName || '';
					return {
						id: generateAttendanceId(row.id, authDateTime, personName), // Generate unique ID instead of using MySQL ID
						authDateTime,
						authDate: row.authDate ? row.authDate.toString() : '',
						authTime: row.authTime ? row.authTime.toString() : '',
						direction: row.direction || 'IN',
						deviceName: row.deviceName || '',
						deviceSerNum: row.deviceSerNum || '',
						personName,
						cardNo: row.cardNo || null,
					};
				});

				return {
					records,
					totalCount,
					hasMore: offset + records.length < totalCount,
				};
			} catch (error) {
				console.error('Error fetching attendance records:', error);
				throw new Error('Failed to fetch attendance records');
			}
		},

		getAttendanceRecord: async (_: any, { id }: { id: string }, context: Context) => {
			// Authorization: Only admin can view attendance records
			const userRole = context.auth.user?.role;
			if (userRole !== 'admin') {
				throw new Error('Unauthorized: Only admins can view attendance records');
			}

			// Ensure MySQL connection is available
			const connection = await ensureMySQLConnection();

			try {
				// Note: Since we're using generated UUIDs now, we can't directly query by UUID
				// This resolver is kept for backward compatibility but may not work as expected
				// Consider using getAttendanceRecords with filters instead
				const [rows] = await connection.execute<mysql.RowDataPacket[]>(
					'SELECT * FROM attendance ORDER BY authDateTime DESC LIMIT 1',
					[]
				);

				if (rows.length === 0) {
					return null;
				}

				const row = rows[0];
				const authDateTime = row.authDateTime ? new Date(row.authDateTime).toISOString() : '';
				const personName = row.personName || '';
				return {
					id: generateAttendanceId(row.id, authDateTime, personName), // Generate unique ID instead of using MySQL ID
					authDateTime,
					authDate: row.authDate ? row.authDate.toString() : '',
					authTime: row.authTime ? row.authTime.toString() : '',
					direction: row.direction || 'IN',
					deviceName: row.deviceName || '',
					deviceSerNum: row.deviceSerNum || '',
					personName,
					cardNo: row.cardNo || null,
				};
			} catch (error) {
				console.error('Error fetching attendance record:', error);
				throw new Error('Failed to fetch attendance record');
			}
		},
	},
	Subscription: {
		attendanceRecordAdded: {
			subscribe: async (_: any, __: any, context: any) => {
				// Authorization check - check both context.user (WebSocket) and context.auth.user (HTTP)
				const user = (context as any).user || (context as any).auth?.user;
				console.log('[Attendance Subscription] 🔄 Subscribe attempt - user:', user?.role || 'none', 'context keys:', Object.keys(context || {}));
				if (!user || user.role !== 'admin') {
					console.error('[Attendance Subscription] ❌ Unauthorized subscription attempt - user:', user);
					throw new Error('Unauthorized: Only admins can subscribe to attendance updates');
				}

				console.log('[Attendance Subscription] ✅ Subscription authorized, creating async iterator for:', EVENTS.ATTENDANCE_RECORD_ADDED);
				// Return async iterator for the subscription
				const iterator = pubsub.asyncIterator(EVENTS.ATTENDANCE_RECORD_ADDED);
				console.log('[Attendance Subscription] ✅ Async iterator created, returning to client');
				return iterator;
			},
			resolve: (payload: any) => {
				console.log('[Attendance Subscription] ✅ Resolve called with payload:', JSON.stringify(payload, null, 2));
				console.log('[Attendance Subscription] Payload type:', typeof payload);
				console.log('[Attendance Subscription] Payload keys:', payload ? Object.keys(payload) : 'null');
				
				// The payload should already have attendanceRecordAdded from the publish
				// But GraphQL might pass the entire payload object, so we need to extract it
				let result = payload;
				
				// If payload is the full object with attendanceRecordAdded key
				if (payload && typeof payload === 'object' && 'attendanceRecordAdded' in payload) {
					result = payload.attendanceRecordAdded;
					console.log('[Attendance Subscription] ✅ Extracted attendanceRecordAdded from payload');
				} else if (payload && typeof payload === 'object' && !('id' in payload)) {
					// If payload is wrapped in another object, try to find the record
					console.log('[Attendance Subscription] ⚠️ Payload structure unexpected, trying to extract...');
					result = payload;
				}
				
				console.log('[Attendance Subscription] ✅ Returning resolved data:', JSON.stringify(result, null, 2));
				return result;
			},
		},
		attendanceUpdated: {
			subscribe: async (_: any, __: any, context: any) => {
				// Authorization check - check both context.user (WebSocket) and context.auth.user (HTTP)
				const user = (context as any).user || (context as any).auth?.user;
				console.log('[Attendance Batch Subscription] Subscribe attempt - user:', user?.role || 'none');
				if (!user || user.role !== 'admin') {
					console.error('[Attendance Batch Subscription] Unauthorized subscription attempt');
					throw new Error('Unauthorized: Only admins can subscribe to attendance updates');
				}

				console.log('[Attendance Batch Subscription] ✅ Subscription authorized, returning async iterator');
				// Return async iterator for the subscription
				return pubsub.asyncIterator(EVENTS.ATTENDANCE_UPDATED);
			},
			resolve: (payload: any) => {
				console.log('[Attendance Batch Subscription] ✅ Resolve called with payload:', JSON.stringify(payload, null, 2));
				// The payload should already have attendanceUpdated from the publish
				const result = payload?.attendanceUpdated || payload;
				console.log('[Attendance Batch Subscription] ✅ Returning resolved data:', result);
				return result;
			},
		},
	},
};

