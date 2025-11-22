import Goal from '../../database/models/goal/goal-schema.js';
import SessionLog from '../../database/models/session/sessionLog-schema.js';
import User from '../../database/models/user/user-schema.js';
import { IAuthContext } from '../../context/auth-context.js';
import mongoose from 'mongoose';

type Context = IAuthContext;

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

// Map GraphQL enum values (MUSCLE_BUILDING) to Mongoose schema enum values ('Muscle building')
const normalizeGoalType = (goalType: string): string => {
	const mapping: Record<string, string> = {
		WEIGHT_LOSS: 'Weight loss',
		MUSCLE_BUILDING: 'Muscle building',
		GENERAL_FITNESS: 'General fitness',
		STRENGTH_TRAINING: 'Strength training',
		ENDURANCE: 'Endurance',
		FLEXIBILITY: 'Flexibility',
		ATHLETIC_PERFORMANCE: 'Athletic performance',
		REHABILITATION: 'Rehabilitation',
	};

	// If it's already in the correct format, return it
	if (mapping[goalType]) {
		return mapping[goalType];
	}

	// Fallback: try to convert from snake_case to Title Case
	// MUSCLE_BUILDING -> Muscle building
	const words = goalType.toLowerCase().split('_');
	const titleCase = words
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');

	return titleCase;
};

export default {
	Query: {
		getGoals: async (
			_: any,
			{ clientId, status }: { clientId: string; status?: string },
			context: Context
		) => {
			// Authorization: Only client or admin can view goals
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (userId !== clientId && userRole !== 'admin') {
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
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			const goal = await Goal.findById(id)
				.populate('client_id', 'firstName lastName email')
				.lean();

			if (!goal) {
				throw new Error('Goal not found');
			}

			// Authorization: Only client or admin can view goal
			if (goal.client_id.toString() !== userId && userRole !== 'admin') {
				throw new Error('Unauthorized: You cannot view this goal');
			}

			return mapGoalToGraphQL(goal);
		},

		getWeightProgressChart: async (
			_: any,
			{ clientId, goalId }: { clientId: string; goalId?: string },
			context: Context
		) => {
			// Authorization: Client, their coach, or admin can view weight progress
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (userId !== clientId && userRole !== 'admin') {
				// Check if the requester is a coach and the client is their client
				if (userRole === 'coach') {
					const coach = await User.findById(userId).lean();
					const isClientOfCoach = coach?.coachDetails?.clients_ids?.some(
						(id: mongoose.Types.ObjectId) => id.toString() === clientId
					);
					if (!isClientOfCoach) {
						throw new Error(
							'Unauthorized: You can only view progress of your clients'
						);
					}
				} else {
					throw new Error('Unauthorized: You can only view your own progress');
				}
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
		createGoal: async (_: any, { input }: { input: any }, context: Context) => {
			// Authorization: Only members/clients can create goals
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;

			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			// Check if user has membership (has membership_id in membershipDetails)
			// if (userRole !== 'admin') {
			// 	const user = await User.findById(userId).lean();
			// 	if (!user?.membershipDetails?.membership_id) {
			// 		throw new Error(
			// 			'Active membership required: You must have an active membership to create goals'
			// 		);
			// 	}
			// }

			const goal = new Goal({
				client_id: new mongoose.Types.ObjectId(userId),
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
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			const goal = await Goal.findById(id).lean();
			if (!goal) {
				throw new Error('Goal not found');
			}

			// Authorization: Only client or admin can update goal
			if (goal.client_id.toString() !== userId && userRole !== 'admin') {
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
				updateData.targetDate = input.targetDate
					? new Date(input.targetDate)
					: null;
			if (input.status !== undefined) updateData.status = input.status;

			const updatedGoal = await Goal.findByIdAndUpdate(id, updateData, {
				new: true,
			})
				.populate('client_id', 'firstName lastName email')
				.lean();

			return mapGoalToGraphQL(updatedGoal);
		},

		deleteGoal: async (_: any, { id }: { id: string }, context: Context) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			const goal = await Goal.findById(id).lean();
			if (!goal) {
				throw new Error('Goal not found');
			}

			// Authorization: Only client or admin can delete goal
			if (goal.client_id.toString() !== userId && userRole !== 'admin') {
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
