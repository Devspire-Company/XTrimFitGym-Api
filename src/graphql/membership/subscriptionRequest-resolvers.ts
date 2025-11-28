import SubscriptionRequest from '../../database/models/membership/subscriptionRequest-schema.js';
import Membership from '../../database/models/membership/membership-shema.js';
import MembershipTransaction from '../../database/models/membership/membershipTransaction-schema.js';
import User from '../../database/models/user/user-schema.js';
import { IAuthContext } from '../../context/auth-context.js';
import mongoose from 'mongoose';

// Helper to map membership to GraphQL format
const mapMembershipToGraphQL = (membership: any) => {
	if (!membership) return null;
	
	// Ensure we have a valid ID
	let membershipId: string | null = null;
	if (membership._id) {
		membershipId = membership._id.toString();
	} else if (membership.id) {
		membershipId = typeof membership.id === 'string' ? membership.id : membership.id.toString();
	}
	
	if (!membershipId) {
		console.error('⚠️ Cannot map membership: missing _id or id', membership);
		throw new Error('Invalid membership: missing ID');
	}
	
	return {
		id: membershipId,
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

type Context = IAuthContext;

const mapSubscriptionRequestToGraphQL = (request: any, membershipData?: any, memberData?: any) => {
	// If membershipData is provided, use it; otherwise use the request's membership_id
	const membership = membershipData 
		? mapMembershipToGraphQL(membershipData)
		: request.membership_id;

	// Handle member data - use provided memberData or format from request.member_id
	let member = memberData;
	if (!member) {
		const memberId = request.member_id;
		if (memberId && typeof memberId === 'object' && memberId._id) {
			// If it's a populated object, format it properly
			member = {
				id: memberId._id.toString(),
				firstName: memberId.firstName,
				lastName: memberId.lastName,
				email: memberId.email,
			};
		} else {
			// Otherwise, it's an ID string - will be resolved by the resolver
			member = memberId;
		}
	}

	return {
		id: request._id.toString(),
		memberId: request.member_id?.toString() || (typeof request.member_id === 'string' ? request.member_id : ''),
		member: member,
		membershipId: request.membership_id?.toString() || (typeof request.membership_id === 'string' ? request.membership_id : ''),
		membership: membership,
		status: request.status?.toUpperCase() || 'PENDING',
		requestedAt: request.requestedAt?.toISOString(),
		expiresAt: request.expiresAt?.toISOString(),
		approvedAt: request.approvedAt?.toISOString() || null,
		approvedBy: request.approvedBy || null,
		rejectedAt: request.rejectedAt?.toISOString() || null,
		rejectedBy: request.rejectedBy || null,
		createdAt: request.createdAt?.toISOString(),
		updatedAt: request.updatedAt?.toISOString(),
	};
};

const mapTransactionToGraphQL = (transaction: any, membershipData?: any) => {
	// If membershipData is provided, use it; otherwise use the transaction's membership_id
	const membership = membershipData 
		? mapMembershipToGraphQL(membershipData)
		: transaction.membership_id;

	return {
		id: transaction._id.toString(),
		clientId: transaction.client_id.toString(),
		client: transaction.client_id,
		membershipId: transaction.membership_id?.toString() || (typeof transaction.membership_id === 'string' ? transaction.membership_id : ''),
		membership: membership,
		priceAtPurchase: transaction.priceAtPurchase,
		startedAt: transaction.startedAt?.toISOString(),
		expiresAt: transaction.expiresAt?.toISOString(),
		status: transaction.status?.toUpperCase() || 'ACTIVE',
		createdAt: transaction.createdAt?.toISOString(),
		updatedAt: transaction.updatedAt?.toISOString(),
	};
};

// Helper function to create membership transaction
const createMembershipTransaction = async (
	memberId: string,
	membershipId: string,
	approvedBy?: string
) => {
	const membership = await Membership.findById(membershipId).lean();
	if (!membership) {
		throw new Error('Membership not found');
	}

	if (membership.status !== 'Active') {
		throw new Error('This membership plan is not available');
	}

	// Cancel any existing active memberships
	await MembershipTransaction.updateMany(
		{
			client_id: new mongoose.Types.ObjectId(memberId),
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
		client_id: new mongoose.Types.ObjectId(memberId),
		membership_id: new mongoose.Types.ObjectId(membershipId),
		priceAtPurchase: membership.monthlyPrice,
		startedAt: now,
		expiresAt,
		status: 'Active',
	});

	await transaction.save();

	// Update user's membership details
	await User.findByIdAndUpdate(memberId, {
		'membershipDetails.membership_id': new mongoose.Types.ObjectId(membershipId),
	});

	const populatedTransaction = await MembershipTransaction.findById(transaction._id)
		.populate('membership_id')
		.populate('client_id', 'firstName lastName email')
		.lean();

	if (!populatedTransaction) {
		throw new Error('Failed to create membership transaction');
	}

	// Ensure membership is properly populated and mapped
	let membershipData: any = populatedTransaction.membership_id;
	
	// If membership_id is a string (ObjectId), fetch the membership
	if (typeof membershipData === 'string' || !membershipData || !membershipData._id) {
		const membershipId = typeof membershipData === 'string' 
			? membershipData 
			: (populatedTransaction.membership_id?.toString() || populatedTransaction.membership_id);
		
		membershipData = await Membership.findById(membershipId).lean();
		if (!membershipData) {
			throw new Error('Membership not found');
		}
	}

	// Map the transaction with properly formatted membership
	const mappedTransaction = mapTransactionToGraphQL(populatedTransaction, membershipData);
	
	// Double-check that membership has an id
	if (!mappedTransaction.membership || !mappedTransaction.membership.id) {
		console.error('⚠️ Membership mapping failed, re-mapping...', {
			membershipData,
			mappedMembership: mappedTransaction.membership,
		});
		mappedTransaction.membership = mapMembershipToGraphQL(membershipData);
	}

	return mappedTransaction;
};

export default {
	Query: {
		getPendingSubscriptionRequests: async (_: any, __: any, context: Context) => {
			// Authorization: Only admin can view pending requests
			const userRole = context.auth.user?.role;
			if (userRole !== 'admin') {
				throw new Error('Unauthorized: Only admins can view pending subscription requests');
			}

			// Auto-expire old pending requests
			await SubscriptionRequest.updateMany(
				{
					status: 'Pending',
					expiresAt: { $lt: new Date() },
				},
				{
					status: 'Expired',
				}
			);

			const requests = await SubscriptionRequest.find({
				status: 'Pending',
				expiresAt: { $gt: new Date() },
			})
				.populate('member_id', 'firstName lastName email')
				.populate('membership_id')
				.sort({ requestedAt: -1 })
				.lean();

			// Map requests and ensure member data is properly formatted
			return requests.map((request) => {
				// Ensure member is properly formatted before mapping
				let memberData: any = null;
				if (request.member_id && typeof request.member_id === 'object' && request.member_id._id) {
					// If it's a populated object, format it properly
					memberData = {
						id: request.member_id._id.toString(),
						firstName: request.member_id.firstName,
						lastName: request.member_id.lastName,
						email: request.member_id.email,
					};
				}
				
				return mapSubscriptionRequestToGraphQL(request, undefined, memberData);
			});
		},

		getSubscriptionRequest: async (_: any, { id }: { id: string }, context: Context) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			const request = await SubscriptionRequest.findById(id)
				.populate('member_id', 'firstName lastName email')
				.populate('membership_id')
				.populate('approvedBy', 'firstName lastName')
				.populate('rejectedBy', 'firstName lastName')
				.lean();

			if (!request) {
				throw new Error('Subscription request not found');
			}

			// Authorization: Only the member or admin can view the request
			if (request.member_id.toString() !== userId && userRole !== 'admin') {
				throw new Error('Unauthorized: You cannot view this request');
			}

			// Format member data if populated
			let memberData: any = null;
			if (request.member_id && typeof request.member_id === 'object' && request.member_id._id) {
				memberData = {
					id: request.member_id._id.toString(),
					firstName: request.member_id.firstName,
					lastName: request.member_id.lastName,
					email: request.member_id.email,
				};
			}

			return mapSubscriptionRequestToGraphQL(request, undefined, memberData);
		},

		getMySubscriptionRequests: async (_: any, __: any, context: Context) => {
			const userId = context.auth.user?.id;
			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			const requests = await SubscriptionRequest.find({
				member_id: new mongoose.Types.ObjectId(userId),
			})
				.populate('membership_id')
				.populate('approvedBy', 'firstName lastName')
				.populate('rejectedBy', 'firstName lastName')
				.sort({ createdAt: -1 })
				.lean();

			return requests.map((request) => {
				// Format member data if populated
				let memberData: any = null;
				if (request.member_id && typeof request.member_id === 'object' && request.member_id._id) {
					memberData = {
						id: request.member_id._id.toString(),
						firstName: request.member_id.firstName,
						lastName: request.member_id.lastName,
						email: request.member_id.email,
					};
				}
				return mapSubscriptionRequestToGraphQL(request, undefined, memberData);
			});
		},
	},

	Mutation: {
		createSubscriptionRequest: async (
			_: any,
			{ input }: { input: { membershipId: string } },
			context: Context
		) => {
			// Authorization: Only members can create subscription requests
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (userRole !== 'member') {
				throw new Error('Unauthorized: Only members can create subscription requests');
			}

			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			// Check if membership exists and is active
			const membership = await Membership.findById(input.membershipId).lean();
			if (!membership) {
				throw new Error('Membership not found');
			}

			if (membership.status !== 'Active') {
				throw new Error('This membership plan is not available');
			}

			// Check if there's already a pending request for this membership
			const existingRequest = await SubscriptionRequest.findOne({
				member_id: new mongoose.Types.ObjectId(userId),
				membership_id: new mongoose.Types.ObjectId(input.membershipId),
				status: 'Pending',
				expiresAt: { $gt: new Date() },
			}).lean();

			if (existingRequest) {
				throw new Error('You already have a pending request for this membership plan');
			}

			// Create subscription request with 1 minute expiration
			const now = new Date();
			const expiresAt = new Date(now.getTime() + 60 * 1000); // 1 minute from now

			const request = new SubscriptionRequest({
				member_id: new mongoose.Types.ObjectId(userId),
				membership_id: new mongoose.Types.ObjectId(input.membershipId),
				status: 'Pending',
				requestedAt: now,
				expiresAt,
			});

			await request.save();

			const populatedRequest = await SubscriptionRequest.findById(request._id)
				.populate('member_id', 'firstName lastName email')
				.populate('membership_id')
				.lean();

			if (!populatedRequest) {
				throw new Error('Failed to create subscription request');
			}

			// Ensure membership is properly populated and mapped
			let membershipData: any = populatedRequest.membership_id;
			
			// If membership_id is a string (ObjectId) or not properly populated, fetch the membership
			if (typeof membershipData === 'string' || !membershipData || !membershipData._id) {
				const membershipId = typeof membershipData === 'string' 
					? membershipData 
					: (populatedRequest.membership_id?.toString() || populatedRequest.membership_id || input.membershipId);
				
				if (!membershipId) {
					throw new Error('Membership ID is missing');
				}
				
				membershipData = await Membership.findById(membershipId).lean();
				if (!membershipData) {
					throw new Error(`Membership not found with ID: ${membershipId}`);
				}
			}

			// Validate membership data has required fields
			if (!membershipData._id && !membershipData.id) {
				throw new Error('Invalid membership data: missing ID');
			}

			// Format member data if populated
			let memberData: any = null;
			if (populatedRequest.member_id && typeof populatedRequest.member_id === 'object' && populatedRequest.member_id._id) {
				memberData = {
					id: populatedRequest.member_id._id.toString(),
					firstName: populatedRequest.member_id.firstName,
					lastName: populatedRequest.member_id.lastName,
					email: populatedRequest.member_id.email,
				};
			}

			// Map the request with properly formatted membership and member
			const mappedRequest = mapSubscriptionRequestToGraphQL(populatedRequest, membershipData, memberData);
			
			// Double-check that membership has an id (this should never happen, but safety check)
			if (!mappedRequest.membership || !mappedRequest.membership.id) {
				console.error('⚠️ Membership mapping failed, re-mapping...', {
					membershipData,
					mappedMembership: mappedRequest.membership,
					membershipId: input.membershipId,
				});
				try {
					mappedRequest.membership = mapMembershipToGraphQL(membershipData);
				} catch (error) {
					console.error('❌ Failed to map membership:', error);
					throw new Error('Failed to map membership data');
				}
			}

			// Final validation
			if (!mappedRequest.membership || !mappedRequest.membership.id) {
				throw new Error('Membership ID is required but was not found');
			}

			// Ensure member has an id
			if (!mappedRequest.member || (typeof mappedRequest.member === 'object' && !mappedRequest.member.id)) {
				console.error('⚠️ Member mapping failed, re-mapping...', {
					memberData,
					mappedMember: mappedRequest.member,
					memberId: userId,
				});
				// Fetch member if needed
				const user = await User.findById(userId).select('firstName lastName email').lean();
				if (user) {
					mappedRequest.member = {
						id: user._id.toString(),
						firstName: user.firstName,
						lastName: user.lastName,
						email: user.email,
					};
				} else {
					throw new Error('Member not found');
				}
			}

			return mappedRequest;
		},

		approveSubscriptionRequest: async (
			_: any,
			{ input }: { input: { requestId: string } },
			context: Context
		) => {
			// Authorization: Only admin can approve requests
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (userRole !== 'admin') {
				throw new Error('Unauthorized: Only admins can approve subscription requests');
			}

			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			const request = await SubscriptionRequest.findById(input.requestId).lean();

			if (!request) {
				throw new Error('Subscription request not found');
			}

			if (request.status !== 'Pending') {
				throw new Error(`Cannot approve request with status: ${request.status}`);
			}

			// Check if request has expired
			if (new Date(request.expiresAt) < new Date()) {
				await SubscriptionRequest.findByIdAndUpdate(input.requestId, {
					status: 'Expired',
				});
				throw new Error('This subscription request has expired');
			}

			// Create membership transaction
			const transaction = await createMembershipTransaction(
				request.member_id.toString(),
				request.membership_id.toString(),
				userId
			);

			// Update request status
			await SubscriptionRequest.findByIdAndUpdate(input.requestId, {
				status: 'Approved',
				approvedAt: new Date(),
				approvedBy: new mongoose.Types.ObjectId(userId),
			});

			// Ensure transaction has properly formatted membership
			if (!transaction.membership || !transaction.membership.id) {
				// Re-fetch membership if needed
				const membership = await Membership.findById(request.membership_id).lean();
				if (membership) {
					transaction.membership = mapMembershipToGraphQL(membership);
				}
			}

			return transaction;
		},

		rejectSubscriptionRequest: async (
			_: any,
			{ input }: { input: { requestId: string } },
			context: Context
		) => {
			// Authorization: Only admin can reject requests
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (userRole !== 'admin') {
				throw new Error('Unauthorized: Only admins can reject subscription requests');
			}

			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			const request = await SubscriptionRequest.findById(input.requestId).lean();

			if (!request) {
				throw new Error('Subscription request not found');
			}

			if (request.status !== 'Pending') {
				throw new Error(`Cannot reject request with status: ${request.status}`);
			}

			await SubscriptionRequest.findByIdAndUpdate(input.requestId, {
				status: 'Rejected',
				rejectedAt: new Date(),
				rejectedBy: new mongoose.Types.ObjectId(userId),
			});

			return true;
		},

		directSubscribeMember: async (
			_: any,
			{ input }: { input: { memberId: string; membershipId: string } },
			context: Context
		) => {
			// Authorization: Only admin can directly subscribe members
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (userRole !== 'admin') {
				throw new Error('Unauthorized: Only admins can directly subscribe members');
			}

			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			// Verify member exists
			const member = await User.findById(input.memberId).lean();
			if (!member) {
				throw new Error('Member not found');
			}

			if (member.role !== 'member') {
				throw new Error('User is not a member');
			}

			// Create membership transaction
			const transaction = await createMembershipTransaction(
				input.memberId,
				input.membershipId,
				userId
			);

			return transaction;
		},
	},

	SubscriptionRequest: {
		member: async (parent: any) => {
			// Handle string ID
			if (typeof parent.member === 'string') {
				const user = await User.findById(parent.member)
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
			// Handle populated member object (from mongoose populate)
			if (parent.member && typeof parent.member === 'object') {
				// Check if it's already a GraphQL-formatted object (has id field)
				if (parent.member.id) {
					return parent.member;
				}
				// If it's a mongoose document/object, map it
				if (parent.member._id) {
					return {
						id: parent.member._id.toString(),
						firstName: parent.member.firstName,
						lastName: parent.member.lastName,
						email: parent.member.email,
					};
				}
			}
			// Fallback: try to fetch by memberId if available
			if (parent.memberId) {
				const user = await User.findById(parent.memberId)
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
			return null;
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
		approvedBy: async (parent: any) => {
			if (!parent.approvedBy) return null;
			if (typeof parent.approvedBy === 'string') {
				const user = await User.findById(parent.approvedBy)
					.select('firstName lastName')
					.lean();
				return user
					? {
							id: user._id.toString(),
							firstName: user.firstName,
							lastName: user.lastName,
					  }
					: null;
			}
			return parent.approvedBy;
		},
		rejectedBy: async (parent: any) => {
			if (!parent.rejectedBy) return null;
			if (typeof parent.rejectedBy === 'string') {
				const user = await User.findById(parent.rejectedBy)
					.select('firstName lastName')
					.lean();
				return user
					? {
							id: user._id.toString(),
							firstName: user.firstName,
							lastName: user.lastName,
					  }
					: null;
			}
			return parent.rejectedBy;
		},
	},
};

