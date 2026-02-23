import { ensureMySQLConnection } from '../../database/mysql/connectMysql.js';
import { pubsub, EVENTS } from '../pubsub.js';
import User from '../../database/models/user/user-schema.js';
import { createHash } from 'crypto';
import { getValidAttendanceIdentifiers, correctPersonNameFromCardNo, } from '../../services/attendance-validation.js';
/**
 * Generate a deterministic unique ID for an attendance record
 * Uses a hash of MySQL ID + authDateTime + personName to ensure consistency
 */
function generateAttendanceId(mysqlId, authDateTime, personName) {
    const data = `${mysqlId}-${authDateTime}-${personName}`;
    const hash = createHash('sha256').update(data).digest('hex');
    // Convert to UUID-like format (8-4-4-4-12)
    return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
}
export default {
    Query: {
        getAttendanceRecords: async (_, { filter, pagination }, context) => {
            // Authorization: Admin can view all records, users can only view their own
            const authUser = context.auth.user;
            if (!authUser) {
                throw new Error('Unauthorized: You must be logged in to view attendance records');
            }
            const userRole = authUser.role;
            let userAttendanceId;
            // If not admin, fetch the full user to match by name or cardNo
            if (userRole !== 'admin') {
                const fullUser = await User.findById(authUser.id).select('attendanceId firstName lastName middleName').lean();
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
                ].filter(name => name.length > 0);
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
                }
                // Also add personName filter as a fallback (will use OR logic if cardNo doesn't match)
                // We'll handle this in the WHERE clause to try cardNo first, then personName
                if (possibleNames.length > 0) {
                    // Store possible names for later use in WHERE clause
                    filter.possiblePersonNames = possibleNames;
                }
            }
            // Ensure MySQL connection is available
            const connection = await ensureMySQLConnection();
            try {
                // Build WHERE clause
                const conditions = [];
                const params = [];
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
                if (filter?.possiblePersonNames && filter?.cardNo) {
                    // For non-admin users: try cardNo first, but if cardNo is NULL/empty, match by personName
                    // Use OR to match either by cardNo OR by any of the possible personName variations
                    const personNameConditions = [];
                    const personNameParams = [];
                    filter.possiblePersonNames.forEach((name) => {
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
                    }
                    else {
                        // Fallback to just cardNo if no person names available
                        conditions.push('CAST(cardNo AS CHAR) = CAST(? AS CHAR)');
                        params.push(filter.cardNo);
                    }
                }
                else if (filter?.cardNo) {
                    // Admin or simple cardNo filter
                    conditions.push('CAST(cardNo AS CHAR) = CAST(? AS CHAR)');
                    params.push(filter.cardNo);
                }
                // Restrict to registered users only (exclude IVMS ghost/corrupt records e.g. "Jack Williams" on reconnect)
                let validIds = null;
                if (userRole === 'admin') {
                    validIds = await getValidAttendanceIdentifiers();
                    const cardList = Array.from(validIds.validCardNos);
                    const nameList = Array.from(validIds.validPersonNames);
                    if (cardList.length > 0 || nameList.length > 0) {
                        const cardPlaceholders = cardList.length ? cardList.map(() => '?').join(',') : '';
                        const namePlaceholders = nameList.length ? nameList.map(() => '?').join(',') : '';
                        const parts = [];
                        if (cardList.length)
                            parts.push(`(CAST(cardNo AS CHAR) IN (${cardPlaceholders}))`);
                        if (nameList.length)
                            parts.push(`(LOWER(TRIM(personName)) IN (${namePlaceholders}))`);
                        conditions.push(`(${parts.join(' OR ')})`);
                        params.push(...cardList, ...nameList.map((n) => n.toLowerCase()));
                    }
                    else {
                        conditions.push('0 = 1');
                    }
                }
                const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
                // Get total count
                const countQuery = `SELECT COUNT(*) as total FROM attendance ${whereClause}`;
                const [countRows] = await connection.execute(countQuery, params);
                const totalCount = countRows[0]?.total || 0;
                // Get paginated records
                const limit = pagination?.limit || 50;
                const offset = pagination?.offset || 0;
                const dataQuery = `SELECT * FROM attendance ${whereClause} ORDER BY authDateTime DESC, id DESC LIMIT ? OFFSET ?`;
                const dataParams = [...params, limit, offset];
                const [rows] = await connection.execute(dataQuery, dataParams);
                const records = rows.map((row) => {
                    const authDateTime = row.authDateTime ? new Date(row.authDateTime).toISOString() : '';
                    const rawPersonName = row.personName || '';
                    const personName = validIds != null
                        ? correctPersonNameFromCardNo({ personName: rawPersonName, cardNo: row.cardNo }, validIds)
                        : rawPersonName;
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
            }
            catch (error) {
                console.error('Error fetching attendance records:', error);
                throw new Error('Failed to fetch attendance records');
            }
        },
        getAttendanceRecord: async (_, { id }, context) => {
            // Authorization: Only admin can view attendance records
            const userRole = context.auth.user?.role;
            if (userRole !== 'admin') {
                throw new Error('Unauthorized: Only admins can view attendance records');
            }
            // Ensure MySQL connection is available
            const connection = await ensureMySQLConnection();
            try {
                const validIds = await getValidAttendanceIdentifiers();
                const cardList = Array.from(validIds.validCardNos);
                const nameList = Array.from(validIds.validPersonNames);
                if (cardList.length === 0 && nameList.length === 0) {
                    return null;
                }
                const cardPlaceholders = cardList.length ? cardList.map(() => '?').join(',') : '';
                const namePlaceholders = nameList.length ? nameList.map(() => '?').join(',') : '';
                const parts = [];
                if (cardList.length)
                    parts.push(`(CAST(cardNo AS CHAR) IN (${cardPlaceholders}))`);
                if (nameList.length)
                    parts.push(`(LOWER(TRIM(personName)) IN (${namePlaceholders}))`);
                const validCondition = `(${parts.join(' OR ')})`;
                const [rows] = await connection.execute(`SELECT * FROM attendance WHERE ${validCondition} ORDER BY authDateTime DESC LIMIT 1`, [...cardList, ...nameList.map((n) => n.toLowerCase())]);
                if (rows.length === 0) {
                    return null;
                }
                const row = rows[0];
                const authDateTime = row.authDateTime ? new Date(row.authDateTime).toISOString() : '';
                const rawPersonName = row.personName || '';
                const personName = correctPersonNameFromCardNo({ personName: rawPersonName, cardNo: row.cardNo }, validIds);
                return {
                    id: generateAttendanceId(row.id, authDateTime, personName),
                    authDateTime,
                    authDate: row.authDate ? row.authDate.toString() : '',
                    authTime: row.authTime ? row.authTime.toString() : '',
                    direction: row.direction || 'IN',
                    deviceName: row.deviceName || '',
                    deviceSerNum: row.deviceSerNum || '',
                    personName,
                    cardNo: row.cardNo || null,
                };
            }
            catch (error) {
                console.error('Error fetching attendance record:', error);
                throw new Error('Failed to fetch attendance record');
            }
        },
    },
    Subscription: {
        attendanceRecordAdded: {
            subscribe: async (_, __, context) => {
                const user = context.user || context.auth?.user;
                if (!user || user.role !== 'admin') {
                    throw new Error('Unauthorized: Only admins can subscribe to attendance updates');
                }
                return pubsub.asyncIterator(EVENTS.ATTENDANCE_RECORD_ADDED);
            },
            resolve: (payload) => {
                let result = payload;
                if (payload && typeof payload === 'object' && 'attendanceRecordAdded' in payload) {
                    result = payload.attendanceRecordAdded;
                }
                else if (payload && typeof payload === 'object' && !('id' in payload)) {
                    result = payload;
                }
                return result;
            },
        },
        attendanceUpdated: {
            subscribe: async (_, __, context) => {
                const user = context.user || context.auth?.user;
                if (!user || user.role !== 'admin') {
                    throw new Error('Unauthorized: Only admins can subscribe to attendance updates');
                }
                return pubsub.asyncIterator(EVENTS.ATTENDANCE_UPDATED);
            },
            resolve: (payload) => {
                return payload?.attendanceUpdated || payload;
            },
        },
    },
};
