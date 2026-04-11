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
function generateAttendanceId(
	mysqlId: string | number,
	authDateTime: string,
	personName: string,
): string {
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
			{
				filter,
				pagination,
			}: { filter?: AttendanceFilter; pagination?: AttendancePagination },
			context: Context,
		) => {
			// Authorization: Admin can view all records, users can only view their own
			const authUser = context.auth.user;
			if (!authUser) {
				throw new Error(
					'Unauthorized: You must be logged in to view attendance records',
				);
			}

			const userRole = authUser.role;
			let userAttendanceId: string | undefined;

			// If not admin, fetch the full user to match by name or cardNo
			if (userRole !== 'admin') {
				const fullUser = await User.findById(authUser.id)
					.select('attendanceId firstName lastName middleName')
					.lean();
				if (!fullUser) {
					throw new Error('Unauthorized: User not found');
				}

				userAttendanceId = fullUser.attendanceId?.toString();

				// Build user's full name in various possible formats to match personName in MySQL
				const firstName = fullUser.firstName || '';
				const middleName = fullUser.middleName || '';
				const lastName = fullUser.lastName || '';

				// Try different name combinations that might match personName in MySQL
				const possibleNames = [
					`${firstName} ${lastName}`.trim(), // "John Doe"
					`${firstName} ${middleName} ${lastName}`.trim(), // "John Middle Doe"
					`${lastName}, ${firstName}`.trim(), // "Doe, John"
					firstName, // Just first name
					lastName, // Just last name
				].filter((name) => name.length > 0);

				// Initialize filter if needed
				filter = filter || {};

				// Try to match by cardNo first if available, otherwise use personName
				if (userAttendanceId) {
					// Check if cardNo filter was provided and validate it
					if (filter.cardNo && filter.cardNo !== userAttendanceId) {
						throw new Error(
							'Unauthorized: You can only view your own attendance records',
						);
					}
					// Try cardNo first, but if it's empty in MySQL, fall back to personName
					filter.cardNo = userAttendanceId;
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

				// Filter by authDateTime (DATETIME) so date range is reliable; authDate is VARCHAR and format varies
				if (filter?.startDate && filter?.endDate) {
					conditions.push(
						"authDateTime >= CONCAT(?, ' 00:00:00') AND authDateTime < CONCAT(DATE_ADD(?, INTERVAL 1 DAY), ' 00:00:00')"
					);
					params.push(filter.startDate, filter.endDate);
				} else if (filter?.startDate) {
					conditions.push("authDateTime >= CONCAT(?, ' 00:00:00')");
					params.push(filter.startDate);
				} else if (filter?.endDate) {
					conditions.push("authDateTime < CONCAT(DATE_ADD(?, INTERVAL 1 DAY), ' 00:00:00')");
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
						// Match by cardNo (string or numeric, so leading zeros / padding match iVMS) OR personName
						conditions.push(`(
							(
								cardNo IS NOT NULL AND cardNo != '' AND (
									CAST(cardNo AS CHAR) = CAST(? AS CHAR)
									OR (cardNo REGEXP '^[0-9]+$' AND CAST(? AS UNSIGNED) = CAST(cardNo AS UNSIGNED))
								)
							)
							OR (${personNameConditions.join(' OR ')})
						)`);
						params.push(filter.cardNo, filter.cardNo, ...personNameParams);
					} else {
						conditions.push(`(
							cardNo IS NOT NULL AND cardNo != '' AND (
								CAST(cardNo AS CHAR) = CAST(? AS CHAR)
								OR (cardNo REGEXP '^[0-9]+$' AND CAST(? AS UNSIGNED) = CAST(cardNo AS UNSIGNED))
							)
						)`);
						params.push(filter.cardNo, filter.cardNo);
					}
				} else if (filter?.cardNo) {
					conditions.push(`(
						cardNo IS NOT NULL AND cardNo != '' AND (
							CAST(cardNo AS CHAR) = CAST(? AS CHAR)
							OR (cardNo REGEXP '^[0-9]+$' AND CAST(? AS UNSIGNED) = CAST(cardNo AS UNSIGNED))
						)
					)`);
					params.push(filter.cardNo, filter.cardNo);
				} else if ((filter as any)?.possiblePersonNames && userRole !== 'admin') {
					const personNameConditions: string[] = [];
					const personNameParams: any[] = [];
					(filter as any).possiblePersonNames.forEach((name: string) => {
						personNameConditions.push('personName LIKE ?');
						personNameParams.push(`%${name}%`);
					});
					if (personNameConditions.length > 0) {
						conditions.push(`(${personNameConditions.join(' OR ')})`);
						params.push(...personNameParams);
					}
				}

				const whereClause =
					conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

				// Get total count
				const countQuery = `SELECT COUNT(*) as total FROM attendance ${whereClause}`;
				const [countRows] = await connection.execute<mysql.RowDataPacket[]>(
					countQuery,
					params,
				);
				const totalCount = countRows[0]?.total || 0;

				// Get paginated records
				const limit = pagination?.limit || 50;
				const offset = pagination?.offset || 0;

				const dataQuery = `SELECT * FROM attendance ${whereClause} ORDER BY authDateTime DESC, id DESC LIMIT ? OFFSET ?`;
				const dataParams = [...params, limit, offset];
				const [rows] = await connection.execute<mysql.RowDataPacket[]>(
					dataQuery,
					dataParams,
				);

				const records: AttendanceRecord[] = rows.map((row) => {
					const authDateTime = row.authDateTime
						? new Date(row.authDateTime).toISOString()
						: '';
					const personName = row.personName || '';
					return {
						id: generateAttendanceId(row.id, authDateTime, personName),
						authDateTime,
						authDate: row.authDate ? row.authDate.toString() : '',
						authTime: row.authTime ? row.authTime.toString() : '',
						direction: row.direction || 'IN',
						deviceName: row.deviceName || '',
						deviceSerNum: row.deviceSerNum || '',
						personName,
						cardNo: row.cardNo ?? null,
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

		getAttendanceRecord: async (
			_: any,
			{ id }: { id: string },
			context: Context,
		) => {
			// Authorization: Only admin can view attendance records
			const userRole = context.auth.user?.role;
			if (userRole !== 'admin') {
				throw new Error(
					'Unauthorized: Only admins can view attendance records',
				);
			}

			// Ensure MySQL connection is available
			const connection = await ensureMySQLConnection();

			try {
				const [rows] = await connection.execute<mysql.RowDataPacket[]>(
					'SELECT * FROM attendance ORDER BY authDateTime DESC LIMIT 1',
					[],
				);

				if (rows.length === 0) {
					return null;
				}

				const row = rows[0];
				const authDateTime = row.authDateTime
					? new Date(row.authDateTime).toISOString()
					: '';
				const personName = row.personName || '';
				return {
					id: generateAttendanceId(row.id, authDateTime, personName),
					authDateTime,
					authDate: row.authDate ? row.authDate.toString() : '',
					authTime: row.authTime ? row.authTime.toString() : '',
					direction: row.direction || 'IN',
					deviceName: row.deviceName || '',
					deviceSerNum: row.deviceSerNum || '',
					personName,
					cardNo: row.cardNo ?? null,
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
				const user = (context as any).user || (context as any).auth?.user;
				if (!user || user.role !== 'admin') {
					throw new Error(
						'Unauthorized: Only admins can subscribe to attendance updates',
					);
				}
				return pubsub.asyncIterator(EVENTS.ATTENDANCE_RECORD_ADDED);
			},
			resolve: (payload: any) => {
				let result = payload;
				if (
					payload &&
					typeof payload === 'object' &&
					'attendanceRecordAdded' in payload
				) {
					result = payload.attendanceRecordAdded;
				} else if (
					payload &&
					typeof payload === 'object' &&
					!('id' in payload)
				) {
					result = payload;
				}
				return result;
			},
		},
		attendanceUpdated: {
			subscribe: async (_: any, __: any, context: any) => {
				const user = (context as any).user || (context as any).auth?.user;
				if (!user || user.role !== 'admin') {
					throw new Error(
						'Unauthorized: Only admins can subscribe to attendance updates',
					);
				}
				return pubsub.asyncIterator(EVENTS.ATTENDANCE_UPDATED);
			},
			resolve: (payload: any) => {
				return payload?.attendanceUpdated || payload;
			},
		},
	},
};
