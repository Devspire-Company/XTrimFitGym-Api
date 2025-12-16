import ProgressRating from '../../database/models/progress/progressRating-schema.js';
import SessionLog from '../../database/models/session/sessionLog-schema.js';
import Session from '../../database/models/session/session-schema.js';
import mongoose from 'mongoose';
const mapProgressRatingToGraphQL = (rating) => {
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
        sessionLogIds: (rating.sessionLogIds || []).map((id) => id instanceof mongoose.Types.ObjectId ? id.toString() : String(id)),
        sessionLogs: rating.sessionLogIds || [],
        createdAt: rating.createdAt?.toISOString(),
        updatedAt: rating.updatedAt?.toISOString(),
    };
};
export default {
    Query: {
        getProgressRatings: async (_, { clientId, goalId }, context) => {
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
                .populate('sessionLogIds')
                .sort({ createdAt: -1 })
                .lean();
            return ratings.map(mapProgressRatingToGraphQL);
        },
        getClientProgressRatings: async (_, { clientId }, context) => {
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
                .populate('sessionLogIds')
                .sort({ createdAt: -1 })
                .lean();
            return ratings.map(mapProgressRatingToGraphQL);
        },
        getCoachProgressRatings: async (_, { coachId }, context) => {
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
                .populate('sessionLogIds')
                .sort({ createdAt: -1 })
                .lean();
            return ratings.map(mapProgressRatingToGraphQL);
        },
        getSessionLogsForRating: async (_, { clientId, goalId, startDate, endDate, }, context) => {
            const userId = context.auth.user?.id;
            const userRole = context.auth.user?.role;
            // Authorization: Coach can view session logs for their clients
            if (userRole !== 'coach' && userRole !== 'admin') {
                throw new Error('Unauthorized: Only coaches can view session logs for rating');
            }
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Include the entire end date
            // Get all sessions for this goal
            const sessions = await Session.find({
                goalId: new mongoose.Types.ObjectId(goalId),
                clients_ids: new mongoose.Types.ObjectId(clientId),
            });
            const sessionIds = sessions.map((s) => s._id);
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
            return sessionLogs.map((log) => {
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
                    }
                    else {
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
                    }
                    else {
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
        createProgressRating: async (_, { input }, context) => {
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
            if (input.rating < 1 || input.rating > 10) {
                throw new Error('Rating must be between 1 and 10');
            }
            // Check if a progress rating already exists for the same client, goal, and overlapping date range
            const existingRatings = await ProgressRating.find({
                coach_id: new mongoose.Types.ObjectId(userId),
                client_id: new mongoose.Types.ObjectId(input.clientId),
                goal_id: new mongoose.Types.ObjectId(input.goalId),
            }).lean();
            // Check for overlapping date ranges
            const hasOverlappingDateRange = existingRatings.some((existing) => {
                const existingStart = new Date(existing.startDate);
                const existingEnd = new Date(existing.endDate);
                // Two date ranges overlap if: newStart <= existingEnd AND newEnd >= existingStart
                return startDate <= existingEnd && endDate >= existingStart;
            });
            if (hasOverlappingDateRange) {
                throw new Error('A progress rating already exists for this client and goal with an overlapping date range. Please use a different date range or update the existing rating.');
            }
            // Validate session logs exist and belong to the client and goal
            if (input.sessionLogIds && input.sessionLogIds.length > 0) {
                const sessionLogs = await SessionLog.find({
                    _id: { $in: input.sessionLogIds.map((id) => new mongoose.Types.ObjectId(id)) },
                    client_id: new mongoose.Types.ObjectId(input.clientId),
                }).populate('session_id');
                if (sessionLogs.length !== input.sessionLogIds.length) {
                    throw new Error('Some session logs not found or do not belong to this client');
                }
                // Verify all session logs are for the specified goal
                for (const log of sessionLogs) {
                    const session = log.session_id;
                    if (session.goalId?.toString() !== input.goalId) {
                        throw new Error('All session logs must be for the specified goal');
                    }
                }
            }
            const rating = new ProgressRating({
                coach_id: new mongoose.Types.ObjectId(userId),
                client_id: new mongoose.Types.ObjectId(input.clientId),
                goal_id: new mongoose.Types.ObjectId(input.goalId),
                startDate: startDate,
                endDate: endDate,
                rating: input.rating,
                comment: input.comment,
                verdict: input.verdict,
                sessionLogIds: (input.sessionLogIds && input.sessionLogIds.length > 0)
                    ? input.sessionLogIds.map((id) => new mongoose.Types.ObjectId(id))
                    : [],
            });
            await rating.save();
            const populatedRating = await ProgressRating.findById(rating._id)
                .populate('coach_id', 'firstName lastName email')
                .populate('client_id', 'firstName lastName email')
                .populate('goal_id', 'title goalType')
                .populate('sessionLogIds')
                .lean();
            return mapProgressRatingToGraphQL(populatedRating);
        },
        updateProgressRating: async (_, { id, input }, context) => {
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
            const updateData = {};
            if (input.rating !== undefined) {
                if (input.rating < 1 || input.rating > 10) {
                    throw new Error('Rating must be between 1 and 10');
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
                updateData.sessionLogIds = input.sessionLogIds.map((id) => new mongoose.Types.ObjectId(id));
            }
            const updatedRating = await ProgressRating.findByIdAndUpdate(id, updateData, {
                new: true,
            })
                .populate('coach_id', 'firstName lastName email')
                .populate('client_id', 'firstName lastName email')
                .populate('goal_id', 'title goalType')
                .populate('sessionLogIds')
                .lean();
            return mapProgressRatingToGraphQL(updatedRating);
        },
        deleteProgressRating: async (_, { id }, context) => {
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
