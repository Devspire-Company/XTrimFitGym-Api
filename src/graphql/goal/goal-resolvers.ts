import Goal from '../../database/models/goal/goal-schema.js';
import SessionLog from '../../database/models/session/sessionLog-schema.js';
import User from '../../database/models/user/user-schema.js';
import MembershipTransaction from '../../database/models/membership/membershipTransaction-schema.js';
import mongoose from 'mongoose';

interface Context {
	userId?: string;
	userRole?: string;
}

const mapGoalToGraphQL = (goal: any) => {
	return {
		id: goal._id.toString(),
		clientId: goal.client_id.toString(),
		client: goal.client_id,
		goalType: goal.goalType.toUpperCase().replace(/\s+/g, '_'),
		title: goal.title,
		description: goal.description || null,
		targetWeight: goal.targetWeight || null,
		currentWeight: goal.currentWeight || null,
		targetDate: goal.targetDate?.toISOString() || null,
		status: goal.status || 'active',
		createdAt: goal.createdAt?.toISOString(),
		updatedAt: goal.updatedAt?.toISOString(),
	};
};

const normalizeGoalType = (goalType: string): string => {
	return goalType.replace(/_/g, ' ').replace(/\b\w/g, (l) => {
		const first = l.toUpperCase();
		const rest = goalType
			.replace(/_/g, ' ')
			.substring(1)
			.toLowerCase();
		return first + rest;
	});
};

export default {
	Query: {
		getGoals: async (
			_: any,
			{ clientId, status }: { clientId: string; status?: string },
			context: Context
		) => {
			// Authorization: Only client or admin can view goals
			if (context.userId !== clientId && context.userRole !== 'admin') {
				throw new Error('Unauthorized: You can only view your own goals');
			}

			const query: any = {
				client_id: new mongoose.Types.ObjectId(clientId),
			};
			if (status) {
				query.status = status;
			}

			const goals = await Goal.find(query)
				.populate('client_id', 'firstName lastName email')
				.sort({ createdAt: -1 })
				.lean();

			return goals.map(mapGoalToGraphQL);
		},

		getGoal: async (_: any, { id }: { id: string }, context: Context) => {
			if (!context.userId) {
				throw new Error('Unauthorized: Please log in');
			}

			const goal = await Goal.findById(id)
				.populate('client_id', 'firstName lastName email')
				.lean();

			if (!goal) {
				throw new Error('Goal not found');
			}

			// Authorization: Only client or admin can view goal
			if (
				goal.client_id.toString() !== context.userId &&
				context.userRole !== 'admin'
			) {
				throw new Error('Unauthorized: You cannot view this goal');
			}

			return mapGoalToGraphQL(goal);
		},

		getWeightProgressChart: async (
			_: any,
			{ clientId, goalId }: { clientId: string; goalId?: string },
			context: Context
		) => {
			// Authorization: Only client or admin can view weight progress
			if (context.userId !== clientId && context.userRole !== 'admin') {
				throw new Error('Unauthorized: You can only view your own progress');
			}

			const query: any = {
				client_id: new mongoose.Types.ObjectId(clientId),
				clientConfirmed: true,
				coachConfirmed: true,
			};

			const sessionLogs = await SessionLog.find(query)
				.populate('session_id', 'date name')
				.sort({ completedAt: 1 })
				.lean();

			return sessionLogs.map((log: any) => ({
				date: log.completedAt?.toISOString() || log.createdAt?.toISOString(),
				weight: log.weight,
				sessionId: log.session_id?._id?.toString() || null,
				sessionLogId: log._id.toString(),
			}));
		},
	},

	Mutation: {
		createGoal: async (
			_: any,
			{ input }: { input: any },
			context: Context
		) => {
			// Authorization: Only members/clients can create goals
			if (context.userRole !== 'member' && context.userRole !== 'admin') {
				throw new Error('Unauthorized: Only members can create goals');
			}

			if (!context.userId) {
				throw new Error('Unauthorized: Please log in');
			}

			// Check if user has active membership
			if (context.userRole !== 'admin') {
				const activeMembership = await MembershipTransaction.findOne({
					client_id: new mongoose.Types.ObjectId(context.userId),
					status: 'Active',
					expiresAt: { $gt: new Date() },
				}).lean();

				if (!activeMembership) {
					throw new Error(
						'Active membership required: You must have an active membership to create goals'
					);
				}
			}

			const goal = new Goal({
				client_id: new mongoose.Types.ObjectId(context.userId),
				goalType: normalizeGoalType(input.goalType),
				title: input.title,
				description: input.description || null,
				targetWeight: input.targetWeight || null,
				currentWeight: input.currentWeight || null,
				targetDate: input.targetDate ? new Date(input.targetDate) : null,
				status: 'active',
			});

			await goal.save();

			const populatedGoal = await Goal.findById(goal._id)
				.populate('client_id', 'firstName lastName email')
				.lean();

			return mapGoalToGraphQL(populatedGoal);
		},

		updateGoal: async (
			_: any,
			{ id, input }: { id: string; input: any },
			context: Context
		) => {
			if (!context.userId) {
				throw new Error('Unauthorized: Please log in');
			}

			const goal = await Goal.findById(id).lean();
			if (!goal) {
				throw new Error('Goal not found');
			}

			// Authorization: Only client or admin can update goal
			if (
				goal.client_id.toString() !== context.userId &&
				context.userRole !== 'admin'
			) {
				throw new Error('Unauthorized: You cannot update this goal');
			}

			const updateData: any = {};
			if (input.goalType !== undefined)
				updateData.goalType = normalizeGoalType(input.goalType);
			if (input.title !== undefined) updateData.title = input.title;
			if (input.description !== undefined)
				updateData.description = input.description;
			if (input.targetWeight !== undefined)
				updateData.targetWeight = input.targetWeight;
			if (input.currentWeight !== undefined)
				updateData.currentWeight = input.currentWeight;
			if (input.targetDate !== undefined)
				updateData.targetDate = input.targetDate ? new Date(input.targetDate) : null;
			if (input.status !== undefined) updateData.status = input.status;

			const updatedGoal = await Goal.findByIdAndUpdate(id, updateData, {
				new: true,
			})
				.populate('client_id', 'firstName lastName email')
				.lean();

			return mapGoalToGraphQL(updatedGoal);
		},

		deleteGoal: async (_: any, { id }: { id: string }, context: Context) => {
			if (!context.userId) {
				throw new Error('Unauthorized: Please log in');
			}

			const goal = await Goal.findById(id).lean();
			if (!goal) {
				throw new Error('Goal not found');
			}

			// Authorization: Only client or admin can delete goal
			if (
				goal.client_id.toString() !== context.userId &&
				context.userRole !== 'admin'
			) {
				throw new Error('Unauthorized: You cannot delete this goal');
			}

			await Goal.findByIdAndDelete(id);
			return true;
		},
	},

	Goal: {
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
	},
};

