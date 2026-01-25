import { ensureMySQLConnection } from '../../database/mysql/connectMysql.js';
import { pubsub, EVENTS } from '../pubsub.js';
import { IAuthContext } from '../../context/auth-context.js';
import User from '../../database/models/user/user-schema.js';
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
	cardNo?: string;
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
			// Authorization: Admin can view all records, users can only view their own
			const authUser = context.auth.user;
			if (!authUser) {
				throw new Error('Unauthorized: You must be logged in to view attendance records');
			}

			const userRole = authUser.role;
			let userAttendanceId: string | undefined;

			// If not admin, fetch the full user to match by name or cardNo
			if (userRole !== 'admin') {
				const fullUser = await User.findById(authUser.id).select('attendanceId firstName lastName middleName').lean();
				if (!fullUser) {
					throw new Error('Unauthorized: User not found');
				}
				
				userAttendanceId = fullUser.attendanceId?.toString();
				
				console.log('[Attendance Query] User ID:', authUser.id);
				console.log('[Attendance Query] User name:', fullUser.firstName, fullUser.middleName, fullUser.lastName);
				console.log('[Attendance Query] User attendanceId from DB:', fullUser.attendanceId);

				// Build user's full name in various possible formats to match personName in MySQL
				const firstName = fullUser.firstName || '';
				const middleName = fullUser.middleName || '';
				const lastName = fullUser.lastName || '';
				
				// Try different name combinations that might match personName in MySQL
				const possibleNames = [
					`${firstName} ${lastName}`.trim(),           // "John Doe"
					`${firstName} ${middleName} ${lastName}`.trim(), // "John Middle Doe"
					`${lastName}, ${firstName}`.trim(),          // "Doe, John"
					firstName,                                   // Just first name
					lastName,                                    // Just last name
				].filter(name => name.length > 0);

				console.log('[Attendance Query] Possible name matches:', possibleNames);

				// Initialize filter if needed
				filter = filter || {};

				// Try to match by cardNo first if available, otherwise use personName
				if (userAttendanceId) {
					// Check if cardNo filter was provided and validate it
					if (filter.cardNo && filter.cardNo !== userAttendanceId) {
						throw new Error('Unauthorized: You can only view your own attendance records');
					}
					// Try cardNo first, but if it's empty in MySQL, fall back to personName
					filter.cardNo = userAttendanceId;
					console.log('[Attendance Query] Will try filtering by cardNo first:', userAttendanceId);
				}

				// Also add personName filter as a fallback (will use OR logic if cardNo doesn't match)
				// We'll handle this in the WHERE clause to try cardNo first, then personName
				if (possibleNames.length > 0) {
					// Store possible names for later use in WHERE clause
					(filter as any).possiblePersonNames = possibleNames;
				}
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

				// Handle cardNo and personName matching for non-admin users
				if ((filter as any)?.possiblePersonNames && filter?.cardNo) {
					// For non-admin users: try cardNo first, but if cardNo is NULL/empty, match by personName
					// Use OR to match either by cardNo OR by any of the possible personName variations
					const personNameConditions: string[] = [];
					const personNameParams: any[] = [];
					
					(filter as any).possiblePersonNames.forEach((name: string) => {
						personNameConditions.push('personName LIKE ?');
						personNameParams.push(`%${name}%`);
					});

					if (personNameConditions.length > 0) {
						// Match by cardNo OR by personName (since cardNo might be empty in MySQL)
						conditions.push(`(
							(CAST(cardNo AS CHAR) = CAST(? AS CHAR) AND cardNo IS NOT NULL AND cardNo != '')
							OR (${personNameConditions.join(' OR ')})
						)`);
						params.push(filter.cardNo, ...personNameParams);
						console.log('[Attendance Query] Filtering by cardNo OR personName:', {
							cardNo: filter.cardNo,
							personNames: (filter as any).possiblePersonNames
						});
					} else {
						// Fallback to just cardNo if no person names available
						conditions.push('CAST(cardNo AS CHAR) = CAST(? AS CHAR)');
						params.push(filter.cardNo);
						console.log('[Attendance Query] Filtering by cardNo only:', filter.cardNo);
					}
				} else if (filter?.cardNo) {
					// Admin or simple cardNo filter
					conditions.push('CAST(cardNo AS CHAR) = CAST(? AS CHAR)');
					params.push(filter.cardNo);
					console.log('[Attendance Query] Filtering by cardNo:', filter.cardNo, 'Type:', typeof filter.cardNo);
				}

				const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

				console.log('[Attendance Query] SQL WHERE clause:', whereClause);
				console.log('[Attendance Query] SQL params:', JSON.stringify(params));

				// Get total count
				const countQuery = `SELECT COUNT(*) as total FROM attendance ${whereClause}`;
				console.log('[Attendance Query] Count query:', countQuery);
				const [countRows] = await connection.execute<mysql.RowDataPacket[]>(
					countQuery,
					params
				);
				const totalCount = countRows[0]?.total || 0;
				console.log('[Attendance Query] Total count found:', totalCount);

				// Get paginated records
				const limit = pagination?.limit || 50;
				const offset = pagination?.offset || 0;

				const dataQuery = `SELECT * FROM attendance ${whereClause} ORDER BY authDateTime DESC, id DESC LIMIT ? OFFSET ?`;
				const dataParams = [...params, limit, offset];
				console.log('[Attendance Query] Data query:', dataQuery);
				console.log('[Attendance Query] Data query params:', JSON.stringify(dataParams));
				const [rows] = await connection.execute<mysql.RowDataPacket[]>(
					dataQuery,
					dataParams
				);
				console.log('[Attendance Query] Rows returned:', rows.length);
				if (rows.length > 0) {
					console.log('[Attendance Query] Sample row - cardNo:', rows[0].cardNo, 'Type:', typeof rows[0].cardNo);
					console.log('[Attendance Query] Sample row - personName:', rows[0].personName);
					console.log('[Attendance Query] Sample row - authDateTime:', rows[0].authDateTime);
				} else if (totalCount > 0) {
					console.warn('[Attendance Query] ⚠️  Total count > 0 but no rows returned - pagination issue?');
				} else {
					console.warn('[Attendance Query] ⚠️  No records found. Checking if cardNo exists in table...');
					// Debug: Check if any records exist with similar cardNo
					const [debugRows] = await connection.execute<mysql.RowDataPacket[]>(
						'SELECT DISTINCT cardNo FROM attendance LIMIT 10'
					);
					console.log('[Attendance Query] Sample cardNo values in table:', debugRows.map(r => ({ cardNo: r.cardNo, type: typeof r.cardNo })));
				}

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

