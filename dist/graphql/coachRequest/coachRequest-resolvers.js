import CoachRequest from '../../database/models/coachRequest/coachRequest-schema.js';
import User from '../../database/models/user/user-schema.js';
import mongoose from 'mongoose';
// Helper to map User document to GraphQL format (simplified for coach request context)
const mapUserToGraphQLForRequest = (user) => {
    if (!user)
        return null;
    // Handle both populated documents (from .lean()) and plain objects
    // When using .lean(), _id is present, when populated normally, it might be _id or id
    const userId = user._id ? user._id.toString() : (user.id || null);
    if (!userId)
        return null;
    return {
        id: userId,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
    };
};
const mapCoachRequestToGraphQL = (request) => {
    return {
        id: request._id.toString(),
        clientId: request.client_id.toString(),
        client: request.client_id, // Will be resolved by CoachRequest.client resolver
        coachId: request.coach_id.toString(),
        coach: request.coach_id, // Will be resolved by CoachRequest.coach resolver
        status: request.status,
        message: request.message || null,
        createdAt: request.createdAt?.toISOString(),
        updatedAt: request.updatedAt?.toISOString(),
    };
};
const coachRequestResolvers = {
    Query: {
        getCoachRequests: async (_, { coachId, status }, context) => {
            const userId = context.auth.user?.id;
            if (!userId) {
                throw new Error('Unauthorized: Please log in');
            }
            const query = { coach_id: new mongoose.Types.ObjectId(coachId) };
            if (status) {
                query.status = status;
            }
            const requests = await CoachRequest.find(query)
                .populate('client_id')
                .populate('coach_id')
                .lean();
            return requests.map(mapCoachRequestToGraphQL);
        },
        getClientRequests: async (_, { clientId, status }, context) => {
            const userId = context.auth.user?.id;
            const userRole = context.auth.user?.role;
            if (!userId) {
                throw new Error('Unauthorized: Please log in');
            }
            // Only allow clients to see their own requests
            if (userId !== clientId && userRole !== 'admin') {
                throw new Error('Unauthorized: You can only view your own requests');
            }
            const query = { client_id: new mongoose.Types.ObjectId(clientId) };
            if (status) {
                query.status = status;
            }
            const requests = await CoachRequest.find(query)
                .populate('client_id')
                .populate('coach_id')
                .lean();
            return requests.map(mapCoachRequestToGraphQL);
        },
        getPendingCoachRequests: async (_, __, context) => {
            const userId = context.auth.user?.id;
            const userRole = context.auth.user?.role;
            if (!userId) {
                throw new Error('Unauthorized: Please log in');
            }
            if (userRole !== 'coach') {
                throw new Error('Only coaches can view pending requests');
            }
            const requests = await CoachRequest.find({
                coach_id: new mongoose.Types.ObjectId(userId),
                status: 'pending',
            })
                .populate('client_id')
                .populate('coach_id')
                .lean();
            return requests.map(mapCoachRequestToGraphQL);
        },
    },
    Mutation: {
        createCoachRequest: async (_, { input }, context) => {
            const userId = context.auth.user?.id;
            const userRole = context.auth.user?.role;
            if (!userId) {
                throw new Error('Unauthorized: Please log in');
            }
            if (userRole !== 'member') {
                throw new Error('Only members can request coaches');
            }
            // Check if client has membership (has membership_id in membershipDetails)
            const client = await User.findById(userId).lean();
            if (!client) {
                throw new Error('Client not found');
            }
            if (!client.membershipDetails?.membership_id) {
                throw new Error('You must have an active gym membership to request a coach');
            }
            // Check if coach exists
            const coach = await User.findById(input.coachId).lean();
            if (!coach || coach.role !== 'coach') {
                throw new Error('Coach not found');
            }
            // Check if client already has this coach
            if (client.membershipDetails?.coaches_ids?.some((id) => id.toString() === input.coachId)) {
                throw new Error('You already have this coach');
            }
            // Check if there's already a pending request
            const existingRequest = await CoachRequest.findOne({
                client_id: new mongoose.Types.ObjectId(userId),
                coach_id: new mongoose.Types.ObjectId(input.coachId),
                status: 'pending',
            }).lean();
            if (existingRequest) {
                throw new Error('You already have a pending request for this coach');
            }
            // Check if coach is at client limit
            if (coach.coachDetails?.clientLimit) {
                const currentClients = coach.coachDetails.clients_ids?.length || 0;
                if (currentClients >= coach.coachDetails.clientLimit) {
                    throw new Error('This coach is at full capacity');
                }
            }
            const request = new CoachRequest({
                client_id: new mongoose.Types.ObjectId(userId),
                coach_id: new mongoose.Types.ObjectId(input.coachId),
                status: 'pending',
                message: input.message || null,
            });
            await request.save();
            const populatedRequest = await CoachRequest.findById(request._id)
                .populate('client_id')
                .populate('coach_id')
                .lean();
            return mapCoachRequestToGraphQL(populatedRequest);
        },
        updateCoachRequest: async (_, { id, input }, context) => {
            const userId = context.auth.user?.id;
            const userRole = context.auth.user?.role;
            if (!userId) {
                throw new Error('Unauthorized: Please log in');
            }
            if (userRole !== 'coach') {
                throw new Error('Only coaches can approve or deny requests');
            }
            const request = await CoachRequest.findById(id).lean();
            if (!request) {
                throw new Error('Request not found');
            }
            if (request.coach_id.toString() !== userId) {
                throw new Error('Unauthorized to update this request');
            }
            if (request.status !== 'pending') {
                throw new Error('Request has already been processed');
            }
            // Update request status
            const updatedRequest = await CoachRequest.findByIdAndUpdate(id, { status: input.status }, { new: true })
                .populate('client_id')
                .populate('coach_id')
                .lean();
            // If approved, update coach and client relationships
            if (input.status === 'approved') {
                const clientId = new mongoose.Types.ObjectId(request.client_id.toString());
                const coachId = new mongoose.Types.ObjectId(request.coach_id.toString());
                // Add client to coach's clients list
                await User.findByIdAndUpdate(coachId, {
                    $addToSet: { 'coachDetails.clients_ids': clientId },
                });
                // Add coach to client's coaches list
                await User.findByIdAndUpdate(clientId, {
                    $addToSet: { 'membershipDetails.coaches_ids': coachId },
                });
            }
            return mapCoachRequestToGraphQL(updatedRequest);
        },
        cancelCoachRequest: async (_, { id }, context) => {
            const userId = context.auth.user?.id;
            const userRole = context.auth.user?.role;
            if (!userId) {
                throw new Error('Unauthorized: Please log in');
            }
            const request = await CoachRequest.findById(id).lean();
            if (!request) {
                throw new Error('Request not found');
            }
            if (request.client_id.toString() !== userId && userRole !== 'admin') {
                throw new Error('Unauthorized to cancel this request');
            }
            if (request.status !== 'pending') {
                throw new Error('Cannot cancel a processed request');
            }
            await CoachRequest.findByIdAndDelete(id);
            return true;
        },
    },
    CoachRequest: {
        client: async (parent) => {
            // If client is already populated (from populate in mapCoachRequestToGraphQL)
            // parent.client will be the populated client_id from the request
            if (parent.client && typeof parent.client === 'object') {
                // Map the populated user to GraphQL format
                return mapUserToGraphQLForRequest(parent.client);
            }
            // Fallback: fetch the user if not populated
            if (parent.clientId) {
                const user = await User.findById(parent.clientId).lean();
                return mapUserToGraphQLForRequest(user);
            }
            return null;
        },
        coach: async (parent) => {
            // If coach is already populated (from populate in mapCoachRequestToGraphQL)
            // parent.coach will be the populated coach_id from the request
            if (parent.coach && typeof parent.coach === 'object') {
                // Map the populated user to GraphQL format
                return mapUserToGraphQLForRequest(parent.coach);
            }
            // Fallback: fetch the user if not populated
            if (parent.coachId) {
                const user = await User.findById(parent.coachId).lean();
                return mapUserToGraphQLForRequest(user);
            }
            return null;
        },
    },
};
export default coachRequestResolvers;
