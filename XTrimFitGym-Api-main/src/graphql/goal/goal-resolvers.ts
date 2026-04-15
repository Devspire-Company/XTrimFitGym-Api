import Goal from '../../database/models/goal/goal-schema.js';
import User from '../../database/models/user/user-schema.js';
import { IAuthContext } from '../../context/auth-context.js';
import { getFitnessGoalTypes } from '../../config/fitness-goal-types.js';
import mongoose from 'mongoose';

type Context = IAuthContext;

const mapGoalToGraphQL = (goal: any) => {
	// Handle client_id - it might be an ObjectId or a populated object
	let clientId: string;
	if (goal.client_id) {
		if (goal.client_id._id) {
			// Populated object - use _id
			clientId = goal.client_id._id.toString();
		} else if (goal.client_id instanceof mongoose.Types.ObjectId) {
			// ObjectId instance
			clientId = goal.client_id.toString();
		} else {
			// Already a string or other format
			clientId = String(goal.client_id);
		}
	} else {
		clientId = '';
	}

	// Handle coach_id - it might be an ObjectId or a populated object
	let coachId: string | null = null;
	if (goal.coach_id) {
		if (goal.coach_id._id) {
			// Populated object - use _id
			coachId = goal.coach_id._id.toString();
		} else if (goal.coach_id instanceof mongoose.Types.ObjectId) {
			// ObjectId instance
			coachId = goal.coach_id.toString();
		} else {
			// Already a string or other format
			coachId = String(goal.coach_id);
		}
	}

	return {
		id: goal._id.toString(),
		clientId: clientId,
		client: goal.client_id,
		coachId: coachId,
		coach: goal.coach_id || null,
		goalType: goal.goalType,
		title: goal.title,
		description: goal.description || null,
		targetWeight: goal.targetWeight || null,
		currentWeight: goal.currentWeight || null,
		targetDate: goal.targetDate?.toISOString() || null,
		status: goal.status || 'active',
		createdAt: goal.createdAt?.toISOString() || null,
		updatedAt: goal.updatedAt?.toISOString() || null,
	};
};

export default {
	Query: {
		getGoals: async (
			_: any,
			{ clientId, status }: { clientId: string; status?: string },
			context: Context
		) => {
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
				.populate('coach_id', 'firstName lastName email')
				.sort({ createdAt: -1 })
				.lean();

			return goals.map(mapGoalToGraphQL);
		},

		getGoal: async (_: any, { id }: { id: string }, context: Context) => {
			const goal = await Goal.findById(id)
				.populate('client_id', 'firstName lastName email')
				.populate('coach_id', 'firstName lastName email')
				.lean();

			if (!goal) {
				return null;
			}

			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			const isClient = goal.client_id._id.toString() === userId;
			const isCoach = goal.coach_id && goal.coach_id._id.toString() === userId;
			const isAdmin = userRole === 'admin';

			if (!isClient && !isCoach && !isAdmin) {
				throw new Error('Unauthorized: You do not have access to this goal');
			}

			return mapGoalToGraphQL(goal);
		},

		getAllClientGoals: async (
			_: any,
			{ coachId, status }: { coachId: string; status?: string },
			context: Context
		) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;

			// Ensure coachId is a string
			const coachIdString = String(coachId);
			const userIdString = userId ? String(userId) : null;

			if (userIdString !== coachIdString && userRole !== 'admin') {
				throw new Error(
					'Unauthorized: You can only view goals for your assigned clients'
				);
			}

			// Find coach by ID - ensure it's a valid string
			const coach = await User.findById(coachIdString).lean();
			if (!coach || coach.role !== 'coach') {
				throw new Error('Coach not found or user is not a coach');
			}

			const clientIds = coach.coachDetails?.clients_ids || [];
			if (clientIds.length === 0) {
				return [];
			}

			// Convert all client IDs to ObjectId, handling both string and ObjectId types
			const query: any = {
				client_id: {
					$in: clientIds.map((id: any) => {
						// If id is already an ObjectId, use it; otherwise convert from string
						if (id instanceof mongoose.Types.ObjectId) {
							return id;
						}
						return new mongoose.Types.ObjectId(String(id));
					}),
				},
			};
			if (status) {
				query.status = status;
			}

			const goals = await Goal.find(query)
				.populate('client_id', 'firstName lastName email')
				.populate('coach_id', 'firstName lastName email')
				.sort({ createdAt: -1 })
				.lean();

			return goals.map(mapGoalToGraphQL);
		},

		getWeightProgressChart: async (
			_: any,
			{ clientId, goalId }: { clientId: string; goalId?: string },
			context: Context
		) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (userId !== clientId && userRole !== 'admin') {
				throw new Error('Unauthorized: You can only view your own progress');
			}
			return [];
		},

		getFitnessGoalTypes: async () => {
			// Return predefined fitness goal types for frontend dropdowns
			// In the future, this can be extended to fetch from database
			return getFitnessGoalTypes();
		},
	},

	Mutation: {
		createGoal: async (
			_: any,
			{ input }: { input: any },
			context: Context
		) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;

			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			if (userRole !== 'member' && userRole !== 'admin') {
				throw new Error('Unauthorized: Only members can create goals');
			}

			// Ensure userId is a string before using in findById
			const userIdString = String(userId);
			const user = await User.findById(userIdString).lean();
			if (!user) {
				throw new Error('User not found');
			}

			if (user.role !== 'member' && userRole !== 'admin') {
				throw new Error('Unauthorized: Only members can create goals');
			}

			// goalType is now a String - use it directly
			// No enum mapping needed anymore
			const goal = new Goal({
				client_id: new mongoose.Types.ObjectId(userId),
				goalType: input.goalType.trim(),
				title: input.title.trim(),
				description: input.description?.trim() || undefined,
				targetWeight: input.targetWeight || undefined,
				currentWeight: input.currentWeight || undefined,
				targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
				status: 'active',
			});

			await goal.save();

			const populatedGoal = await Goal.findById(goal._id)
				.populate('client_id', 'firstName lastName email')
				.populate('coach_id', 'firstName lastName email')
				.lean();

			if (!populatedGoal) {
				throw new Error('Failed to create goal: Goal was not saved properly');
			}

			return mapGoalToGraphQL(populatedGoal);
		},

		updateGoal: async (
			_: any,
			{ id, input }: { id: string; input: any },
			context: Context
		) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;

			const goal = await Goal.findById(id).lean();
			if (!goal) {
				throw new Error('Goal not found');
			}

			const isClient = goal.client_id.toString() === userId;
			const isCoach =
				goal.coach_id && goal.coach_id.toString() === userId;
			const isAdmin = userRole === 'admin';

			if (!isClient && !isCoach && !isAdmin) {
				throw new Error('Unauthorized: You do not have permission to update this goal');
			}

			let updateData: any = {};
			if (input.goalType !== undefined) {
				// goalType is now a String - use it directly
				updateData.goalType = input.goalType.trim();
			}

			if (input.title !== undefined) {
				updateData.title = input.title.trim();
			}
			if (input.description !== undefined) {
				updateData.description = input.description?.trim() || undefined;
			}
			if (input.targetWeight !== undefined) {
				updateData.targetWeight = input.targetWeight || undefined;
			}
			if (input.currentWeight !== undefined) {
				updateData.currentWeight = input.currentWeight || undefined;
			}
			if (input.targetDate !== undefined) {
				updateData.targetDate = input.targetDate
					? new Date(input.targetDate)
					: undefined;
			}
			if (input.status !== undefined) {
				updateData.status = input.status;
			}

			const updatedGoal = await Goal.findByIdAndUpdate(id, updateData, {
				new: true,
			})
				.populate('client_id', 'firstName lastName email')
				.populate('coach_id', 'firstName lastName email')
				.lean();

			if (!updatedGoal) {
				throw new Error('Failed to update goal');
			}

			return mapGoalToGraphQL(updatedGoal);
		},

		deleteGoal: async (
			_: any,
			{ id }: { id: string },
			context: Context
		) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;

			const goal = await Goal.findById(id).lean();
			if (!goal) {
				throw new Error('Goal not found');
			}

			const isClient = goal.client_id.toString() === userId;
			const isAdmin = userRole === 'admin';

			if (!isClient && !isAdmin) {
				throw new Error('Unauthorized: You do not have permission to delete this goal');
			}

			await Goal.findByIdAndDelete(id);
			return true;
		},

		assignCoachToGoal: async (
			_: any,
			{ goalId }: { goalId: string },
			context: Context
		) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;

			if (userRole !== 'coach' && userRole !== 'admin') {
				throw new Error(
					'Unauthorized: Only coaches or admins can assign coaches to goals'
				);
			}

			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			// Ensure all IDs are strings (not objects)
			const goalIdString = String(goalId);
			const coachIdString = String(userId);

			// Find goal without populating first to get raw ObjectIds
			const goal = await Goal.findById(goalIdString).lean();
			if (!goal) {
				throw new Error('Goal not found');
			}

			// Ensure goal.client_id is converted to string for comparison
			// Handle both ObjectId and string formats
			const goalClientId = goal.client_id;
			const goalClientIdString = goalClientId
				? goalClientId instanceof mongoose.Types.ObjectId
					? goalClientId.toString()
					: String(goalClientId)
				: null;

			if (!goalClientIdString) {
				throw new Error('Goal client ID is invalid');
			}

			// Find coach by ID - ensure coachId is a valid string
			const coach = await User.findById(coachIdString).lean();
			if (!coach || coach.role !== 'coach') {
				throw new Error('Invalid coach ID provided');
			}

			// Check if the client of the goal is actually a client of this coach
			// Normalize all IDs to strings for comparison
			const coachClientIds = (coach.coachDetails?.clients_ids || []).map(
				(id: any) => {
					if (id instanceof mongoose.Types.ObjectId) {
						return id.toString();
					}
					return String(id);
				}
			);

			const isClientOfCoach = coachClientIds.includes(goalClientIdString);

			if (!isClientOfCoach && userRole !== 'admin') {
				throw new Error(
					'Unauthorized: You can only assign yourself to goals of your clients'
				);
			}

			// Update goal with coach assignment
			// Use the string version of goalId to ensure it's valid
			const updatedGoal = await Goal.findByIdAndUpdate(
				goalIdString,
				{ coach_id: new mongoose.Types.ObjectId(coachIdString) },
				{ new: true }
			)
				.populate('client_id', 'firstName lastName email')
				.populate('coach_id', 'firstName lastName email')
				.lean();

			if (!updatedGoal) {
				throw new Error('Failed to assign coach to goal');
			}

			return mapGoalToGraphQL(updatedGoal);
		},
	},

	Goal: {
		client: async (parent: any) => {
			if (parent.clientId) {
				// Ensure clientId is a string before using in findById
				const clientIdString = String(parent.clientId);
				const user = await User.findById(clientIdString)
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

		coach: async (parent: any) => {
			if (parent.coachId) {
				// Ensure coachId is a string before using in findById
				const coachIdString = String(parent.coachId);
				const user = await User.findById(coachIdString)
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
			return parent.coach;
		},
	},
};

