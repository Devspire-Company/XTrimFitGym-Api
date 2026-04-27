// @ts-nocheck
import Analytics from '../../database/models/analytics/analytics-schema.js';
import MembershipTransaction from '../../database/models/membership/membershipTransaction-schema.js';
import Membership from '../../database/models/membership/membership-shema.js';
import { IAuthContext } from '../../context/auth-context.js';
import mongoose from 'mongoose';
import { updateTodayAnalytics } from '../../database/models/analytics/analytics-helper.js';
import {
	sumWalkInPaymentsTotal,
	walkInPaymentsByLocalDateRange,
	manilaYmd,
} from '../../database/models/analytics/walk-in-revenue.js';
import { pubsub, EVENTS } from '../pubsub.js';

type Context = IAuthContext;

function normalizeStoredAnalyticsRevenue(a: any) {
	const w = a.walkInRevenue ?? 0;
	const m =
		a.membershipSubscriptionRevenue != null
			? a.membershipSubscriptionRevenue
			: Math.max(0, (a.totalRevenue ?? 0) - w);
	const t = m + w;
	return {
		totalRevenue: t,
		membershipSubscriptionRevenue: m,
		walkInRevenue: w,
	};
}

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
	const query: any = {}; // No status filter - count all transactions

	const transactions = await MembershipTransaction.find(query).lean();

	let membershipSubscriptionRevenue = 0;
	const revenueByMembership: Map<string, { membershipId: string; membershipName: string; revenue: number; count: number }> = new Map();

	for (const transaction of transactions) {
		const price = transaction.priceAtPurchase || 0;
		membershipSubscriptionRevenue += price;

		const membershipId = transaction.membership_id.toString();
		const existing = revenueByMembership.get(membershipId);

		if (existing) {
			existing.revenue += price;
			existing.count += 1;
		} else {
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
		membershipSubscriptionRevenue,
		revenueByMembership: Array.from(revenueByMembership.values()),
	};
};

// Helper function to get subscription counts
const getSubscriptionCounts = async (dateRange?: { startDate: string; endDate: string }) => {
	const baseQuery: any = {};
	const dateQuery: any = {};

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

async function buildPeriodRevenueWithWalkIn(
	dateRange?: { startDate: string; endDate: string },
): Promise<
	Array<{
		period: string;
		revenue: number;
		count: number;
		walkInRevenue: number;
		walkInCount: number;
	}>
> {
	let walkMap = new Map<string, { revenue: number; count: number }>();
	if (dateRange) {
		const sd = new Date(dateRange.startDate);
		const ed = new Date(dateRange.endDate);
		let y1 = manilaYmd(sd);
		let y2 = manilaYmd(ed);
		if (y1 > y2) {
			const t = y1;
			y1 = y2;
			y2 = t;
		}
		walkMap = await walkInPaymentsByLocalDateRange(y1, y2);
	} else {
		const endDate = new Date();
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - 30);
		walkMap = await walkInPaymentsByLocalDateRange(
			manilaYmd(startDate),
			manilaYmd(endDate),
		);
	}

	const periodRevenue: Array<{
		period: string;
		revenue: number;
		count: number;
		walkInRevenue: number;
		walkInCount: number;
	}> = [];

	if (dateRange) {
		const startDate = new Date(dateRange.startDate);
		const endDate = new Date(dateRange.endDate);
		const currentDate = new Date(startDate);

		while (currentDate <= endDate) {
			const dayStart = new Date(currentDate);
			dayStart.setHours(0, 0, 0, 0);
			const dayEnd = new Date(currentDate);
			dayEnd.setHours(23, 59, 59, 999);

			const dayTransactions = await MembershipTransaction.find({
				status: 'Active',
				createdAt: {
					$gte: dayStart,
					$lte: dayEnd,
				},
			}).lean();

			const dayRevenue = dayTransactions.reduce((sum, t) => sum + (t.priceAtPurchase || 0), 0);
			const dayCount = dayTransactions.length;
			const manilaDay = manilaYmd(currentDate);
			const w = walkMap.get(manilaDay) ?? { revenue: 0, count: 0 };

			periodRevenue.push({
				period: dayStart.toISOString().split('T')[0],
				revenue: dayRevenue + w.revenue,
				count: dayCount,
				walkInRevenue: w.revenue,
				walkInCount: w.count,
			});

			currentDate.setDate(currentDate.getDate() + 1);
		}
	} else {
		const endDate = new Date();
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - 30);

		const currentDate = new Date(startDate);
		while (currentDate <= endDate) {
			const dayStart = new Date(currentDate);
			dayStart.setHours(0, 0, 0, 0);
			const dayEnd = new Date(currentDate);
			dayEnd.setHours(23, 59, 59, 999);

			const dayTransactions = await MembershipTransaction.find({
				status: 'Active',
				createdAt: {
					$gte: dayStart,
					$lte: dayEnd,
				},
			}).lean();

			const dayRevenue = dayTransactions.reduce((sum, t) => sum + (t.priceAtPurchase || 0), 0);
			const dayCount = dayTransactions.length;
			const manilaDay = manilaYmd(currentDate);
			const w = walkMap.get(manilaDay) ?? { revenue: 0, count: 0 };

			periodRevenue.push({
				period: dayStart.toISOString().split('T')[0],
				revenue: dayRevenue + w.revenue,
				count: dayCount,
				walkInRevenue: w.revenue,
				walkInCount: w.count,
			});

			currentDate.setDate(currentDate.getDate() + 1);
		}
	}

	return periodRevenue;
}

export default {
	Query: {
		getAnalytics: async (_: any, { date }: { date: string }, context: Context) => {
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
				const { membershipSubscriptionRevenue, revenueByMembership } =
					await calculateRevenueFromAllTransactions();
				const walkInRevenue = await sumWalkInPaymentsTotal();
				const counts = await getSubscriptionCounts(dateRange);

				// Create and save analytics
				analytics = await Analytics.create({
					date: targetDate,
					membershipSubscriptionRevenue,
					walkInRevenue,
					totalRevenue: membershipSubscriptionRevenue + walkInRevenue,
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

			const rev = normalizeStoredAnalyticsRevenue(analytics);

			return {
				id: analytics._id.toString(),
				date: analytics.date.toISOString(),
				totalRevenue: rev.totalRevenue,
				membershipSubscriptionRevenue: rev.membershipSubscriptionRevenue,
				walkInRevenue: rev.walkInRevenue,
				activeSubscriptions: analytics.activeSubscriptions,
				newSubscriptions: analytics.newSubscriptions,
				canceledSubscriptions: analytics.canceledSubscriptions,
				expiredSubscriptions: analytics.expiredSubscriptions,
				revenueByMembership: analytics.revenueByMembership.map((r: any) => ({
					membershipId: r.membershipId.toString(),
					membershipName: r.membershipName,
					revenue: r.revenue,
					count: r.count,
				})),
				createdAt: analytics.createdAt?.toISOString(),
				updatedAt: analytics.updatedAt?.toISOString(),
			};
		},

		getRevenueSummary: async (
			_: any,
			{ dateRange }: { dateRange?: { startDate: string; endDate: string } },
			context: Context
		) => {
			// Authorization: Only admin can view revenue summary
			const userRole = context.auth.user?.role;
			if (userRole !== 'admin') {
				throw new Error('Unauthorized: Only admins can view revenue summary');
			}

			// Update today's analytics to ensure it's current
			await updateTodayAnalytics();

			const { membershipSubscriptionRevenue, revenueByMembership: mbList } =
				await calculateRevenueFromAllTransactions();
			const walkInRevenue = await sumWalkInPaymentsTotal();
			const totalRevenue = membershipSubscriptionRevenue + walkInRevenue;
			const revenueByMembership = mbList;

			const counts = await getSubscriptionCounts(dateRange);

			const periodRevenue = await buildPeriodRevenueWithWalkIn(dateRange);

			return {
				totalRevenue,
				membershipSubscriptionRevenue,
				walkInRevenue,
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

		getAnalyticsRange: async (
			_: any,
			{ dateRange }: { dateRange: { startDate: string; endDate: string } },
			context: Context
		) => {
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

			return analytics.map((a) => {
				const rev = normalizeStoredAnalyticsRevenue(a);
				return {
					id: a._id.toString(),
					date: a.date.toISOString(),
					totalRevenue: rev.totalRevenue,
					membershipSubscriptionRevenue: rev.membershipSubscriptionRevenue,
					walkInRevenue: rev.walkInRevenue,
					activeSubscriptions: a.activeSubscriptions,
					newSubscriptions: a.newSubscriptions,
					canceledSubscriptions: a.canceledSubscriptions,
					expiredSubscriptions: a.expiredSubscriptions,
					revenueByMembership: a.revenueByMembership.map((r: any) => ({
						membershipId: r.membershipId.toString(),
						membershipName: r.membershipName,
						revenue: r.revenue,
						count: r.count,
					})),
					createdAt: a.createdAt?.toISOString(),
					updatedAt: a.updatedAt?.toISOString(),
				};
			});
		},
	},
	Subscription: {
		revenueSummaryUpdated: {
			subscribe: (_: any, { dateRange }: { dateRange?: { startDate: string; endDate: string } }, context: Context) => {
				if (context.auth.user?.role !== 'admin') {
					throw new Error('Unauthorized: Only admins can subscribe to revenue updates');
				}

				// Return async iterator for the subscription
				return pubsub.asyncIterator(EVENTS.REVENUE_SUMMARY_UPDATED);
			},
			resolve: async (payload: any, { dateRange }: { dateRange?: { startDate: string; endDate: string } }) => {
				// Recalculate revenue summary when event is published
				return await getRevenueSummaryData(dateRange);
			},
		},
	},
};

async function getRevenueSummaryData(dateRange?: { startDate: string; endDate: string }) {
	const { membershipSubscriptionRevenue, revenueByMembership: mbList } =
		await calculateRevenueFromAllTransactions();
	const walkInRevenue = await sumWalkInPaymentsTotal();
	const counts = await getSubscriptionCounts(dateRange);
	const periodRevenue = await buildPeriodRevenueWithWalkIn(dateRange);

	return {
		totalRevenue: membershipSubscriptionRevenue + walkInRevenue,
		membershipSubscriptionRevenue,
		walkInRevenue,
		activeSubscriptions: counts.activeSubscriptions,
		newSubscriptions: counts.newSubscriptions,
		canceledSubscriptions: counts.canceledSubscriptions,
		expiredSubscriptions: counts.expiredSubscriptions,
		revenueByMembership: mbList.map((r) => ({
			membershipId: r.membershipId,
			membershipName: r.membershipName,
			revenue: r.revenue,
			count: r.count,
		})),
		revenueByPeriod: periodRevenue,
	};
}

