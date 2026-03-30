// @ts-nocheck
import Analytics from './analytics-schema.js';
import MembershipTransaction from '../membership/membershipTransaction-schema.js';
import Membership from '../membership/membership-shema.js';
import mongoose from 'mongoose';
import { pubsub, EVENTS } from '../../../graphql/pubsub.js';
import { sumWalkInPaymentsTotal } from './walk-in-revenue.js';
/**
 * Updates analytics for today's date based on ALL transactions
 * IMPORTANT: Revenue is calculated from ALL transactions (Active, Canceled, Expired)
 * This ensures:
 * - When a member subscribes: New transaction is created → Revenue increases ✓
 * - When a member cancels: Transaction becomes Canceled but still counts → Revenue does NOT decrease ✓
 * - When a member switches: Old becomes Canceled (still counts), new becomes Active (adds) → Revenue increases by new price only ✓
 *
 * Revenue represents ALL money ever received from subscriptions, regardless of current status.
 */
export async function updateTodayAnalytics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Calculate revenue from ALL transactions (Active, Canceled, Expired)
    // This ensures revenue reflects all money ever received and doesn't decrease when canceled
    const allTransactions = await MembershipTransaction.find({}).lean();
    let membershipSubscriptionRevenue = 0;
    const revenueByMembership = new Map();
    for (const transaction of allTransactions) {
        const price = transaction.priceAtPurchase || 0;
        membershipSubscriptionRevenue += price;
        const membershipId = transaction.membership_id.toString();
        const existing = revenueByMembership.get(membershipId);
        if (existing) {
            existing.revenue += price;
            existing.count += 1;
        }
        else {
            // Fetch membership name
            const membership = await Membership.findById(membershipId).select('name').lean();
            revenueByMembership.set(membershipId, {
                membershipId,
                membershipName: membership?.name || 'Unknown',
                revenue: price,
                count: 1,
            });
        }
    }
    // Get subscription counts
    const [active, newSubs, canceled, expired] = await Promise.all([
        MembershipTransaction.countDocuments({ status: 'Active' }),
        // New subscriptions created today
        MembershipTransaction.countDocuments({
            status: 'Active',
            createdAt: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
            },
        }),
        // Canceled subscriptions today
        MembershipTransaction.countDocuments({
            status: 'Canceled',
            updatedAt: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
            },
        }),
        // Expired subscriptions today
        MembershipTransaction.countDocuments({
            status: 'Expired',
            updatedAt: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
            },
        }),
    ]);
    const walkInRevenue = await sumWalkInPaymentsTotal();
    const totalRevenue = membershipSubscriptionRevenue + walkInRevenue;
    // Update or create today's analytics
    await Analytics.findOneAndUpdate({ date: today }, {
        date: today,
        totalRevenue,
        membershipSubscriptionRevenue,
        walkInRevenue,
        activeSubscriptions: active,
        newSubscriptions: newSubs,
        canceledSubscriptions: canceled,
        expiredSubscriptions: expired,
        revenueByMembership: Array.from(revenueByMembership.values()).map((r) => ({
            membershipId: new mongoose.Types.ObjectId(r.membershipId),
            membershipName: r.membershipName,
            revenue: r.revenue,
            count: r.count,
        })),
    }, { upsert: true, new: true });
    // Publish event for revenue summary update
    pubsub.publish(EVENTS.REVENUE_SUMMARY_UPDATED, {});
}
/**
 * Updates analytics when a new subscription is created
 * Adds the subscription price to revenue
 */
export async function onSubscriptionCreated(transactionId) {
    await updateTodayAnalytics();
}
/**
 * Updates analytics when a subscription is canceled
 * Does NOT deduct revenue - just updates counts
 */
export async function onSubscriptionCanceled(transactionId) {
    await updateTodayAnalytics();
}
/**
 * Updates analytics when a subscription is switched to a new plan
 * Adds new plan price to revenue, does NOT deduct old plan price
 */
export async function onSubscriptionSwitched(transactionId) {
    await updateTodayAnalytics();
}
