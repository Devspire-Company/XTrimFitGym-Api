// @ts-nocheck
import Membership from '../../database/models/membership/membership-shema.js';
import MembershipTransaction from '../../database/models/membership/membershipTransaction-schema.js';
import User from '../../database/models/user/user-schema.js';
import { IAuthContext } from '../../context/auth-context.js';
import mongoose from 'mongoose';
import {
	onSubscriptionCreated,
	onSubscriptionCanceled,
	onSubscriptionSwitched,
} from '../../database/models/analytics/analytics-helper.js';
import { pubsub, EVENTS } from '../pubsub.js';
import {
	isDailyDurationType,
	resolveSubscriptionLength,
	resolveTransactionMonthDuration,
} from '../../database/utils/membership-expiry.js';

type Context = IAuthContext;

const mapMembershipToGraphQL = (membership: any) => {
	// Calculate monthDuration based on durationType if not set (DAILY: field stores calendar days)
	let monthDuration = membership.monthDuration;
	if (isDailyDurationType(membership.durationType)) {
		if (!monthDuration || monthDuration < 1) {
			monthDuration = 1;
		}
	} else if (!monthDuration || monthDuration < 1) {
		const durationType = membership.durationType?.toLowerCase() || 'monthly';
		if (durationType === 'monthly') {
			monthDuration = 1;
		} else if (durationType === 'quarterly') {
			monthDuration = 3;
		} else if (durationType === 'yearly') {
			monthDuration = 12;
		} else {
			monthDuration = 1; // default fallback
		}
	}

	return {
		id: membership._id.toString(),
		name: membership.name,
		monthlyPrice: membership.monthlyPrice,
		description: membership.description || null,
		features: membership.features || [],
		status: membership.status?.toUpperCase() || 'INACTIVE',
		durationType: membership.durationType?.toUpperCase() || 'MONTHLY',
		monthDuration: monthDuration,
		createdAt: membership.createdAt?.toISOString(),
		updatedAt: membership.updatedAt?.toISOString(),
	};
};

const mapTransactionToGraphQL = (transaction: any, membershipPlan?: any) => {
	const plan =
		membershipPlan ||
		(typeof transaction.membership_id === 'object' && transaction.membership_id
			? transaction.membership_id
			: null);
	return {
		id: transaction._id.toString(),
		clientId: transaction.client_id.toString(),
		client: transaction.client_id,
		membershipId: transaction.membership_id?.toString
			? transaction.membership_id.toString()
			: String(transaction.membership_id),
		membership: transaction.membership_id,
		priceAtPurchase: transaction.priceAtPurchase,
		startedAt: transaction.startedAt?.toISOString(),
		expiresAt: transaction.expiresAt?.toISOString(),
		monthDuration: resolveTransactionMonthDuration(transaction, plan),
		dayDuration:
			transaction.dayDuration != null && transaction.dayDuration >= 1
				? transaction.dayDuration
				: null,
		status: transaction.status?.toUpperCase() || 'ACTIVE',
		canceledReason: transaction.canceledReason ?? null,
		canceledAt: transaction.canceledAt?.toISOString?.() ?? null,
		canceledById: transaction.canceledBy?.toString?.() ?? null,
		lastAdjustedReason: transaction.lastAdjustedReason ?? null,
		lastAdjustedAt: transaction.lastAdjustedAt?.toISOString?.() ?? null,
		lastAdjustedById: transaction.lastAdjustedBy?.toString?.() ?? null,
		createdAt: transaction.createdAt?.toISOString(),
		updatedAt: transaction.updatedAt?.toISOString(),
	};
};

export default {
	Query: {
		getMemberships: async (
			_: any,
			{ status }: { status?: string },
			context: Context
		) => {
			const query: any = {};
			if (status) {
				query.status = status.charAt(0) + status.slice(1).toLowerCase();
			}

			const memberships = await Membership.find(query)
				.sort({ monthlyPrice: 1 })
				.lean();

			return memberships.map(mapMembershipToGraphQL);
		},

		getMembership: async (_: any, { id }: { id: string }, context: Context) => {
			const membership = await Membership.findById(id).lean();

			if (!membership) {
				throw new Error('Membership not found');
			}

			return mapMembershipToGraphQL(membership);
		},

		getCurrentMembership: async (_: any, __: any, context: Context) => {
			const userId = context.auth.user?.id;
			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			const transaction = await MembershipTransaction.findOne({
				client_id: new mongoose.Types.ObjectId(userId),
				status: 'Active',
			})
				.populate('membership_id')
				.populate('client_id', 'firstName lastName email')
				.sort({ createdAt: -1 })
				.lean();

			if (!transaction) {
				return null;
			}

			// Check if expired
			if (new Date(transaction.expiresAt) < new Date()) {
				await MembershipTransaction.findByIdAndUpdate(transaction._id, {
					status: 'Expired',
				});
				// Update analytics when transaction expires (revenue is NOT deducted)
				await onSubscriptionCanceled(transaction._id.toString());
				return null;
			}

			return mapTransactionToGraphQL(transaction);
		},

		getMembershipTransaction: async (
			_: any,
			{ id }: { id: string },
			context: Context
		) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			const transaction = await MembershipTransaction.findById(id)
				.populate('membership_id')
				.populate('client_id', 'firstName lastName email')
				.lean();

			if (!transaction) {
				throw new Error('Membership transaction not found');
			}

			// Authorization: Only client or admin can view transaction
			if (transaction.client_id.toString() !== userId && userRole !== 'admin') {
				throw new Error('Unauthorized: You cannot view this transaction');
			}

			return mapTransactionToGraphQL(transaction);
		},
	},

	Mutation: {
		createMembership: async (
			_: any,
			{ input }: { input: any },
			context: Context
		) => {
			// Authorization: Only admin can create memberships
			const userRole = context.auth.user?.role;
			if (userRole !== 'admin') {
				throw new Error('Unauthorized: Only admins can create memberships');
			}

			const membership = new Membership({
				name: input.name,
				monthlyPrice: input.monthlyPrice,
				description: input.description || null,
				features: input.features || [],
				status:
					input.status.charAt(0) + input.status.slice(1).toLowerCase() || 'Active',
				durationType:
					input.durationType.charAt(0) +
						input.durationType.slice(1).toLowerCase() || 'Monthly',
				monthDuration: input.monthDuration || 1,
			});

			await membership.save();

			// Publish event for membership updates
			pubsub.publish(EVENTS.MEMBERSHIPS_UPDATED, {});

			return mapMembershipToGraphQL(membership);
		},

		updateMembership: async (
			_: any,
			{ id, input }: { id: string; input: any },
			context: Context
		) => {
			// Authorization: Only admin can update memberships
			const userRole = context.auth.user?.role;
			if (userRole !== 'admin') {
				throw new Error('Unauthorized: Only admins can update memberships');
			}

			const updateData: any = {};
			if (input.name !== undefined) updateData.name = input.name;
			if (input.monthlyPrice !== undefined)
				updateData.monthlyPrice = input.monthlyPrice;
			if (input.description !== undefined)
				updateData.description = input.description;
			if (input.features !== undefined) updateData.features = input.features;
			if (input.status !== undefined)
				updateData.status =
					input.status.charAt(0) + input.status.slice(1).toLowerCase();
			if (input.durationType !== undefined)
				updateData.durationType =
					input.durationType.charAt(0) + input.durationType.slice(1).toLowerCase();
			if (input.monthDuration !== undefined)
				updateData.monthDuration = input.monthDuration;

			const membership = await Membership.findByIdAndUpdate(id, updateData, {
				new: true,
			}).lean();

			if (!membership) {
				throw new Error('Membership not found');
			}

			// Publish event for membership updates
			pubsub.publish(EVENTS.MEMBERSHIPS_UPDATED, {});

			return mapMembershipToGraphQL(membership);
		},

		deleteMembership: async (_: any, { id }: { id: string }, context: Context) => {
			// Authorization: Only admin can delete memberships
			const userRole = context.auth.user?.role;
			if (userRole !== 'admin') {
				throw new Error('Unauthorized: Only admins can delete memberships');
			}

			// Check if any active transactions use this membership
			const activeTransactions = await MembershipTransaction.countDocuments({
				membership_id: new mongoose.Types.ObjectId(id),
				status: 'Active',
			});

			if (activeTransactions > 0) {
				throw new Error(
					'Cannot delete membership plan with active subscriptions. Please set it to Inactive instead.'
				);
			}

			const deleted = await Membership.findByIdAndDelete(id);

			if (!deleted) {
				throw new Error('Membership not found');
			}

			// Publish event for membership updates
			pubsub.publish(EVENTS.MEMBERSHIPS_UPDATED, {});

			return true;
		},

		purchaseMembership: async (
			_: any,
			{ input }: { input: any },
			context: Context
		) => {
			// Authorization: Only members can purchase memberships
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (userRole !== 'member' && userRole !== 'admin') {
				throw new Error('Unauthorized: Only members can purchase memberships');
			}

			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			const membership = await Membership.findById(input.membershipId).lean();
			if (!membership) {
				throw new Error('Membership not found');
			}

			if (membership.status !== 'Active') {
				throw new Error('This membership plan is not available');
			}

			// Check if user has an existing active membership (switching plans)
			const existingActive = await MembershipTransaction.findOne({
				client_id: new mongoose.Types.ObjectId(userId),
				status: 'Active',
			}).lean();

			// Calculate remaining days from existing subscription if not expired
			let remainingDays = 0;
			if (existingActive && existingActive.expiresAt) {
				const now = new Date();
				const expiryDate = new Date(existingActive.expiresAt);
				
				// Only add remaining days if the subscription hasn't expired yet
				if (expiryDate > now) {
					const diffTime = expiryDate.getTime() - now.getTime();
					remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert to days
					remainingDays = Math.max(0, remainingDays); // Ensure non-negative
				}
			}

			// Cancel any existing active memberships (when switching plans)
			await MembershipTransaction.updateMany(
				{
					client_id: new mongoose.Types.ObjectId(userId),
					status: 'Active',
				},
				{
					status: 'Canceled',
				}
			);

			const now = new Date();
			const { expiresAt, monthDuration, dayDuration } = resolveSubscriptionLength(
				now,
				membership,
				{ extraDays: remainingDays }
			);

			const transaction = new MembershipTransaction({
				client_id: new mongoose.Types.ObjectId(userId),
				membership_id: new mongoose.Types.ObjectId(input.membershipId),
				priceAtPurchase: membership.monthlyPrice,
				startedAt: now,
				expiresAt,
				monthDuration,
				...(dayDuration != null ? { dayDuration } : {}),
				status: 'Active',
			});

			await transaction.save();

			// Update user's membership details
			await User.findByIdAndUpdate(userId, {
				'membershipDetails.membership_id': new mongoose.Types.ObjectId(
					input.membershipId
				),
			});

			// Update analytics: If switching plans, use onSubscriptionSwitched; otherwise onSubscriptionCreated
			if (existingActive) {
				await onSubscriptionSwitched(transaction._id.toString());
			} else {
				await onSubscriptionCreated(transaction._id.toString());
			}

			// TODO: Send push notification for payment reminder
			// Schedule notification for a few days before expiry

			const populatedTransaction = await MembershipTransaction.findById(
				transaction._id
			)
				.populate('membership_id')
				.populate('client_id', 'firstName lastName email')
				.lean();

			const planDoc = populatedTransaction.membership_id;
			const planLean =
				typeof planDoc === 'object' && planDoc && '_id' in planDoc ? planDoc : membership;
			return mapTransactionToGraphQL(populatedTransaction, planLean);
		},

		updateMembershipTransactionDuration: async (
			_: any,
			{
				input,
			}: {
				input: {
					transactionId: string;
					monthDuration?: number | null;
					dayDuration?: number | null;
					startedAt?: string | null;
					reason: string;
				};
			},
			context: Context
		) => {
			const userRole = context.auth.user?.role;
			const userId = context.auth.user?.id;
			if (userRole !== 'admin') {
				throw new Error('Unauthorized: Only admins can update subscription duration');
			}
			if (!input.reason?.trim()) {
				throw new Error('A valid reason is required');
			}

			const hasMonths =
				input.monthDuration != null && Number.isFinite(input.monthDuration) && input.monthDuration >= 1;
			const hasDays =
				input.dayDuration != null && Number.isFinite(input.dayDuration) && input.dayDuration >= 1;
			if (hasMonths === hasDays) {
				throw new Error('Provide exactly one of monthDuration (months) or dayDuration (days)');
			}

			const transaction = await MembershipTransaction.findById(input.transactionId)
				.populate('membership_id')
				.lean();

			if (!transaction) {
				throw new Error('Membership transaction not found');
			}

			if (transaction.status !== 'Active') {
				throw new Error('Only active subscriptions can be adjusted');
			}

			const planLeanRaw = transaction.membership_id;
			const planLean =
				typeof planLeanRaw === 'object' && planLeanRaw && '_id' in planLeanRaw
					? planLeanRaw
					: await Membership.findById(transaction.membership_id).lean();
			if (!planLean) {
				throw new Error('Membership plan not found for this transaction');
			}

			let effectiveStart: Date;
			if (input.startedAt != null && String(input.startedAt).trim() !== '') {
				effectiveStart = new Date(input.startedAt as string);
				if (Number.isNaN(effectiveStart.getTime())) {
					throw new Error('Invalid startedAt: use a valid ISO date/time string');
				}
			} else {
				effectiveStart = new Date(transaction.startedAt);
			}

			const { expiresAt, monthDuration, dayDuration } = resolveSubscriptionLength(
				effectiveStart,
				planLean as { durationType?: string | null; monthDuration?: number | null },
				hasDays
					? { lengthDays: input.dayDuration as number, extraDays: 0 }
					: {
							lengthMonths: input.monthDuration as number,
							extraDays: 0,
							forceMonthBased: true,
					  }
			);
			const now = new Date();

			const updatePayload: Record<string, unknown> = {
				expiresAt,
				monthDuration,
				dayDuration: dayDuration ?? null,
				lastAdjustedReason: input.reason.trim(),
				lastAdjustedAt: new Date(),
				...(userId ? { lastAdjustedBy: new mongoose.Types.ObjectId(userId) } : {}),
			};

			if (input.startedAt != null && String(input.startedAt).trim() !== '') {
				updatePayload.startedAt = effectiveStart;
			}

			if (expiresAt <= now) {
				updatePayload.status = 'Expired';
			} else {
				updatePayload.status = 'Active';
			}

			const updated = await MembershipTransaction.findByIdAndUpdate(
				input.transactionId,
				updatePayload,
				{ new: true }
			)
				.populate('membership_id')
				.populate('client_id', 'firstName lastName email')
				.lean();

			if (!updated) {
				throw new Error('Failed to update membership transaction');
			}

			if (expiresAt <= now) {
				await onSubscriptionCanceled(input.transactionId);
			}

			const planForMap =
				typeof updated.membership_id === 'object' && updated.membership_id && '_id' in updated.membership_id
					? updated.membership_id
					: await Membership.findById(updated.membership_id).lean();

			return mapTransactionToGraphQL(updated, planForMap);
		},

		cancelMembership: async (
			_: any,
			{ transactionId, reason }: { transactionId: string; reason: string },
			context: Context
		) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}
			if (!reason?.trim()) {
				throw new Error('Cancellation reason is required');
			}

			const transaction = await MembershipTransaction.findById(
				transactionId
			).lean();

			if (!transaction) {
				throw new Error('Membership transaction not found');
			}

			// Authorization: Only client or admin can cancel
			if (transaction.client_id.toString() !== userId && userRole !== 'admin') {
				throw new Error('Unauthorized: You cannot cancel this membership');
			}

			// IMPORTANT: Changing status to 'Canceled' does NOT affect revenue calculations
			// Revenue is calculated from ALL transactions (Active, Canceled, Expired)
			// This ensures revenue reflects all money ever received, so canceling a subscription
			// doesn't deduct revenue (the transaction still exists with its priceAtPurchase)
			await MembershipTransaction.findByIdAndUpdate(transactionId, {
				status: 'Canceled',
				canceledReason: reason.trim(),
				canceledAt: new Date(),
				canceledBy: new mongoose.Types.ObjectId(userId),
			});

			// Update analytics: Revenue is NOT deducted (transaction still counts), only counts are updated
			await onSubscriptionCanceled(transactionId);

			return true;
		},
	},

	MembershipTransaction: {
		client: async (parent: any) => {
			if (typeof parent.client === 'string') {
				const user = await User.findById(parent.client)
					.select('firstName lastName email')
					.lean();
				return user
					? {
							id: user._id.toString(),
							firstName: user.firstName,
							lastName: user.lastName,
							email: user.email,
					  }
					: null;
			}
			return parent.client;
		},
		membership: async (parent: any) => {
			// Handle string ID
			if (typeof parent.membership === 'string') {
				const membership = await Membership.findById(parent.membership).lean();
				return membership ? mapMembershipToGraphQL(membership) : null;
			}
			// Handle populated membership object (from mongoose populate)
			if (parent.membership && typeof parent.membership === 'object') {
				// Check if it's already a GraphQL-formatted object (has id field)
				if (parent.membership.id) {
					return parent.membership;
				}
				// If it's a mongoose document/object, map it
				if (parent.membership._id) {
					return mapMembershipToGraphQL(parent.membership);
				}
			}
			// Fallback: try to fetch by membershipId if available
			if (parent.membershipId) {
				const membership = await Membership.findById(parent.membershipId).lean();
				return membership ? mapMembershipToGraphQL(membership) : null;
			}
			return null;
		},
	},

	User: {
		currentMembership: async (parent: any) => {
			const userId = typeof parent === 'string' ? parent : parent.id;
			const transaction = await MembershipTransaction.findOne({
				client_id: new mongoose.Types.ObjectId(userId),
				status: 'Active',
			})
				.populate('membership_id')
				.sort({ createdAt: -1 })
				.lean();

			if (!transaction) {
				return null;
			}

			// Check if expired
			if (new Date(transaction.expiresAt) < new Date()) {
				await MembershipTransaction.findByIdAndUpdate(transaction._id, {
					status: 'Expired',
				});
				// Update analytics when transaction expires (revenue is NOT deducted)
				await onSubscriptionCanceled(transaction._id.toString());
				return null;
			}

			return mapTransactionToGraphQL(transaction);
		},
	},

	Subscription: {
		membershipsUpdated: {
			subscribe: (_: any, __: any, context: Context) => {
				// Authorization check
				if (!context.user || context.user.role !== 'admin') {
					throw new Error('Unauthorized: Only admins can subscribe to membership updates');
				}

				// Return async iterator for the subscription
				return pubsub.asyncIterableIterator(EVENTS.MEMBERSHIPS_UPDATED);
			},
			resolve: async () => {
				// Re-fetch memberships when event is published
				const memberships = await Membership.find({}).lean();
				return memberships.map((m) => mapMembershipToGraphQL(m));
			},
		},
	},
};
