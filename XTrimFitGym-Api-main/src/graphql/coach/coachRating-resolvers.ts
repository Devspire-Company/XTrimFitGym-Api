// @ts-nocheck
import mongoose from 'mongoose';
import CoachRating from '../../database/models/coach/coachRating-schema.js';
import Goal from '../../database/models/goal/goal-schema.js';
import SessionLog from '../../database/models/session/sessionLog-schema.js';
import User from '../../database/models/user/user-schema.js';
import type { IAuthContext } from '../../context/auth-context.js';

/** Members must leave substantive written feedback with each coach rating. */
const MIN_COACH_RATING_COMMENT_LEN = 25;

function normalizeCoachRatingComment(raw: unknown): string {
	const s = typeof raw === 'string' ? raw.trim() : '';
	if (s.length < MIN_COACH_RATING_COMMENT_LEN) {
		throw new Error(
			`Please add a written comment of at least ${MIN_COACH_RATING_COMMENT_LEN} characters about your session.`,
		);
	}
	return s;
}

// Map CoachRating to GraphQL type
const mapCoachRatingToGraphQL = (rating: any): any => {
	if (!rating) return null;

	return {
		id: rating._id?.toString() || rating.id,
		coachId: rating.coach_id?.toString() || rating.coachId,
		coach: rating.coach_id || rating.coach,
		clientId: rating.client_id?.toString() || rating.clientId,
		client: rating.client_id || rating.client,
		sessionLogId: rating.sessionLog_id?.toString() || rating.sessionLogId,
		sessionLog: rating.sessionLog_id || rating.sessionLog,
		rating: rating.rating,
		comment: rating.comment,
		createdAt: rating.createdAt?.toISOString() || rating.createdAt,
		updatedAt: rating.updatedAt?.toISOString() || rating.updatedAt,
	};
};

// Helper function to update coach's average rating
const updateCoachAverageRating = async (coachId: string) => {
	try {
		const ratings = await CoachRating.find({
			coach_id: new mongoose.Types.ObjectId(coachId),
		}).lean();

		if (ratings.length === 0) {
			await User.findByIdAndUpdate(coachId, { ratings: 0 });
			return;
		}

		const totalRating = ratings.reduce((sum, r) => sum + (r.rating || 0), 0);
		const averageRating = totalRating / ratings.length;

		// Round to 1 decimal place
		const roundedAverage = Math.round(averageRating * 10) / 10;

		await User.findByIdAndUpdate(coachId, { ratings: roundedAverage });
	} catch (error) {
		console.error('Error updating coach average rating:', error);
	}
};

export default {
	CoachRating: {
		coach: async (parent: any) => {
			if (parent.coach) return parent.coach;
			if (parent.coach_id) {
				const coach = await User.findById(parent.coach_id).lean();
				return coach;
			}
			return null;
		},
		client: async (parent: any) => {
			if (parent.client) return parent.client;
			if (parent.client_id) {
				const client = await User.findById(parent.client_id).lean();
				return client;
			}
			return null;
		},
		sessionLog: async (parent: any) => {
			if (parent.sessionLog) return parent.sessionLog;
			if (parent.sessionLog_id) {
				const sessionLog = await SessionLog.findById(parent.sessionLog_id)
					.populate('session_id')
					.populate('client_id')
					.lean();
				return sessionLog;
			}
			return null;
		},
	},

	Query: {
		getCoachRatings: async (
			_: any,
			{ coachId }: { coachId: string },
			context: IAuthContext
		) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;

			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			const ratings = await CoachRating.find({
				coach_id: new mongoose.Types.ObjectId(coachId),
			})
				.populate('coach_id', 'firstName lastName email')
				.populate('client_id', 'firstName lastName email')
				.populate('sessionLog_id')
				.sort({ createdAt: -1 })
				.lean();

			return ratings.map(mapCoachRatingToGraphQL);
		},

		getCoachRatingBySessionLog: async (
			_: any,
			{ sessionLogId }: { sessionLogId: string },
			context: IAuthContext
		) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;

			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			const log = await SessionLog.findById(sessionLogId).select('client_id coach_id').lean();
			if (!log) {
				return null;
			}
			const isClient = log.client_id?.toString() === userId;
			const isCoach = log.coach_id?.toString() === userId;
			const isAdmin = userRole === 'admin';
			if (!isClient && !isCoach && !isAdmin) {
				throw new Error('You do not have access to this session rating.');
			}

			const rating = await CoachRating.findOne({
				sessionLog_id: new mongoose.Types.ObjectId(sessionLogId),
			})
				.populate('coach_id', 'firstName lastName email')
				.populate('client_id', 'firstName lastName email')
				.populate('sessionLog_id')
				.lean();

			return rating ? mapCoachRatingToGraphQL(rating) : null;
		},

		getMyCoachRatingsForGoal: async (
			_: any,
			{ goalId }: { goalId: string },
			context: IAuthContext
		) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;

			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			const goal = await Goal.findById(goalId).select('client_id').lean();
			if (!goal) {
				throw new Error('Goal not found');
			}
			if (goal.client_id?.toString() !== userId && userRole !== 'admin') {
				throw new Error('You do not have access to this goal.');
			}

			const ratings = await CoachRating.find({
				client_id: new mongoose.Types.ObjectId(userId),
			})
				.populate('coach_id', 'firstName lastName email')
				.populate({
					path: 'sessionLog_id',
					populate: {
						path: 'session_id',
						select: 'name date startTime goalId',
						populate: {
							path: 'goalId',
							select: 'title goalType currentWeight targetWeight',
						},
					},
				})
				.sort({ createdAt: -1 })
				.lean();

			const filtered = ratings.filter((r: any) => {
				const sid =
					r.sessionLog_id?.session_id?.goalId?._id?.toString?.() ||
					r.sessionLog_id?.session_id?.goalId?.toString?.();
				return sid === goalId;
			});

			return filtered.map(mapCoachRatingToGraphQL);
		},
	},

	Mutation: {
		createCoachRating: async (
			_: any,
			{ input }: { input: any },
			context: IAuthContext
		) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;

			// Authorization: Only clients (members) can rate coaches
			if (userRole !== 'member' && userRole !== 'admin') {
				throw new Error('Unauthorized: Only clients can rate coaches');
			}

			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			// Validate rating
			if (input.rating < 1 || input.rating > 5) {
				throw new Error('Rating must be between 1 and 5');
			}

			const commentText = normalizeCoachRatingComment(input.comment);

			// Verify session log exists and belongs to the client
			const sessionLog = await SessionLog.findById(
				new mongoose.Types.ObjectId(input.sessionLogId)
			).lean();

			if (!sessionLog) {
				throw new Error('Session log not found');
			}

			// Verify the session log belongs to the current user
			if (sessionLog.client_id?.toString() !== userId) {
				throw new Error('Unauthorized: This session log does not belong to you');
			}

			// Get coach ID from session log
			const sessionLogCoachId = sessionLog.coach_id?.toString();

			if (!sessionLogCoachId) {
				throw new Error('Coach ID not found in session log');
			}

			// Verify the coach ID matches the input
			if (sessionLogCoachId !== input.coachId) {
				throw new Error('Coach ID does not match the session log');
			}

			// Check if a rating already exists for this session log
			const existingRating = await CoachRating.findOne({
				sessionLog_id: new mongoose.Types.ObjectId(input.sessionLogId),
			}).lean();

			if (existingRating) {
				throw new Error('A rating already exists for this session');
			}

			const rating = new CoachRating({
				coach_id: new mongoose.Types.ObjectId(input.coachId),
				client_id: new mongoose.Types.ObjectId(userId),
				sessionLog_id: new mongoose.Types.ObjectId(input.sessionLogId),
				rating: input.rating,
				comment: commentText,
			});

			await rating.save();

			// Update coach's average rating
			await updateCoachAverageRating(input.coachId);

			const populatedRating = await CoachRating.findById(rating._id)
				.populate('coach_id', 'firstName lastName email')
				.populate('client_id', 'firstName lastName email')
				.populate('sessionLog_id')
				.lean();

			return mapCoachRatingToGraphQL(populatedRating);
		},

		updateCoachRating: async (
			_: any,
			{ id, rating, comment }: { id: string; rating?: number; comment?: string },
			context: IAuthContext
		) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;

			// Authorization: Only clients (members) can update their own ratings
			if (userRole !== 'member' && userRole !== 'admin') {
				throw new Error('Unauthorized: Only clients can update ratings');
			}

			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			const existingRating = await CoachRating.findById(
				new mongoose.Types.ObjectId(id)
			).lean();

			if (!existingRating) {
				throw new Error('Rating not found');
			}

			// Verify the rating belongs to the current user
			if (existingRating.client_id?.toString() !== userId) {
				throw new Error('Unauthorized: You can only update your own ratings');
			}

			const updateData: any = {};
			if (rating !== undefined) {
				if (rating < 1 || rating > 5) {
					throw new Error('Rating must be between 1 and 5');
				}
				updateData.rating = rating;
			}
			if (comment !== undefined) {
				updateData.comment = normalizeCoachRatingComment(comment);
			}

			const updatedRating = await CoachRating.findByIdAndUpdate(
				new mongoose.Types.ObjectId(id),
				updateData,
				{ new: true }
			)
				.populate('coach_id', 'firstName lastName email')
				.populate('client_id', 'firstName lastName email')
				.populate('sessionLog_id')
				.lean();

			// Update coach's average rating
			if (rating !== undefined) {
				await updateCoachAverageRating(
					existingRating.coach_id?.toString() || ''
				);
			}

			return mapCoachRatingToGraphQL(updatedRating);
		},

		deleteCoachRating: async (
			_: any,
			{ id }: { id: string },
			context: IAuthContext
		) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;

			// Authorization: Only clients (members) can delete their own ratings
			if (userRole !== 'member' && userRole !== 'admin') {
				throw new Error('Unauthorized: Only clients can delete ratings');
			}

			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			const rating = await CoachRating.findById(
				new mongoose.Types.ObjectId(id)
			).lean();

			if (!rating) {
				throw new Error('Rating not found');
			}

			// Verify the rating belongs to the current user
			if (rating.client_id?.toString() !== userId) {
				throw new Error('Unauthorized: You can only delete your own ratings');
			}

			const coachId = rating.coach_id?.toString() || '';

			await CoachRating.findByIdAndDelete(new mongoose.Types.ObjectId(id));

			// Update coach's average rating
			await updateCoachAverageRating(coachId);

			return true;
		},
	},
};

