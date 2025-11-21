import Membership from '../../database/models/membership/membership-shema.js';
import MembershipTransaction from '../../database/models/membership/membershipTransaction-schema.js';
import User from '../../database/models/user/user-schema.js';
import mongoose from 'mongoose';

interface Context {
	userId?: string;
	userRole?: string;
}

const mapMembershipToGraphQL = (membership: any) => {
	return {
		id: membership._id.toString(),
		name: membership.name,
		monthlyPrice: membership.monthlyPrice,
		description: membership.description || null,
		features: membership.features || [],
		status: membership.status?.toUpperCase() || 'INACTIVE',
		durationType: membership.durationType?.toUpperCase() || 'MONTHLY',
		createdAt: membership.createdAt?.toISOString(),
		updatedAt: membership.updatedAt?.toISOString(),
	};
};

const mapTransactionToGraphQL = (transaction: any) => {
	return {
		id: transaction._id.toString(),
		clientId: transaction.client_id.toString(),
		client: transaction.client_id,
		membershipId: transaction.membership_id.toString(),
		membership: transaction.membership_id,
		priceAtPurchase: transaction.priceAtPurchase,
		startedAt: transaction.startedAt?.toISOString(),
		expiresAt: transaction.expiresAt?.toISOString(),
		status: transaction.status?.toUpperCase() || 'ACTIVE',
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
			if (!context.userId) {
				throw new Error('Unauthorized: Please log in');
			}

			const transaction = await MembershipTransaction.findOne({
				client_id: new mongoose.Types.ObjectId(context.userId),
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
				return null;
			}

			return mapTransactionToGraphQL(transaction);
		},

		getMembershipTransaction: async (
			_: any,
			{ id }: { id: string },
			context: Context
		) => {
			if (!context.userId) {
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
			if (
				transaction.client_id.toString() !== context.userId &&
				context.userRole !== 'admin'
			) {
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
			if (context.userRole !== 'admin') {
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
			});

			await membership.save();

			return mapMembershipToGraphQL(membership);
		},

		purchaseMembership: async (
			_: any,
			{ input }: { input: any },
			context: Context
		) => {
			// Authorization: Only members can purchase memberships
			if (context.userRole !== 'member' && context.userRole !== 'admin') {
				throw new Error('Unauthorized: Only members can purchase memberships');
			}

			if (!context.userId) {
				throw new Error('Unauthorized: Please log in');
			}

			const membership = await Membership.findById(input.membershipId).lean();
			if (!membership) {
				throw new Error('Membership not found');
			}

			if (membership.status !== 'Active') {
				throw new Error('This membership plan is not available');
			}

			// Cancel any existing active memberships
			await MembershipTransaction.updateMany(
				{
					client_id: new mongoose.Types.ObjectId(context.userId),
					status: 'Active',
				},
				{
					status: 'Canceled',
				}
			);

			// Calculate expiry date based on duration type
			const now = new Date();
			let expiresAt = new Date(now);

			switch (membership.durationType) {
				case 'Monthly':
					expiresAt.setMonth(expiresAt.getMonth() + 1);
					break;
				case 'Quarterly':
					expiresAt.setMonth(expiresAt.getMonth() + 3);
					break;
				case 'Yearly':
					expiresAt.setFullYear(expiresAt.getFullYear() + 1);
					break;
			}

			const transaction = new MembershipTransaction({
				client_id: new mongoose.Types.ObjectId(context.userId),
				membership_id: new mongoose.Types.ObjectId(input.membershipId),
				priceAtPurchase: membership.monthlyPrice,
				startedAt: now,
				expiresAt,
				status: 'Active',
			});

			await transaction.save();

			// Update user's membership details
			await User.findByIdAndUpdate(context.userId, {
				'membershipDetails.membership_id': new mongoose.Types.ObjectId(
					input.membershipId
				),
			});

			// TODO: Send push notification for payment reminder
			// Schedule notification for a few days before expiry

			const populatedTransaction = await MembershipTransaction.findById(
				transaction._id
			)
				.populate('membership_id')
				.populate('client_id', 'firstName lastName email')
				.lean();

			return mapTransactionToGraphQL(populatedTransaction);
		},

		cancelMembership: async (
			_: any,
			{ transactionId }: { transactionId: string },
			context: Context
		) => {
			if (!context.userId) {
				throw new Error('Unauthorized: Please log in');
			}

			const transaction = await MembershipTransaction.findById(
				transactionId
			).lean();

			if (!transaction) {
				throw new Error('Membership transaction not found');
			}

			// Authorization: Only client or admin can cancel
			if (
				transaction.client_id.toString() !== context.userId &&
				context.userRole !== 'admin'
			) {
				throw new Error('Unauthorized: You cannot cancel this membership');
			}

			await MembershipTransaction.findByIdAndUpdate(transactionId, {
				status: 'Canceled',
			});

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
			if (typeof parent.membership === 'string') {
				const membership = await Membership.findById(parent.membership).lean();
				return membership ? mapMembershipToGraphQL(membership) : null;
			}
			return parent.membership;
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
				return null;
			}

			return mapTransactionToGraphQL(transaction);
		},
	},
};
