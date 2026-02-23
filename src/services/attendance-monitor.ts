import {
	getMySQLConnection,
	ensureMySQLConnection,
} from '../database/mysql/connectMysql.js';
import { pubsub, EVENTS } from '../graphql/pubsub.js';
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

export interface AttendanceRecord {
	id: string;
	authDateTime: string;
	authDate: string;
	authTime: string;
	direction: 'IN' | 'OUT';
	deviceName: string;
	deviceSerNum: string;
	personName: string;
	cardNo: string | null;
}

class AttendanceMonitor {
	private lastCheckedId: string | null = null;
	private lastCheckedDateTime: string | null = null;
	private pollingInterval: NodeJS.Timeout | null = null;
	private isPolling: boolean = false;
	private pollIntervalMs: number = 2000; // Poll every 2 seconds for real-time updates

	/**
	 * Initialize the monitor by getting the latest record ID
	 */
	async initialize(): Promise<void> {
		try {
			const connection = await ensureMySQLConnection();

			// First, check if the table exists
			const [tableCheck] = await connection.execute<mysql.RowDataPacket[]>(
				`SELECT COUNT(*) as count FROM information_schema.tables 
				WHERE table_schema = DATABASE() AND table_name = 'attendance'`,
			);

			if (tableCheck.length === 0 || tableCheck[0].count === 0) {
				console.warn(
					'⚠️  Attendance table does not exist yet. Monitor will wait for table creation.',
				);
				console.warn('   The table will be checked again when polling starts.');
				this.lastCheckedId = null;
				return;
			}

			// Get the latest record ID and datetime to start monitoring from
			const [rows] = await connection.execute<mysql.RowDataPacket[]>(
				'SELECT id, authDateTime FROM attendance ORDER BY authDateTime DESC, id DESC LIMIT 1',
			);

			if (rows.length > 0) {
				this.lastCheckedId = rows[0].id.toString();
				this.lastCheckedDateTime = rows[0].authDateTime
					? new Date(rows[0].authDateTime).toISOString()
					: null;
			}
		} catch (error: any) {
			// Check if it's a "table doesn't exist" error
			if (error?.code === 'ER_NO_SUCH_TABLE' || error?.errno === 1146) {
				console.warn(
					'⚠️  Attendance table does not exist yet. Monitor will wait for table creation.',
				);
				console.warn('   The table will be checked again when polling starts.');
				this.lastCheckedId = null;
				return;
			}
			console.error('Error initializing attendance monitor:', error);
			throw error;
		}
	}

	/**
	 * Start polling for new attendance records
	 */
	startPolling(): void {
		if (this.isPolling) return;

		this.isPolling = true;

		// Poll immediately, then set up interval
		this.checkForNewRecords();

		this.pollingInterval = setInterval(() => {
			this.checkForNewRecords();
		}, this.pollIntervalMs);
	}

	/**
	 * Stop polling for new attendance records
	 */
	stopPolling(): void {
		if (this.pollingInterval) {
			clearInterval(this.pollingInterval);
			this.pollingInterval = null;
			this.isPolling = false;
		}
	}

	/**
	 * Check for new attendance records and publish events
	 */
	private async checkForNewRecords(): Promise<void> {
		try {
			const connection = await ensureMySQLConnection();

			// Check if table exists first (in case it was created after initialization)
			if (this.lastCheckedId === null) {
				const [tableCheck] = await connection.execute<mysql.RowDataPacket[]>(
					`SELECT COUNT(*) as count FROM information_schema.tables 
					WHERE table_schema = DATABASE() AND table_name = 'attendance'`,
				);

				if (tableCheck.length === 0 || tableCheck[0].count === 0) {
					// Table still doesn't exist, skip this check
					return;
				}

				// Table exists now, try to initialize
				try {
					const [rows] = await connection.execute<mysql.RowDataPacket[]>(
						'SELECT id, authDateTime FROM attendance ORDER BY authDateTime DESC, id DESC LIMIT 1',
					);
					if (rows.length > 0) {
						this.lastCheckedId = rows[0].id.toString();
						this.lastCheckedDateTime = rows[0].authDateTime
							? new Date(rows[0].authDateTime).toISOString()
							: null;
					}
				} catch (initError) {
					// Table might have been created but is empty or has issues
					return;
				}
			}

			let query: string;
			let params: any[];

			if (this.lastCheckedId && this.lastCheckedDateTime) {
				// Get records newer than the last checked record
				query = `
					SELECT * FROM attendance 
					WHERE (authDateTime > ? OR (authDateTime = ? AND id > ?))
					ORDER BY authDateTime ASC, id ASC
				`;
				params = [
					this.lastCheckedDateTime,
					this.lastCheckedDateTime,
					this.lastCheckedId,
				];
			} else {
				// First check - get all records
				query = 'SELECT * FROM attendance ORDER BY authDateTime ASC, id ASC';
				params = [];
			}

			const [rows] = await connection.execute<mysql.RowDataPacket[]>(
				query,
				params,
			);

			if (rows.length > 0) {
				const newRecords: AttendanceRecord[] = rows.map((row) => {
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

				// Update last checked ID and datetime to the most recent record
				const lastRecord = rows[rows.length - 1];
				this.lastCheckedId = lastRecord.id.toString();
				this.lastCheckedDateTime = lastRecord.authDateTime
					? new Date(lastRecord.authDateTime).toISOString()
					: null;

				// Publish each new record to subscribers
				for (const record of newRecords) {
					try {
						pubsub.publish(EVENTS.ATTENDANCE_RECORD_ADDED, {
							attendanceRecordAdded: record,
						});
					} catch (error) {
						console.error(
							'[Attendance Monitor] Error publishing record:',
							error,
						);
					}
				}

				// Also publish a batch update event
				try {
					pubsub.publish(EVENTS.ATTENDANCE_UPDATED, {
						attendanceUpdated: newRecords,
					});
				} catch (error) {
					console.error(
						'[Attendance Monitor] Error publishing batch update:',
						error,
					);
				}
			}
		} catch (error: any) {
			// Handle table not found errors gracefully
			if (error?.code === 'ER_NO_SUCH_TABLE' || error?.errno === 1146) {
				// Reset lastCheckedId and lastCheckedDateTime so we check for table existence on next poll
				if (this.lastCheckedId !== null) {
					this.lastCheckedId = null;
					this.lastCheckedDateTime = null;
				}
				return;
			}
			console.error('Error checking for new attendance records:', error);
			// Don't throw - continue polling even if one check fails
		}
	}

	/**
	 * Manually trigger a check for new records (useful for testing)
	 * Returns the new records that were found
	 */
	async manualCheck(): Promise<AttendanceRecord[]> {
		const connection = await ensureMySQLConnection();

		try {
			let query: string;
			let params: any[];

			if (this.lastCheckedId && this.lastCheckedDateTime) {
				query = `
					SELECT * FROM attendance 
					WHERE (authDateTime > ? OR (authDateTime = ? AND id > ?))
					ORDER BY authDateTime ASC, id ASC
				`;
				params = [
					this.lastCheckedDateTime,
					this.lastCheckedDateTime,
					this.lastCheckedId,
				];
			} else {
				query = 'SELECT * FROM attendance ORDER BY authDateTime ASC, id ASC';
				params = [];
			}

			const [rows] = await connection.execute<mysql.RowDataPacket[]>(
				query,
				params,
			);

			if (rows.length > 0) {
				const newRecords: AttendanceRecord[] = rows.map((row) => {
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

				if (newRecords.length > 0) {
					const lastRecord = rows[rows.length - 1];
					this.lastCheckedId = lastRecord.id.toString();
					this.lastCheckedDateTime = lastRecord.authDateTime
						? new Date(lastRecord.authDateTime).toISOString()
						: null;
				}

				return newRecords;
			}

			return [];
		} catch (error) {
			console.error('Error in manual check:', error);
			throw error;
		}
	}

	/**
	 * Get the current polling status
	 */
	getStatus(): {
		isPolling: boolean;
		lastCheckedId: string | null;
		pollIntervalMs: number;
	} {
		return {
			isPolling: this.isPolling,
			lastCheckedId: this.lastCheckedId,
			pollIntervalMs: this.pollIntervalMs,
		};
	}
}

// Singleton instance
export const attendanceMonitor = new AttendanceMonitor();
