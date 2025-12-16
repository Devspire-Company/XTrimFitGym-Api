import { getMySQLConnection } from '../../database/mysql/connectMysql.js';
import { pubsub, EVENTS } from '../pubsub.js';
export default {
    Query: {
        getAttendanceRecords: async (_, { filter, pagination }, context) => {
            // Authorization: Only admin can view attendance records
            const userRole = context.auth.user?.role;
            if (userRole !== 'admin') {
                throw new Error('Unauthorized: Only admins can view attendance records');
            }
            const connection = getMySQLConnection();
            if (!connection) {
                throw new Error('MySQL connection not available');
            }
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
                const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
                // Get total count
                const [countRows] = await connection.execute(`SELECT COUNT(*) as total FROM attendance ${whereClause}`, params);
                const totalCount = countRows[0]?.total || 0;
                // Get paginated records
                const limit = pagination?.limit || 50;
                const offset = pagination?.offset || 0;
                const [rows] = await connection.execute(`SELECT * FROM attendance ${whereClause} ORDER BY authDateTime DESC, id DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
                const records = rows.map((row) => ({
                    id: row.id.toString(),
                    authDateTime: row.authDateTime ? new Date(row.authDateTime).toISOString() : '',
                    authDate: row.authDate ? row.authDate.toString() : '',
                    authTime: row.authTime ? row.authTime.toString() : '',
                    direction: row.direction || 'IN',
                    deviceName: row.deviceName || '',
                    deviceSerNum: row.deviceSerNum || '',
                    personName: row.personName || '',
                    cardNo: row.cardNo || null,
                }));
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
            const connection = getMySQLConnection();
            if (!connection) {
                throw new Error('MySQL connection not available');
            }
            try {
                const [rows] = await connection.execute('SELECT * FROM attendance WHERE id = ?', [id]);
                if (rows.length === 0) {
                    return null;
                }
                const row = rows[0];
                return {
                    id: row.id.toString(),
                    authDateTime: row.authDateTime ? new Date(row.authDateTime).toISOString() : '',
                    authDate: row.authDate ? row.authDate.toString() : '',
                    authTime: row.authTime ? row.authTime.toString() : '',
                    direction: row.direction || 'IN',
                    deviceName: row.deviceName || '',
                    deviceSerNum: row.deviceSerNum || '',
                    personName: row.personName || '',
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
            subscribe: (_, __, context) => {
                // Authorization check
                if (!context.user || context.user.role !== 'admin') {
                    throw new Error('Unauthorized: Only admins can subscribe to attendance updates');
                }
                // Return async iterator for the subscription
                return pubsub.asyncIterator(EVENTS.ATTENDANCE_RECORD_ADDED);
            },
        },
        attendanceUpdated: {
            subscribe: (_, __, context) => {
                // Authorization check
                if (!context.user || context.user.role !== 'admin') {
                    throw new Error('Unauthorized: Only admins can subscribe to attendance updates');
                }
                // Return async iterator for the subscription
                return pubsub.asyncIterator(EVENTS.ATTENDANCE_UPDATED);
            },
        },
    },
};
