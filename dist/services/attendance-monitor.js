import { getMySQLConnection } from '../database/mysql/connectMysql.js';
import { pubsub, EVENTS } from '../graphql/pubsub.js';
class AttendanceMonitor {
    lastCheckedId = null;
    pollingInterval = null;
    isPolling = false;
    pollIntervalMs = 2000; // Poll every 2 seconds for real-time updates
    /**
     * Initialize the monitor by getting the latest record ID
     */
    async initialize() {
        try {
            const connection = getMySQLConnection();
            if (!connection) {
                throw new Error('MySQL connection not available');
            }
            // Get the latest record ID to start monitoring from
            const [rows] = await connection.execute('SELECT id FROM attendance ORDER BY authDateTime DESC, id DESC LIMIT 1');
            if (rows.length > 0) {
                this.lastCheckedId = rows[0].id.toString();
                console.log(`Attendance monitor initialized. Last record ID: ${this.lastCheckedId}`);
            }
            else {
                console.log('Attendance monitor initialized. No existing records found.');
            }
        }
        catch (error) {
            console.error('Error initializing attendance monitor:', error);
            throw error;
        }
    }
    /**
     * Start polling for new attendance records
     */
    startPolling() {
        if (this.isPolling) {
            console.log('Attendance monitor is already polling');
            return;
        }
        this.isPolling = true;
        console.log('Starting attendance monitor polling...');
        // Poll immediately, then set up interval
        this.checkForNewRecords();
        this.pollingInterval = setInterval(() => {
            this.checkForNewRecords();
        }, this.pollIntervalMs);
    }
    /**
     * Stop polling for new attendance records
     */
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            this.isPolling = false;
            console.log('Attendance monitor polling stopped');
        }
    }
    /**
     * Check for new attendance records and publish events
     */
    async checkForNewRecords() {
        try {
            const connection = getMySQLConnection();
            if (!connection) {
                console.error('MySQL connection not available for polling');
                return;
            }
            let query;
            let params;
            if (this.lastCheckedId) {
                // Get records newer than the last checked ID
                // Using authDateTime and id for more reliable ordering
                query = `
					SELECT * FROM attendance 
					WHERE (authDateTime > (SELECT authDateTime FROM attendance WHERE id = ?) 
						OR (authDateTime = (SELECT authDateTime FROM attendance WHERE id = ?) AND id > ?))
					ORDER BY authDateTime ASC, id ASC
				`;
                params = [this.lastCheckedId, this.lastCheckedId, this.lastCheckedId];
            }
            else {
                // First check - get all records
                query = 'SELECT * FROM attendance ORDER BY authDateTime ASC, id ASC';
                params = [];
            }
            const [rows] = await connection.execute(query, params);
            if (rows.length > 0) {
                const newRecords = rows.map((row) => ({
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
                // Update last checked ID to the most recent record
                const lastRecord = newRecords[newRecords.length - 1];
                this.lastCheckedId = lastRecord.id;
                // Publish each new record to subscribers
                for (const record of newRecords) {
                    pubsub.publish(EVENTS.ATTENDANCE_RECORD_ADDED, {
                        attendanceRecordAdded: record,
                    });
                    console.log(`New attendance record detected: ${record.personName} - ${record.direction} at ${record.authDateTime}`);
                }
                // Also publish a batch update event
                pubsub.publish(EVENTS.ATTENDANCE_UPDATED, {
                    attendanceUpdated: newRecords,
                });
            }
        }
        catch (error) {
            console.error('Error checking for new attendance records:', error);
            // Don't throw - continue polling even if one check fails
        }
    }
    /**
     * Manually trigger a check for new records (useful for testing)
     * Returns the new records that were found
     */
    async manualCheck() {
        const connection = getMySQLConnection();
        if (!connection) {
            throw new Error('MySQL connection not available');
        }
        try {
            let query;
            let params;
            if (this.lastCheckedId) {
                query = `
					SELECT * FROM attendance 
					WHERE (authDateTime > (SELECT authDateTime FROM attendance WHERE id = ?) 
						OR (authDateTime = (SELECT authDateTime FROM attendance WHERE id = ?) AND id > ?))
					ORDER BY authDateTime ASC, id ASC
				`;
                params = [this.lastCheckedId, this.lastCheckedId, this.lastCheckedId];
            }
            else {
                query = 'SELECT * FROM attendance ORDER BY authDateTime ASC, id ASC';
                params = [];
            }
            const [rows] = await connection.execute(query, params);
            if (rows.length > 0) {
                const newRecords = rows.map((row) => ({
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
                if (newRecords.length > 0) {
                    const lastRecord = newRecords[newRecords.length - 1];
                    this.lastCheckedId = lastRecord.id;
                }
                return newRecords;
            }
            return [];
        }
        catch (error) {
            console.error('Error in manual check:', error);
            throw error;
        }
    }
    /**
     * Get the current polling status
     */
    getStatus() {
        return {
            isPolling: this.isPolling,
            lastCheckedId: this.lastCheckedId,
            pollIntervalMs: this.pollIntervalMs,
        };
    }
}
// Singleton instance
export const attendanceMonitor = new AttendanceMonitor();
