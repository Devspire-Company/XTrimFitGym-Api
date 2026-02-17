// @ts-nocheck
import mongoose from 'mongoose';
import CoachRating from '../../database/models/coach/coachRating-schema';
import SessionLog from '../../database/models/session/sessionLog-schema';
import User from '../../database/models/user/user-schema';
import { Context } from '../../types';

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
			context: Context
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
			context: Context
		) => {
			const userId = context.auth.user?.id;

			if (!userId) {
				throw new Error('Unauthorized: Please log in');
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
	},

	Mutation: {
		createCoachRating: async (
			_: any,
			{ input }: { input: any },
			context: Context
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
				comment: input.comment,
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
			context: Context
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
				updateData.comment = comment;
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
			context: Context
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

