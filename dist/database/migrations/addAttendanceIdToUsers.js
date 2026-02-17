import User from '../models/user/user-schema.js';
import connectDb from '../connectDb.js';
/**
 * Migration script to add attendanceId to existing users
 * Generates unique 8-digit numeric IDs (10000000-99999999) for all users
 * that don't already have an attendanceId
 */
async function addAttendanceIdToUsers() {
    try {
        console.log('🔗 Connecting to database...');
        await connectDb();
        console.log('🔄 Generating attendanceId for users without one...');
        // Helper function to generate a unique 8-digit attendanceId
        const generateUniqueAttendanceId = async () => {
            const min = 10000000; // Minimum 8-digit number
            const max = 99999999; // Maximum 8-digit number
            const maxRetries = 100; // Maximum number of retries to avoid infinite loop
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                // Generate a random 8-digit number
                const attendanceId = Math.floor(Math.random() * (max - min + 1)) + min;
                // Check if this attendanceId already exists
                const existingUser = await User.findOne({ attendanceId }).lean();
                if (!existingUser) {
                    return attendanceId;
                }
            }
            // If we couldn't find a unique ID after maxRetries, throw an error
            throw new Error('Unable to generate unique attendanceId after multiple attempts. Please try again.');
        };
        // Get all users that don't have attendanceId or have null/undefined
        const users = await User.find({
            $or: [
                { attendanceId: { $exists: false } },
                { attendanceId: null },
                { attendanceId: undefined },
            ],
        });
        console.log(`📊 Found ${users.length} user(s) without attendanceId`);
        if (users.length === 0) {
            console.log('✅ All users already have attendanceId. Migration not needed.');
            process.exit(0);
            return;
        }
        let updated = 0;
        let failed = 0;
        for (const user of users) {
            try {
                // Generate unique attendanceId
                const attendanceId = await generateUniqueAttendanceId();
                // Update user with attendanceId
                await User.findByIdAndUpdate(user._id, {
                    attendanceId,
                });
                console.log(`✅ Updated: ${user.firstName} ${user.lastName} (${user.email}) -> attendanceId: ${attendanceId}`);
                updated++;
            }
            catch (error) {
                console.error(`❌ Failed to update user ${user.firstName} ${user.lastName} (${user.email}):`, error.message);
                failed++;
            }
        }
        console.log(`\n✅ Migration completed!`);
        console.log(`   Updated: ${updated} user(s)`);
        if (failed > 0) {
            console.log(`   Failed: ${failed} user(s)`);
        }
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error running migration:', error);
        process.exit(1);
    }
}
// Run migration if called directly
addAttendanceIdToUsers();
export default addAttendanceIdToUsers;
