// @ts-nocheck
import Analytics from '../../database/models/analytics/analytics-schema.js';
import MembershipTransaction from '../../database/models/membership/membershipTransaction-schema.js';
import Membership from '../../database/models/membership/membership-shema.js';
import mongoose from 'mongoose';
import { updateTodayAnalytics } from '../../database/models/analytics/analytics-helper.js';
import { pubsub, EVENTS } from '../pubsub.js';
// Helper function to calculate revenue from ALL transactions (regardless of status)
// IMPORTANT: Revenue represents ALL money ever received from subscriptions.
// This ensures that:
// 1. When a member subscribes: The transaction price is ADDED to revenue ✓
// 2. When a member cancels: Revenue is NOT deducted (money was already received) ✓
// 3. When a member switches plans: Old plan's revenue stays, new plan's price is ADDED ✓
//
// Revenue = Sum of priceAtPurchase for ALL transactions (Active, Canceled, Expired)
// This is correct because:
// - Each transaction represents money that was received
// - Canceling doesn't refund money, so revenue shouldn't decrease
// - Switching plans means paying for new plan, so revenue increases by new plan price
const calculateRevenueFromAllTransactions = async () => {
    // Query ALL transactions regardless of status
    // This ensures revenue reflects all money ever received, not just current active subscriptions
    const query = {}; // No status filter - count all transactions
    const transactions = await MembershipTransaction.find(query).lean();
    let totalRevenue = 0;
    const revenueByMembership = new Map();
    for (const transaction of transactions) {
        const price = transaction.priceAtPurchase || 0;
        totalRevenue += price;
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
    return {
        totalRevenue,
        revenueByMembership: Array.from(revenueByMembership.values()),
    };
};
// Helper function to get subscription counts
const getSubscriptionCounts = async (dateRange) => {
    const baseQuery = {};
    const dateQuery = {};
    if (dateRange) {
        dateQuery.createdAt = {
            $gte: new Date(dateRange.startDate),
            $lte: new Date(dateRange.endDate),
        };
    }
    const [active, newSubs, canceled, expired] = await Promise.all([
        // Active subscriptions (regardless of creation date)
        MembershipTransaction.countDocuments({ status: 'Active' }),
        // New subscriptions (created in date range if provided)
        MembershipTransaction.countDocuments({ status: 'Active', ...dateQuery }),
        // Canceled subscriptions (created in date range if provided)
        MembershipTransaction.countDocuments({ status: 'Canceled', ...dateQuery }),
        // Expired subscriptions (created in date range if provided)
        MembershipTransaction.countDocuments({ status: 'Expired', ...dateQuery }),
    ]);
    return {
        activeSubscriptions: active,
        newSubscriptions: newSubs,
        canceledSubscriptions: canceled,
        expiredSubscriptions: expired,
    };
};
export default {
    Query: {
        getAnalytics: async (_, { date }, context) => {
            // Authorization: Only admin can view analytics
            const userRole = context.auth.user?.role;
            if (userRole !== 'admin') {
                throw new Error('Unauthorized: Only admins can view analytics');
            }
            const targetDate = new Date(date);
            targetDate.setHours(0, 0, 0, 0);
            // Check if requesting today's analytics - if so, update it first to ensure it's current
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (targetDate.getTime() === today.getTime()) {
                await updateTodayAnalytics();
            }
            // Get analytics from stored data
            let analytics = await Analytics.findOne({ date: targetDate }).lean();
            // If analytics don't exist for this date, calculate and store them
            if (!analytics) {
                // Calculate analytics for the date
                const startOfDay = new Date(targetDate);
                const endOfDay = new Date(targetDate);
                endOfDay.setHours(23, 59, 59, 999);
                const dateRange = {
                    startDate: startOfDay.toISOString(),
                    endDate: endOfDay.toISOString(),
                };
                // Calculate revenue from ALL transactions (regardless of status)
                // This ensures revenue reflects all money ever received and doesn't decrease when canceled
                const { totalRevenue, revenueByMembership } = await calculateRevenueFromAllTransactions();
                const counts = await getSubscriptionCounts(dateRange);
                // Create and save analytics
                analytics = await Analytics.create({
                    date: targetDate,
                    totalRevenue,
                    activeSubscriptions: counts.activeSubscriptions,
                    newSubscriptions: counts.newSubscriptions,
                    canceledSubscriptions: counts.canceledSubscriptions,
                    expiredSubscriptions: counts.expiredSubscriptions,
                    revenueByMembership: revenueByMembership.map((r) => ({
                        membershipId: new mongoose.Types.ObjectId(r.membershipId),
                        membershipName: r.membershipName,
                        revenue: r.revenue,
                        count: r.count,
                    })),
                });
            }
            return {
                id: analytics._id.toString(),
                date: analytics.date.toISOString(),
                totalRevenue: analytics.totalRevenue,
                activeSubscriptions: analytics.activeSubscriptions,
                newSubscriptions: analytics.newSubscriptions,
                canceledSubscriptions: analytics.canceledSubscriptions,
                expiredSubscriptions: analytics.expiredSubscriptions,
                revenueByMembership: analytics.revenueByMembership.map((r) => ({
                    membershipId: r.membershipId.toString(),
                    membershipName: r.membershipName,
                    revenue: r.revenue,
                    count: r.count,
                })),
                createdAt: analytics.createdAt?.toISOString(),
                updatedAt: analytics.updatedAt?.toISOString(),
            };
        },
        getRevenueSummary: async (_, { dateRange }, context) => {
            // Authorization: Only admin can view revenue summary
            const userRole = context.auth.user?.role;
            if (userRole !== 'admin') {
                throw new Error('Unauthorized: Only admins can view revenue summary');
            }
            // Update today's analytics to ensure it's current
            await updateTodayAnalytics();
            // Get today's analytics (which contains current revenue from all transactions)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayAnalytics = await Analytics.findOne({ date: today }).lean();
            // Use stored analytics data or calculate if not available
            let totalRevenue = 0;
            let revenueByMembership = [];
            if (todayAnalytics) {
                totalRevenue = todayAnalytics.totalRevenue;
                revenueByMembership = todayAnalytics.revenueByMembership.map((r) => ({
                    membershipId: r.membershipId.toString(),
                    membershipName: r.membershipName,
                    revenue: r.revenue,
                    count: r.count,
                }));
            }
            else {
                // Fallback: calculate from all transactions if analytics not found
                const { totalRevenue: calculatedRevenue, revenueByMembership: calculatedRevenueByMembership } = await calculateRevenueFromAllTransactions();
                totalRevenue = calculatedRevenue;
                revenueByMembership = calculatedRevenueByMembership;
            }
            const counts = await getSubscriptionCounts(dateRange);
            // Calculate revenue by period (daily for the last 30 days if no date range)
            // For period revenue, we show NEW revenue added each day (transactions created that day)
            // This is different from total revenue which shows all active subscriptions
            let periodRevenue = [];
            if (dateRange) {
                // Calculate daily NEW revenue for the date range (transactions created each day)
                const startDate = new Date(dateRange.startDate);
                const endDate = new Date(dateRange.endDate);
                const currentDate = new Date(startDate);
                while (currentDate <= endDate) {
                    const dayStart = new Date(currentDate);
                    dayStart.setHours(0, 0, 0, 0);
                    const dayEnd = new Date(currentDate);
                    dayEnd.setHours(23, 59, 59, 999);
                    // Count transactions created on this day (new revenue added)
                    const dayTransactions = await MembershipTransaction.find({
                        status: 'Active',
                        createdAt: {
                            $gte: dayStart,
                            $lte: dayEnd,
                        },
                    }).lean();
                    const dayRevenue = dayTransactions.reduce((sum, t) => sum + (t.priceAtPurchase || 0), 0);
                    const dayCount = dayTransactions.length;
                    periodRevenue.push({
                        period: dayStart.toISOString().split('T')[0],
                        revenue: dayRevenue,
                        count: dayCount,
                    });
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            }
            else {
                // Default: last 30 days - show new revenue added each day
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - 30);
                const currentDate = new Date(startDate);
                while (currentDate <= endDate) {
                    const dayStart = new Date(currentDate);
                    dayStart.setHours(0, 0, 0, 0);
                    const dayEnd = new Date(currentDate);
                    dayEnd.setHours(23, 59, 59, 999);
                    // Count transactions created on this day (new revenue added)
                    const dayTransactions = await MembershipTransaction.find({
                        status: 'Active',
                        createdAt: {
                            $gte: dayStart,
                            $lte: dayEnd,
                        },
                    }).lean();
                    const dayRevenue = dayTransactions.reduce((sum, t) => sum + (t.priceAtPurchase || 0), 0);
                    const dayCount = dayTransactions.length;
                    periodRevenue.push({
                        period: dayStart.toISOString().split('T')[0],
                        revenue: dayRevenue,
                        count: dayCount,
                    });
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            }
            return {
                totalRevenue,
                activeSubscriptions: counts.activeSubscriptions,
                newSubscriptions: counts.newSubscriptions,
                canceledSubscriptions: counts.canceledSubscriptions,
                expiredSubscriptions: counts.expiredSubscriptions,
                revenueByMembership: revenueByMembership.map((r) => ({
                    membershipId: r.membershipId,
                    membershipName: r.membershipName,
                    revenue: r.revenue,
                    count: r.count,
                })),
                revenueByPeriod: periodRevenue,
            };
        },
        getAnalyticsRange: async (_, { dateRange }, context) => {
            // Authorization: Only admin can view analytics
            const userRole = context.auth.user?.role;
            if (userRole !== 'admin') {
                throw new Error('Unauthorized: Only admins can view analytics');
            }
            const startDate = new Date(dateRange.startDate);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(dateRange.endDate);
            endDate.setHours(23, 59, 59, 999);
            const analytics = await Analytics.find({
                date: {
                    $gte: startDate,
                    $lte: endDate,
                },
            })
                .sort({ date: -1 })
                .lean();
            return analytics.map((a) => ({
                id: a._id.toString(),
                date: a.date.toISOString(),
                totalRevenue: a.totalRevenue,
                activeSubscriptions: a.activeSubscriptions,
                newSubscriptions: a.newSubscriptions,
                canceledSubscriptions: a.canceledSubscriptions,
                expiredSubscriptions: a.expiredSubscriptions,
                revenueByMembership: a.revenueByMembership.map((r) => ({
                    membershipId: r.membershipId.toString(),
                    membershipName: r.membershipName,
                    revenue: r.revenue,
                    count: r.count,
                })),
                createdAt: a.createdAt?.toISOString(),
                updatedAt: a.updatedAt?.toISOString(),
            }));
        },
    },
    Subscription: {
        revenueSummaryUpdated: {
            subscribe: (_, { dateRange }, context) => {
                // Authorization check
                if (!context.user || context.user.role !== 'admin') {
                    throw new Error('Unauthorized: Only admins can subscribe to revenue updates');
                }
                // Return async iterator for the subscription
                return pubsub.asyncIterator(EVENTS.REVENUE_SUMMARY_UPDATED);
            },
            resolve: async (payload, { dateRange }) => {
                // Recalculate revenue summary when event is published
                return await getRevenueSummaryData(dateRange);
            },
        },
    },
};
// Helper function to get revenue summary data (extracted from getRevenueSummary)
async function getRevenueSummaryData(dateRange) {
    const counts = await getSubscriptionCounts(dateRange);
    const revenueData = await calculateRevenueFromAllTransactions();
    // Calculate revenue by period if dateRange is provided
    let revenueByPeriod = [];
    if (dateRange) {
        // Group transactions by period (monthly)
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        const periodMap = new Map();
        const transactions = await MembershipTransaction.find({
            createdAt: {
                $gte: startDate,
                $lte: endDate,
            },
        }).lean();
        for (const transaction of transactions) {
            const transactionDate = new Date(transaction.createdAt);
            const period = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
            const price = transaction.priceAtPurchase || 0;
            const existing = periodMap.get(period);
            if (existing) {
                existing.revenue += price;
                existing.count += 1;
            }
            else {
                periodMap.set(period, { revenue: price, count: 1 });
            }
        }
        revenueByPeriod = Array.from(periodMap.entries()).map(([period, data]) => ({
            period,
            revenue: data.revenue,
            count: data.count,
        }));
    }
    return {
        totalRevenue: revenueData.totalRevenue,
        activeSubscriptions: counts.activeSubscriptions,
        newSubscriptions: counts.newSubscriptions,
        canceledSubscriptions: counts.canceledSubscriptions,
        expiredSubscriptions: counts.expiredSubscriptions,
        revenueByMembership: Array.from(revenueData.revenueByMembership.values()),
        revenueByPeriod,
    };
}
