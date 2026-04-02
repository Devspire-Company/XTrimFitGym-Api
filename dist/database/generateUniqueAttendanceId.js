import User from './models/user/user-schema.js';
export async function generateUniqueAttendanceId() {
    const min = 10000000;
    const max = 99999999;
    const maxRetries = 100;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const attendanceId = Math.floor(Math.random() * (max - min + 1)) + min;
        const existingUser = await User.findOne({ attendanceId }).lean();
        if (!existingUser) {
            return attendanceId;
        }
    }
    throw new Error('Unable to generate unique attendanceId. Please try again or contact support.');
}
