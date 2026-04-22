import ProgressRating from '../../database/models/progress/progressRating-schema.js';
import SessionLog from '../../database/models/session/sessionLog-schema.js';
import Session from '../../database/models/session/session-schema.js';
import Goal from '../../database/models/goal/goal-schema.js';
import { IAuthContext } from '../../context/auth-context.js';
import mongoose from 'mongoose';

type Context = IAuthContext;

/** Normalize stored or populated session log refs to string IDs for GraphQL (populate() replaces ids with documents). */
function mapSessionLogRefsToIdStrings(raw: unknown): string[] {
	if (raw == null) return [];
	const arr = Array.isArray(raw) ? raw : [];
	return arr
		.map((id: any) => {
			if (id == null) return '';
			if (id instanceof mongoose.Types.ObjectId) return id.toString();
			if (typeof id === 'object' && id._id != null) {
				const inner = id._id;
				return inner instanceof mongoose.Types.ObjectId ? inner.toString() : String(inner);
			}
			if (typeof id === 'object' && id.id != null) return String(id.id);
			return String(id);
		})
		.filter(Boolean);
}

/** Ensures progress ratings are only created/updated when tied to real completed coach–client sessions. */
async function assertSessionLogsSupportProgressRating(params: {
	coachId: string;
	clientId: string;
	goalId: string;
	sessionLogIds: string[];
}) {
	const { coachId, clientId, goalId, sessionLogIds } = params;
	if (!Array.isArray(sessionLogIds) || sessionLogIds.length === 0) {
		throw new Error(
			'At least one completed session log is required. Rate progress only after you have completed a session with this member for this goal.'
		);
	}
	const coachOid = new mongoose.Types.ObjectId(coachId);
	const clientOid = new mongoose.Types.ObjectId(clientId);
	const sessionLogs = await SessionLog.find({
		_id: { $in: sessionLogIds.map((id: string) => new mongoose.Types.ObjectId(id)) },
		client_id: clientOid,
		coach_id: coachOid,
	}).populate('session_id');

	if (sessionLogs.length !== sessionLogIds.length) {
		throw new Error(
			'Some session logs were not found, do not belong to this client, or are not sessions you coached.'
		);
	}

	for (const log of sessionLogs) {
		if (!log.completedAt) {
			throw new Error(
				'Each linked session must be completed before it can be used for a progress rating.'
			);
		}
		const session = log.session_id as any;
		if (!session || session.goalId?.toString() !== goalId) {
			throw new Error('All session logs must be for sessions linked to this goal.');
		}
	}
}

const mapProgressRatingToGraphQL = (rating: any) => {
	return {
		id: rating._id.toString(),
		coachId: rating.coach_id.toString(),
		coach: rating.coach_id,
		clientId: rating.client_id.toString(),
		client: rating.client_id,
		goalId: rating.goal_id.toString(),
		goal: rating.goal_id,
		startDate: rating.startDate?.toISOString(),
		endDate: rating.endDate?.toISOString(),
		rating: rating.rating,
		comment: rating.comment,
		verdict: rating.verdict,
		sessionLogIds: mapSessionLogRefsToIdStrings(rating.sessionLogIds),
		sessionLogs: [],
		createdAt: rating.createdAt?.toISOString(),
		updatedAt: rating.updatedAt?.toISOString(),
	};
};

async function sessionLogsForProgressRatingParent(parent: { sessionLogIds?: string[] }) {
	const ids = parent.sessionLogIds;
	if (!ids?.length) return [];
	const logs = await SessionLog.find({
		_id: { $in: ids.map((id: string) => new mongoose.Types.ObjectId(id)) },
	})
		.populate({
			path: 'session_id',
			populate: [
				{ path: 'coach_id', select: 'firstName lastName email' },
				{ path: 'goalId', select: 'title goalType currentWeight targetWeight' },
			],
		})
		.populate('client_id', 'firstName lastName email')
		.populate('coach_id', 'firstName lastName email')
		.sort({ completedAt: 1 })
		.lean();

	return logs.map((log: any) => ({
		id: log._id.toString(),
		sessionId:
			log.session_id?._id?.toString() ||
			log.session_id?.toString?.() ||
			String(log.session_id || ''),
		session: log.session_id
			? {
					id: log.session_id._id?.toString() || '',
					name: log.session_id.name || '',
					date: log.session_id.date?.toISOString?.() || null,
					startTime: log.session_id.startTime || '',
					endTime: log.session_id.endTime ?? null,
					gymArea: log.session_id.gymArea || '',
					goalId:
						log.session_id.goalId?._id?.toString() ||
						log.session_id.goalId?.toString?.() ||
						null,
					goal: log.session_id.goalId || null,
				}
			: null,
		clientId:
			log.client_id?._id?.toString() || log.client_id?.id || String(log.client_id || ''),
		client: log.client_id?._id
			? {
					id: log.client_id._id.toString(),
					firstName: log.client_id.firstName || '',
					lastName: log.client_id.lastName || '',
					email: log.client_id.email || '',
				}
			: null,
		coachId:
			log.coach_id?._id?.toString() || log.coach_id?.id || String(log.coach_id || ''),
		coach: log.coach_id?._id
			? {
					id: log.coach_id._id.toString(),
					firstName: log.coach_id.firstName || '',
					lastName: log.coach_id.lastName || '',
					email: log.coach_id.email || '',
				}
			: null,
		weight: log.weight ?? null,
		progressImages: log.progressImages || null,
		clientConfirmed: !!log.clientConfirmed,
		coachConfirmed: !!log.coachConfirmed,
		notes: log.notes ?? null,
		completedAt: log.completedAt?.toISOString?.() || null,
		createdAt: log.createdAt?.toISOString?.() || null,
		updatedAt: log.updatedAt?.toISOString?.() || null,
	}));
}

export default {
	ProgressRating: {
		sessionLogs: async (parent: { sessionLogIds?: string[] }) =>
			sessionLogsForProgressRatingParent(parent),
	},
	Query: {
		getProgressRatings: async (
			_: any,
			{ clientId, goalId }: { clientId: string; goalId: string },
			context: Context
		) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;

			// Authorization: Coach can view ratings for their clients, client can view their own
			if (userRole !== 'coach' && userId !== clientId && userRole !== 'admin') {
				throw new Error('Unauthorized: You cannot view these progress ratings');
			}

			const ratings = await ProgressRating.find({
				client_id: new mongoose.Types.ObjectId(clientId),
				goal_id: new mongoose.Types.ObjectId(goalId),
			})
				.populate('coach_id', 'firstName lastName email')
				.populate('client_id', 'firstName lastName email')
				.populate('goal_id', 'title goalType')
				.sort({ createdAt: -1 })
				.lean();

			return ratings.map(mapProgressRatingToGraphQL);
		},

		getClientProgressRatings: async (
			_: any,
			{ clientId }: { clientId: string },
			context: Context
		) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;

			// Authorization: Client can view their own ratings, coach can view their clients
			if (userRole !== 'coach' && userId !== clientId && userRole !== 'admin') {
				throw new Error('Unauthorized: You cannot view these progress ratings');
			}

			const ratings = await ProgressRating.find({
				client_id: new mongoose.Types.ObjectId(clientId),
			})
				.populate('coach_id', 'firstName lastName email')
				.populate('client_id', 'firstName lastName email')
				.populate('goal_id', 'title goalType')
				.sort({ createdAt: -1 })
				.lean();

			return ratings.map(mapProgressRatingToGraphQL);
		},

		getCoachProgressRatings: async (
			_: any,
			{ coachId }: { coachId: string },
			context: Context
		) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;

			// Authorization: Coach can view their own ratings
			if (userId !== coachId && userRole !== 'admin') {
				throw new Error('Unauthorized: You can only view your own progress ratings');
			}

			const ratings = await ProgressRating.find({
				coach_id: new mongoose.Types.ObjectId(coachId),
			})
				.populate('coach_id', 'firstName lastName email')
				.populate('client_id', 'firstName lastName email')
				.populate('goal_id', 'title goalType')
				.sort({ createdAt: -1 })
				.lean();

			return ratings.map(mapProgressRatingToGraphQL);
		},

		getSessionLogsForRating: async (
			_: any,
			{
				clientId,
				goalId,
				startDate,
				endDate,
			}: {
				clientId: string;
				goalId: string;
				startDate: string;
				endDate: string;
			},
			context: Context
		) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;

			// Authorization: Coach can view session logs for their clients
			if (userRole !== 'coach' && userRole !== 'admin') {
				throw new Error('Unauthorized: Only coaches can view session logs for rating');
			}

			const start = new Date(startDate);
			const end = new Date(endDate);
			end.setHours(23, 59, 59, 999); // Include the entire end date

			// Sessions for this goal with this client, coached by the current user only
			const sessions = await Session.find({
				goalId: new mongoose.Types.ObjectId(goalId),
				clients_ids: new mongoose.Types.ObjectId(clientId),
				coach_id: new mongoose.Types.ObjectId(userId),
			});

			const sessionIds = sessions.map((s: any) => s._id);

			// Get session logs within date range for these sessions
			const sessionLogs = await SessionLog.find({
				client_id: new mongoose.Types.ObjectId(clientId),
				session_id: { $in: sessionIds },
				completedAt: {
					$gte: start,
					$lte: end,
				},
			})
				.populate({
					path: 'session_id',
					populate: [
						{ path: 'coach_id', select: 'firstName lastName email' },
						{ path: 'goalId', select: 'title goalType' },
					],
				})
				.populate('client_id', 'firstName lastName email')
				.sort({ completedAt: 1 })
				.lean();

			// Map to GraphQL format - simplified version for this query
			return sessionLogs.map((log: any) => {
				// Map session if populated
				let mappedSession = null;
				if (log.session_id) {
					if (log.session_id._id || log.session_id.name) {
						// Populated object
						mappedSession = {
							id: log.session_id._id?.toString() || log.session_id.id || log.session_id.toString(),
							name: log.session_id.name || '',
							date: log.session_id.date?.toISOString() || null,
							startTime: log.session_id.startTime || '',
							endTime: log.session_id.endTime || null,
							gymArea: log.session_id.gymArea || '',
							goalId: log.session_id.goalId?._id?.toString() || log.session_id.goalId?.toString() || null,
							goal: log.session_id.goalId || null,
						};
					} else {
						mappedSession = { id: log.session_id.toString() };
					}
				}

				// Map client if populated
				let mappedClient = null;
				if (log.client_id) {
					if (log.client_id._id || log.client_id.firstName) {
						mappedClient = {
							id: log.client_id._id?.toString() || log.client_id.id || String(log.client_id),
							firstName: log.client_id.firstName || '',
							lastName: log.client_id.lastName || '',
							email: log.client_id.email || '',
						};
					} else {
						mappedClient = { id: log.client_id.toString() };
					}
				}

				const sessionId = log.session_id?._id?.toString() || log.session_id?.id || log.session_id?.toString() || '';
				const clientId = log.client_id?._id?.toString() || log.client_id?.id || log.client_id?.toString() || '';

				return {
					id: log._id.toString(),
					sessionId: sessionId,
					session: mappedSession,
					clientId: clientId,
					client: mappedClient,
					weight: log.weight || null,
					progressImages: log.progressImages || null,
					completedAt: log.completedAt?.toISOString() || null,
				};
			});
		},
	},

	Mutation: {
		createProgressRating: async (
			_: any,
			{ input }: { input: any },
			context: Context
		) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;

			// Authorization: Only coaches can create progress ratings
			if (userRole !== 'coach' && userRole !== 'admin') {
				throw new Error('Unauthorized: Only coaches can create progress ratings');
			}

			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			// Validate date range
			const startDate = new Date(input.startDate);
			const endDate = new Date(input.endDate);

			if (startDate > endDate) {
				throw new Error('Start date must be before end date');
			}

			// Validate rating
			if (input.rating < 1 || input.rating > 5) {
				throw new Error('Rating must be between 1 and 5');
			}

			// Check if a progress rating already exists for the same client, goal, and overlapping date range
			const existingRatings = await ProgressRating.find({
				coach_id: new mongoose.Types.ObjectId(userId),
				client_id: new mongoose.Types.ObjectId(input.clientId),
				goal_id: new mongoose.Types.ObjectId(input.goalId),
			}).lean();

			// Check for overlapping date ranges
			const hasOverlappingDateRange = existingRatings.some((existing: any) => {
				const existingStart = new Date(existing.startDate);
				const existingEnd = new Date(existing.endDate);
				// Two date ranges overlap if: newStart <= existingEnd AND newEnd >= existingStart
				return startDate <= existingEnd && endDate >= existingStart;
			});

			if (hasOverlappingDateRange) {
				throw new Error(
					'A progress rating already exists for this client and goal with an overlapping date range. Please use a different date range or update the existing rating.'
				);
			}

			const goalDoc = await Goal.findById(input.goalId).lean();
			if (!goalDoc) {
				throw new Error('Goal not found');
			}
			if (goalDoc.client_id.toString() !== input.clientId) {
				throw new Error('Goal does not belong to this client');
			}
			if (
				userRole === 'coach' &&
				goalDoc.coach_id &&
				goalDoc.coach_id.toString() !== userId
			) {
				throw new Error(
					'Unauthorized: Only this goal’s assigned coach can rate progress for it.'
				);
			}

			await assertSessionLogsSupportProgressRating({
				coachId: userId,
				clientId: input.clientId,
				goalId: input.goalId,
				sessionLogIds: input.sessionLogIds || [],
			});

			const rating = new ProgressRating({
				coach_id: new mongoose.Types.ObjectId(userId),
				client_id: new mongoose.Types.ObjectId(input.clientId),
				goal_id: new mongoose.Types.ObjectId(input.goalId),
				startDate: startDate,
				endDate: endDate,
				rating: input.rating,
				comment: input.comment,
				verdict: input.verdict,
				sessionLogIds: input.sessionLogIds.map(
					(id: string) => new mongoose.Types.ObjectId(id)
				),
			});

			await rating.save();

			const populatedRating = await ProgressRating.findById(rating._id)
				.populate('coach_id', 'firstName lastName email')
				.populate('client_id', 'firstName lastName email')
				.populate('goal_id', 'title goalType')
				.lean();

			return mapProgressRatingToGraphQL(populatedRating);
		},

		updateProgressRating: async (
			_: any,
			{ id, input }: { id: string; input: any },
			context: Context
		) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;

			// Authorization: Only coaches can update progress ratings
			if (userRole !== 'coach' && userRole !== 'admin') {
				throw new Error('Unauthorized: Only coaches can update progress ratings');
			}

			const rating = await ProgressRating.findById(id).lean();
			if (!rating) {
				throw new Error('Progress rating not found');
			}

			// Check if coach owns this rating
			if (rating.coach_id.toString() !== userId && userRole !== 'admin') {
				throw new Error('Unauthorized: You can only update your own progress ratings');
			}

			const updateData: any = {};
			if (input.rating !== undefined) {
				if (input.rating < 1 || input.rating > 5) {
					throw new Error('Rating must be between 1 and 5');
				}
				updateData.rating = input.rating;
			}
			if (input.comment !== undefined) {
				updateData.comment = input.comment;
			}
			if (input.verdict !== undefined) {
				updateData.verdict = input.verdict;
			}
			if (input.sessionLogIds !== undefined) {
				await assertSessionLogsSupportProgressRating({
					coachId: rating.coach_id.toString(),
					clientId: rating.client_id.toString(),
					goalId: rating.goal_id.toString(),
					sessionLogIds: input.sessionLogIds,
				});
				updateData.sessionLogIds = input.sessionLogIds.map((id: string) =>
					new mongoose.Types.ObjectId(id)
				);
			}

			const updatedRating = await ProgressRating.findByIdAndUpdate(id, updateData, {
				new: true,
			})
				.populate('coach_id', 'firstName lastName email')
				.populate('client_id', 'firstName lastName email')
				.populate('goal_id', 'title goalType')
				.lean();

			return mapProgressRatingToGraphQL(updatedRating);
		},

		deleteProgressRating: async (_: any, { id }: { id: string }, context: Context) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;

			// Authorization: Only coaches can delete progress ratings
			if (userRole !== 'coach' && userRole !== 'admin') {
				throw new Error('Unauthorized: Only coaches can delete progress ratings');
			}

			const rating = await ProgressRating.findById(id).lean();
			if (!rating) {
				throw new Error('Progress rating not found');
			}

			// Check if coach owns this rating
			if (rating.coach_id.toString() !== userId && userRole !== 'admin') {
				throw new Error('Unauthorized: You can only delete your own progress ratings');
			}

			await ProgressRating.findByIdAndDelete(id);
			return true;
		},
	},
};

