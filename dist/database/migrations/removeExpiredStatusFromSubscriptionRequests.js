import SubscriptionRequest from '../models/membership/subscriptionRequest-schema.js';
import connectDb from '../connectDb.js';
/**
 * Migration script to remove EXPIRED status from subscription requests
 * This converts all EXPIRED requests to REJECTED status
 */
async function removeExpiredStatusFromSubscriptionRequests() {
    try {
        console.log('🔗 Connecting to database...');
        await connectDb();
        console.log('🔄 Updating subscription requests with EXPIRED status...');
        // Find all subscription requests with EXPIRED status
        const expiredRequests = await SubscriptionRequest.find({
            status: 'Expired',
        });
        console.log(`📊 Found ${expiredRequests.length} subscription requests with EXPIRED status`);
        if (expiredRequests.length > 0) {
            // Update all EXPIRED requests to REJECTED
            const result = await SubscriptionRequest.updateMany({ status: 'Expired' }, {
                status: 'Rejected',
                // Optionally set rejectedAt if not already set
                $set: {
                    rejectedAt: new Date(),
                },
            });
            console.log(`✅ Updated ${result.modifiedCount} subscription request(s) from EXPIRED to REJECTED`);
        }
        // Also check for any case variations
        const caseVariations = await SubscriptionRequest.find({
            $or: [
                { status: 'expired' },
                { status: 'EXPIRED' },
            ],
        });
        if (caseVariations.length > 0) {
            const result = await SubscriptionRequest.updateMany({
                $or: [
                    { status: 'expired' },
                    { status: 'EXPIRED' },
                ],
            }, {
                status: 'Rejected',
                $set: {
                    rejectedAt: new Date(),
                },
            });
            console.log(`✅ Updated ${result.modifiedCount} additional subscription request(s) with case variations`);
        }
        console.log(`\n✅ Migration completed!`);
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error running migration:', error);
        process.exit(1);
    }
}
// Run migration if called directly
removeExpiredStatusFromSubscriptionRequests();
export default removeExpiredStatusFromSubscriptionRequests;
