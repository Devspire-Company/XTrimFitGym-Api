import Session from '../../database/models/session/session-schema.js';
import SessionLog from '../../database/models/session/sessionLog-schema.js';
import User from '../../database/models/user/user-schema.js';
import Goal from '../../database/models/goal/goal-schema.js';
import mongoose from 'mongoose';
const mapSessionToGraphQL = (session) => {
    // Handle coach_id - it might be an ObjectId or a populated object
    let coachId;
    if (session.coach_id) {
        if (session.coach_id._id) {
            // Populated object - use _id
            coachId = session.coach_id._id.toString();
        }
        else if (session.coach_id instanceof mongoose.Types.ObjectId) {
            // ObjectId instance
            coachId = session.coach_id.toString();
        }
        else {
            // Already a string or other format
            coachId = String(session.coach_id);
        }
    }
    else {
        coachId = '';
    }
    // Handle clients_ids - they might be ObjectIds or populated objects
    const clientsIds = (session.clients_ids || []).map((id) => {
        if (id._id) {
            // Populated object - use _id
            return id._id.toString();
        }
        else if (id instanceof mongoose.Types.ObjectId) {
            // ObjectId instance
            return id.toString();
        }
        else {
            // Already a string or other format
            return String(id);
        }
    });
    // Handle goalId - it might be an ObjectId or a populated object
    let goalId = null;
    let goal = null;
    if (session.goalId) {
        if (session.goalId._id || session.goalId.title || session.goalId.goalType) {
            // Populated object - map it properly
            goalId = session.goalId._id
                ? session.goalId._id.toString()
                : session.goalId.id || String(session.goalId);
            // Map the goal object with proper structure for GraphQL
            goal = {
                id: goalId,
                title: session.goalId.title || '',
                goalType: session.goalId.goalType || '',
            };
        }
        else if (session.goalId instanceof mongoose.Types.ObjectId) {
            // ObjectId instance - not populated
            goalId = session.goalId.toString();
            goal = null;
        }
        else {
            // Already a string or other format
            goalId = String(session.goalId);
            goal = null;
        }
    }
    // Handle templateId
    let templateId = null;
    if (session.templateId) {
        if (session.templateId instanceof mongoose.Types.ObjectId) {
            templateId = session.templateId.toString();
        }
        else {
            templateId = String(session.templateId);
        }
    }
    return {
        id: session._id.toString(),
        coachId: coachId,
        coach: session.coach_id,
        clientsIds: clientsIds,
        clients: session.clients_ids || [],
        name: session.name,
        workoutType: session.workoutType || null,
        date: session.date?.toISOString(),
        startTime: session.startTime || session.time || '',
        endTime: session.endTime || null,
        time: session.time ||
            `${session.startTime}${session.endTime ? ` - ${session.endTime}` : ''}`,
        gymArea: session.gymArea,
        note: session.note || null,
        status: session.status || 'scheduled',
        templateId: templateId,
        goalId: goalId,
        goal: goal, // Use the properly mapped goal object
        isTemplate: session.isTemplate || false,
        createdAt: session.createdAt?.toISOString(),
        updatedAt: session.updatedAt?.toISOString(),
    };
};
const mapSessionLogToGraphQL = (sessionLog) => {
    // Map session using mapSessionToGraphQL if it's populated
    let mappedSession = null;
    if (sessionLog.session_id) {
        if (sessionLog.session_id._id || sessionLog.session_id.name) {
            // It's a populated object, use mapSessionToGraphQL
            mappedSession = mapSessionToGraphQL(sessionLog.session_id);
        }
        else {
            // It's just an ObjectId, convert to string
            mappedSession = {
                id: sessionLog.session_id.toString(),
            };
        }
    }
    // Map client if populated
    let mappedClient = null;
    if (sessionLog.client_id) {
        if (sessionLog.client_id._id || sessionLog.client_id.firstName) {
            // It's a populated object
            mappedClient = {
                id: sessionLog.client_id._id
                    ? sessionLog.client_id._id.toString()
                    : sessionLog.client_id.id || String(sessionLog.client_id),
                firstName: sessionLog.client_id.firstName || '',
                lastName: sessionLog.client_id.lastName || '',
                email: sessionLog.client_id.email || '',
            };
        }
        else {
            // It's just an ObjectId
            mappedClient = {
                id: sessionLog.client_id.toString(),
            };
        }
    }
    // Map coach if populated
    let mappedCoach = null;
    if (sessionLog.coach_id) {
        if (sessionLog.coach_id._id || sessionLog.coach_id.firstName) {
            // It's a populated object
            mappedCoach = {
                id: sessionLog.coach_id._id
                    ? sessionLog.coach_id._id.toString()
                    : sessionLog.coach_id.id || String(sessionLog.coach_id),
                firstName: sessionLog.coach_id.firstName || '',
                lastName: sessionLog.coach_id.lastName || '',
                email: sessionLog.coach_id.email || '',
            };
        }
        else {
            // It's just an ObjectId
            mappedCoach = {
                id: sessionLog.coach_id.toString(),
            };
        }
    }
    // Get sessionId and IDs as strings
    const sessionId = sessionLog.session_id?._id?.toString() ||
        sessionLog.session_id?.id ||
        sessionLog.session_id?.toString() ||
        '';
    const clientId = sessionLog.client_id?._id?.toString() ||
        sessionLog.client_id?.id ||
        sessionLog.client_id?.toString() ||
        '';
    const coachId = sessionLog.coach_id?._id?.toString() ||
        sessionLog.coach_id?.id ||
        sessionLog.coach_id?.toString() ||
        '';
    return {
        id: sessionLog._id.toString(),
        sessionId: sessionId,
        session: mappedSession,
        clientId: clientId,
        client: mappedClient,
        coachId: coachId,
        coach: mappedCoach,
        weight: sessionLog.weight || null,
        progressImages: sessionLog.progressImages || null,
        clientConfirmed: sessionLog.clientConfirmed,
        coachConfirmed: sessionLog.coachConfirmed,
        notes: sessionLog.notes || null,
        completedAt: sessionLog.completedAt?.toISOString() || null,
        createdAt: sessionLog.createdAt?.toISOString() || null,
        updatedAt: sessionLog.updatedAt?.toISOString() || null,
    };
};
export default {
    Query: {
        getCoachSessions: async (_, { coachId, status }, context) => {
            // Authorization: Only coach can view their own sessions
            const userId = context.auth.user?.id;
            const userRole = context.auth.user?.role;
            if (userId !== coachId && userRole !== 'admin') {
                throw new Error('Unauthorized: You can only view your own sessions');
            }
            const query = { coach_id: new mongoose.Types.ObjectId(coachId) };
            if (status) {
                query.status = status;
            }
            // Get all sessions first
            const allSessions = await Session.find(query)
                .populate('coach_id', 'firstName lastName')
                .populate('clients_ids', 'firstName lastName email')
                .populate('goalId', 'title goalType')
                .sort({ date: 1, startTime: 1 })
                .lean();
            // Get all session logs for sessions created by this coach to filter out completed sessions
            const sessionLogs = await SessionLog.find({
                coach_id: new mongoose.Types.ObjectId(coachId),
            })
                .select('session_id')
                .lean();
            // Create a set of completed session IDs
            const completedSessionIds = new Set(sessionLogs.map((log) => {
                const sessionId = log.session_id;
                return sessionId instanceof mongoose.Types.ObjectId
                    ? sessionId.toString()
                    : sessionId._id
                        ? sessionId._id.toString()
                        : String(sessionId);
            }));
            // Filter out completed sessions
            const sessions = allSessions.filter((session) => {
                const sessionId = session._id.toString();
                return !completedSessionIds.has(sessionId);
            });
            return sessions.map(mapSessionToGraphQL);
        },
        getClientSessions: async (_, { clientId, status }, context) => {
            // Authorization: Only client can view their own sessions
            const userId = context.auth.user?.id;
            const userRole = context.auth.user?.role;
            if (userId !== clientId && userRole !== 'admin') {
                throw new Error('Unauthorized: You can only view your own sessions');
            }
            const query = {
                clients_ids: new mongoose.Types.ObjectId(clientId),
            };
            if (status) {
                query.status = status;
            }
            // Get all sessions first
            const allSessions = await Session.find(query)
                .populate('coach_id', 'firstName lastName')
                .populate('clients_ids', 'firstName lastName email')
                .populate('goalId', 'title goalType')
                .sort({ date: 1, startTime: 1 })
                .lean();
            // Get all session logs for this client to filter out completed sessions
            const sessionLogs = await SessionLog.find({
                client_id: new mongoose.Types.ObjectId(clientId),
            })
                .select('session_id')
                .lean();
            // Create a set of completed session IDs
            const completedSessionIds = new Set(sessionLogs.map((log) => {
                const sessionId = log.session_id;
                return sessionId instanceof mongoose.Types.ObjectId
                    ? sessionId.toString()
                    : sessionId._id
                        ? sessionId._id.toString()
                        : String(sessionId);
            }));
            // Filter out completed sessions
            const sessions = allSessions.filter((session) => {
                const sessionId = session._id.toString();
                return !completedSessionIds.has(sessionId);
            });
            return sessions.map(mapSessionToGraphQL);
        },
        getUpcomingSessions: async (_, __, context) => {
            const userId = context.auth.user?.id;
            const userRole = context.auth.user?.role;
            if (!userId) {
                throw new Error('Unauthorized: Please log in');
            }
            const now = new Date();
            const query = {
                date: { $gte: now },
                status: 'scheduled',
            };
            // Get sessions where user is either coach or client
            if (userRole === 'coach') {
                query.coach_id = new mongoose.Types.ObjectId(userId);
            }
            else {
                query.clients_ids = new mongoose.Types.ObjectId(userId);
            }
            const sessions = await Session.find(query)
                .populate('coach_id', 'firstName lastName')
                .populate('clients_ids', 'firstName lastName email')
                .sort({ date: 1, startTime: 1 })
                .limit(10)
                .lean();
            return sessions.map(mapSessionToGraphQL);
        },
        getSession: async (_, { id }, context) => {
            const userId = context.auth.user?.id;
            const userRole = context.auth.user?.role;
            if (!userId) {
                throw new Error('Unauthorized: Please log in');
            }
            const session = await Session.findById(id)
                .populate('coach_id', 'firstName lastName email')
                .populate('clients_ids', 'firstName lastName email')
                .populate('goalId', 'title goalType')
                .lean();
            if (!session) {
                throw new Error('Session not found');
            }
            // Authorization: Only coach, clients, or admin can view
            const isCoach = session.coach_id.toString() === userId;
            const isClient = session.clients_ids?.some((clientId) => clientId.toString() === userId);
            const isAdmin = userRole === 'admin';
            if (!isCoach && !isClient && !isAdmin) {
                throw new Error('Unauthorized: You cannot view this session');
            }
            return mapSessionToGraphQL(session);
        },
        getSessionTemplates: async (_, { coachId }, context) => {
            // Authorization: Only coach can view their own templates
            const userId = context.auth.user?.id;
            const userRole = context.auth.user?.role;
            // Ensure coachId is a string for comparison
            const coachIdString = String(coachId);
            const userIdString = userId ? String(userId) : null;
            if (userIdString !== coachIdString && userRole !== 'admin') {
                throw new Error('Unauthorized: You can only view your own session templates');
            }
            const sessions = await Session.find({
                coach_id: new mongoose.Types.ObjectId(coachIdString),
                isTemplate: true,
            })
                .populate('coach_id', 'firstName lastName')
                .populate('goalId', 'title goalType')
                .sort({ createdAt: -1 })
                .lean();
            return sessions.map(mapSessionToGraphQL);
        },
        getSessionLogs: async (_, { clientId }, context) => {
            // Authorization: Only client or admin can view session logs
            const userId = context.auth.user?.id;
            const userRole = context.auth.user?.role;
            if (userId !== clientId && userRole !== 'admin') {
                throw new Error('Unauthorized: You can only view your own session logs');
            }
            const sessionLogs = await SessionLog.find({
                client_id: new mongoose.Types.ObjectId(clientId),
            })
                .populate({
                path: 'session_id',
                populate: [
                    { path: 'coach_id', select: 'id firstName lastName email' },
                    { path: 'clients_ids', select: 'id firstName lastName email' },
                    {
                        path: 'goalId',
                        select: 'id title goalType description targetValue currentValue startDate targetDate client_id coach_id',
                        populate: [
                            { path: 'client_id', select: 'id firstName lastName email' },
                            { path: 'coach_id', select: 'id firstName lastName email' },
                        ],
                    },
                ],
            })
                .populate('coach_id', 'id firstName lastName email')
                .populate('client_id', 'id firstName lastName email')
                .sort({ completedAt: -1 })
                .lean();
            return sessionLogs.map(mapSessionLogToGraphQL);
        },
        getCoachSessionLogs: async (_, { coachId }, context) => {
            // Authorization: Only coach or admin can view their session logs
            const userId = context.auth.user?.id;
            const userRole = context.auth.user?.role;
            if (userId !== coachId && userRole !== 'admin') {
                throw new Error('Unauthorized: You can only view your own session logs');
            }
            const sessionLogs = await SessionLog.find({
                coach_id: new mongoose.Types.ObjectId(coachId),
            })
                .populate({
                path: 'session_id',
                populate: [
                    { path: 'coach_id', select: 'id firstName lastName email' },
                    { path: 'clients_ids', select: 'id firstName lastName email' },
                    {
                        path: 'goalId',
                        select: 'id title goalType description targetValue currentValue startDate targetDate client_id coach_id',
                        populate: [
                            { path: 'client_id', select: 'id firstName lastName email' },
                            { path: 'coach_id', select: 'id firstName lastName email' },
                        ],
                    },
                ],
            })
                .populate('coach_id', 'id firstName lastName email')
                .populate('client_id', 'id firstName lastName email')
                .sort({ completedAt: -1 })
                .lean();
            return sessionLogs.map(mapSessionLogToGraphQL);
        },
        getSessionLogBySessionId: async (_, { sessionId }, context) => {
            // Authorization: Only coach of the session, client, or admin can view
            const userId = context.auth.user?.id;
            const userRole = context.auth.user?.role;
            const session = await Session.findById(sessionId).lean();
            if (!session) {
                throw new Error('Session not found');
            }
            const sessionCoachId = session.coach_id
                ? session.coach_id instanceof mongoose.Types.ObjectId
                    ? session.coach_id.toString()
                    : String(session.coach_id)
                : null;
            const isCoach = sessionCoachId === userId;
            const isClient = session.clients_ids?.some((clientId) => clientId.toString() === userId);
            if (!isCoach && !isClient && userRole !== 'admin') {
                throw new Error('Unauthorized: You can only view session logs for your own sessions');
            }
            const sessionLog = await SessionLog.findOne({
                session_id: new mongoose.Types.ObjectId(sessionId),
            })
                .populate({
                path: 'session_id',
                populate: [
                    { path: 'coach_id', select: 'id firstName lastName email' },
                    { path: 'clients_ids', select: 'id firstName lastName email' },
                    {
                        path: 'goalId',
                        select: 'id title goalType description targetValue currentValue startDate targetDate client_id coach_id',
                        populate: [
                            { path: 'client_id', select: 'id firstName lastName email' },
                            { path: 'coach_id', select: 'id firstName lastName email' },
                        ],
                    },
                ],
            })
                .populate('coach_id', 'id firstName lastName email')
                .populate('client_id', 'id firstName lastName email')
                .lean();
            if (!sessionLog) {
                return null;
            }
            return mapSessionLogToGraphQL(sessionLog);
        },
        getWeightProgress: async (_, { clientId, goalId }, context) => {
            // Authorization: Only client or admin can view weight progress
            const userId = context.auth.user?.id;
            const userRole = context.auth.user?.role;
            if (userId !== clientId && userRole !== 'admin') {
                throw new Error('Unauthorized: You can only view your own progress');
            }
            const query = {
                client_id: new mongoose.Types.ObjectId(clientId),
                clientConfirmed: true,
                coachConfirmed: true,
            };
            if (goalId) {
                // Filter by goal if provided
                // Note: You might want to link goals to sessions in the future
            }
            const sessionLogs = await SessionLog.find(query)
                .populate({
                path: 'session_id',
                select: 'id date name',
                populate: [
                    { path: 'coach_id', select: 'id firstName lastName email' },
                    { path: 'clients_ids', select: 'id firstName lastName email' },
                    {
                        path: 'goalId',
                        select: 'id title goalType description targetValue currentValue startDate targetDate client_id coach_id',
                        populate: [
                            { path: 'client_id', select: 'id firstName lastName email' },
                            { path: 'coach_id', select: 'id firstName lastName email' },
                        ],
                    },
                ],
            })
                .populate('coach_id', 'id firstName lastName email')
                .populate('client_id', 'id firstName lastName email')
                .sort({ completedAt: 1 })
                .lean();
            return sessionLogs.map(mapSessionLogToGraphQL);
        },
    },
    Mutation: {
        createSession: async (_, { input }, context) => {
            // Authorization: Only coaches can create sessions
            const userId = context.auth.user?.id;
            const userRole = context.auth.user?.role;
            if (userRole !== 'coach' && userRole !== 'admin') {
                throw new Error('Unauthorized: Only coaches can create sessions');
            }
            if (!userId) {
                throw new Error('Unauthorized: Please log in');
            }
            // Ensure userId is a string
            const userIdString = String(userId);
            // If creating from template, get template details
            let templateSession = null;
            if (input.templateId) {
                templateSession = await Session.findById(input.templateId).lean();
                if (!templateSession) {
                    throw new Error('Template session not found');
                }
                const templateCoachIdString = String(templateSession.coach_id);
                if (templateCoachIdString !== userIdString && userRole !== 'admin') {
                    throw new Error('Unauthorized: You can only use your own templates');
                }
            }
            // For templates, allow empty clients_ids array
            // For regular sessions, ensure at least one client is provided
            if (!input.isTemplate &&
                (!input.clientsIds || input.clientsIds.length === 0)) {
                throw new Error('At least one client must be selected for a session');
            }
            const clientsIds = input.isTemplate
                ? []
                : input.clientsIds.map((id) => new mongoose.Types.ObjectId(id));
            const session = new Session({
                coach_id: new mongoose.Types.ObjectId(userIdString),
                clients_ids: clientsIds,
                name: templateSession ? templateSession.name : input.name,
                workoutType: templateSession
                    ? templateSession.workoutType
                    : input.workoutType || null,
                date: new Date(input.date),
                startTime: input.startTime,
                endTime: input.endTime || null,
                time: input.endTime
                    ? `${input.startTime} - ${input.endTime}`
                    : input.startTime,
                gymArea: templateSession ? templateSession.gymArea : input.gymArea,
                note: templateSession ? templateSession.note : input.note || null,
                templateId: input.templateId
                    ? new mongoose.Types.ObjectId(input.templateId)
                    : undefined,
                goalId: input.goalId
                    ? new mongoose.Types.ObjectId(input.goalId)
                    : undefined,
                isTemplate: input.isTemplate === true, // Explicitly check for true
                status: input.isTemplate ? 'scheduled' : 'scheduled',
            });
            await session.save();
            // Update coach's sessions_ids
            await User.findByIdAndUpdate(userIdString, {
                $push: {
                    'coachDetails.sessions_ids': session._id,
                },
            });
            // TODO: Send push notifications to clients
            // await sendPushNotificationsToClients(input.clientsIds, {
            //   title: 'New Session Scheduled',
            //   body: `Coach ${context.userName} has scheduled a session: ${input.name}`,
            // });
            const populatedSession = await Session.findById(session._id)
                .populate('coach_id', 'firstName lastName')
                .populate('clients_ids', 'firstName lastName email')
                .populate('goalId', 'title goalType')
                .lean();
            return mapSessionToGraphQL(populatedSession);
        },
        createSessionFromTemplate: async (_, { input }, context) => {
            // Authorization: Only coaches can create sessions from templates
            const userId = context.auth.user?.id;
            const userRole = context.auth.user?.role;
            if (userRole !== 'coach' && userRole !== 'admin') {
                throw new Error('Unauthorized: Only coaches can create sessions from templates');
            }
            if (!userId) {
                throw new Error('Unauthorized: Please log in');
            }
            // Ensure all IDs are strings
            const userIdString = String(userId);
            const templateIdString = String(input.templateId);
            const goalIdString = input.goalId ? String(input.goalId) : null;
            // Validate and convert client IDs
            if (!input.clientsIds || !Array.isArray(input.clientsIds) || input.clientsIds.length === 0) {
                throw new Error('At least one client must be selected');
            }
            const clientsIds = input.clientsIds.map((id) => {
                const idString = String(id);
                // Validate ObjectId format
                if (!mongoose.Types.ObjectId.isValid(idString)) {
                    throw new Error(`Invalid client ID: ${idString}`);
                }
                return new mongoose.Types.ObjectId(idString);
            });
            // Validate templateId
            if (!mongoose.Types.ObjectId.isValid(templateIdString)) {
                throw new Error(`Invalid template ID: ${templateIdString}`);
            }
            // Validate goalId if provided
            if (goalIdString && !mongoose.Types.ObjectId.isValid(goalIdString)) {
                throw new Error(`Invalid goal ID: ${goalIdString}`);
            }
            // Get template session
            const templateSession = await Session.findById(templateIdString).lean();
            if (!templateSession) {
                throw new Error('Template session not found');
            }
            const templateCoachId = templateSession.coach_id
                ? templateSession.coach_id instanceof mongoose.Types.ObjectId
                    ? templateSession.coach_id.toString()
                    : String(templateSession.coach_id)
                : null;
            if (templateCoachId !== userIdString && userRole !== 'admin') {
                throw new Error('Unauthorized: You can only use your own templates');
            }
            if (!templateSession.isTemplate) {
                throw new Error('Session is not a template');
            }
            // Verify goal exists if provided
            if (goalIdString) {
                const goal = await Goal.findById(goalIdString).lean();
                if (!goal) {
                    throw new Error('Goal not found');
                }
                // Verify the goal belongs to one of the selected clients
                const goalClientId = goal.client_id
                    ? goal.client_id instanceof mongoose.Types.ObjectId
                        ? goal.client_id.toString()
                        : String(goal.client_id)
                    : null;
                if (goalClientId) {
                    const isGoalForSelectedClient = clientsIds.some((clientObjId) => clientObjId.toString() === goalClientId);
                    if (!isGoalForSelectedClient && userRole !== 'admin') {
                        throw new Error('The selected goal must belong to one of the selected clients');
                    }
                }
            }
            // Create new session from template
            // Use workoutType from input if provided, otherwise use template's workoutType
            const workoutType = input.workoutType !== undefined && input.workoutType !== null
                ? input.workoutType
                : templateSession.workoutType || null;
            const session = new Session({
                coach_id: new mongoose.Types.ObjectId(userIdString),
                clients_ids: clientsIds,
                name: templateSession.name,
                workoutType: workoutType,
                date: new Date(input.date),
                startTime: input.startTime,
                endTime: input.endTime || null,
                time: input.endTime
                    ? `${input.startTime} - ${input.endTime}`
                    : input.startTime,
                gymArea: templateSession.gymArea,
                note: templateSession.note || null,
                templateId: new mongoose.Types.ObjectId(templateIdString),
                goalId: goalIdString
                    ? new mongoose.Types.ObjectId(goalIdString)
                    : undefined,
                isTemplate: false,
                status: 'scheduled',
            });
            await session.save();
            // Update coach's sessions_ids
            await User.findByIdAndUpdate(userIdString, {
                $push: {
                    'coachDetails.sessions_ids': session._id,
                },
            });
            // Populate session with all required fields
            // Use execPopulate or populate with proper error handling
            const populatedSession = await Session.findById(session._id)
                .populate({
                path: 'coach_id',
                select: 'firstName lastName email',
                model: 'User',
            })
                .populate({
                path: 'clients_ids',
                select: 'firstName lastName email',
                model: 'User',
            })
                .populate({
                path: 'goalId',
                select: 'title goalType',
                model: 'Goal',
            })
                .lean();
            if (!populatedSession) {
                throw new Error('Failed to create session: Session was not saved properly');
            }
            // Validate that populated fields have valid IDs
            if (!populatedSession.coach_id || !populatedSession.coach_id._id) {
                throw new Error('Failed to populate coach: Coach not found');
            }
            if (!populatedSession.clients_ids || populatedSession.clients_ids.length === 0) {
                throw new Error('Failed to populate clients: No valid clients found');
            }
            // Validate all clients have valid IDs
            const invalidClients = populatedSession.clients_ids.filter((client) => !client || !client._id);
            if (invalidClients.length > 0) {
                throw new Error(`Failed to populate clients: ${invalidClients.length} invalid client(s)`);
            }
            // If goalId was provided, validate it was populated correctly
            if (goalIdString && populatedSession.goalId) {
                if (!populatedSession.goalId._id) {
                    throw new Error('Failed to populate goal: Goal not found');
                }
            }
            return mapSessionToGraphQL(populatedSession);
        },
        updateSession: async (_, { id, input }, context) => {
            const userId = context.auth.user?.id;
            const userRole = context.auth.user?.role;
            if (!userId) {
                throw new Error('Unauthorized: Please log in');
            }
            const session = await Session.findById(id).lean();
            if (!session) {
                throw new Error('Session not found');
            }
            // Authorization: Only coach who created the session or admin can update
            const isCoach = session.coach_id.toString() === userId;
            const isAdmin = userRole === 'admin';
            if (!isCoach && !isAdmin) {
                throw new Error('Unauthorized: You cannot update this session');
            }
            const updateData = {};
            if (input.name !== undefined)
                updateData.name = input.name;
            if (input.workoutType !== undefined)
                updateData.workoutType = input.workoutType;
            if (input.date !== undefined)
                updateData.date = new Date(input.date);
            if (input.startTime !== undefined)
                updateData.startTime = input.startTime;
            if (input.endTime !== undefined)
                updateData.endTime = input.endTime;
            if (input.gymArea !== undefined)
                updateData.gymArea = input.gymArea;
            if (input.note !== undefined)
                updateData.note = input.note;
            if (input.status !== undefined)
                updateData.status = input.status;
            if (input.startTime || input.endTime) {
                updateData.time = input.endTime
                    ? `${input.startTime || session.startTime} - ${input.endTime}`
                    : input.startTime || session.startTime;
            }
            const updatedSession = await Session.findByIdAndUpdate(id, updateData, {
                new: true,
            })
                .populate('coach_id', 'firstName lastName')
                .populate('clients_ids', 'firstName lastName email')
                .lean();
            return mapSessionToGraphQL(updatedSession);
        },
        cancelSession: async (_, { id }, context) => {
            const userId = context.auth.user?.id;
            const userRole = context.auth.user?.role;
            if (!userId) {
                throw new Error('Unauthorized: Please log in');
            }
            const session = await Session.findById(id).lean();
            if (!session) {
                throw new Error('Session not found');
            }
            // Authorization: Only coach who created the session or admin can cancel
            const isCoach = session.coach_id.toString() === userId;
            const isAdmin = userRole === 'admin';
            if (!isCoach && !isAdmin) {
                throw new Error('Unauthorized: You cannot cancel this session');
            }
            await Session.findByIdAndUpdate(id, { status: 'cancelled' });
            // TODO: Send push notifications to clients about cancellation
            return true;
        },
        completeSession: async (_, { input }, context) => {
            // Authorization: Only members/clients can complete sessions
            const userId = context.auth.user?.id;
            const userRole = context.auth.user?.role;
            if (userRole !== 'member' && userRole !== 'admin') {
                throw new Error('Unauthorized: Only clients can complete sessions');
            }
            if (!userId) {
                throw new Error('Unauthorized: Please log in');
            }
            const userIdString = String(userId);
            // Validate progress images are provided
            if (!input.progressImages) {
                throw new Error('Progress images are required');
            }
            const { front, rightSide, leftSide, back } = input.progressImages;
            if (!front || !rightSide || !leftSide || !back) {
                throw new Error('All four progress images are required: front, rightSide, leftSide, and back');
            }
            const session = await Session.findById(input.sessionId)
                .populate('goalId')
                .lean();
            if (!session) {
                throw new Error('Session not found');
            }
            // Check if client is part of this session
            const isClient = session.clients_ids?.some((clientId) => clientId.toString() === userIdString);
            if (!isClient && userRole !== 'admin') {
                throw new Error('Unauthorized: You are not part of this session');
            }
            // Check if goal is weight-related
            // If goalId is not populated, fetch it
            let goal = session.goalId;
            if (!goal || (!goal.goalType && !goal._id)) {
                // Goal not populated, fetch it
                if (session.goalId) {
                    const goalId = session.goalId instanceof mongoose.Types.ObjectId
                        ? session.goalId
                        : new mongoose.Types.ObjectId(String(session.goalId));
                    goal = await Goal.findById(goalId).select('goalType title').lean();
                }
            }
            const isWeightRelated = goal &&
                goal.goalType &&
                (String(goal.goalType).trim() === 'Weight loss' ||
                    String(goal.goalType).trim() === 'Muscle building');
            // Validate weight if goal is weight-related - THIS IS REQUIRED
            if (isWeightRelated) {
                if (!input.weight || input.weight === null || input.weight === undefined) {
                    throw new Error(`Weight is required for weight-related goals. This session is associated with a "${goal.goalType}" goal, and weight tracking is mandatory.`);
                }
                const weightNum = parseFloat(String(input.weight));
                if (isNaN(weightNum) || weightNum <= 0) {
                    throw new Error('Please enter a valid weight (must be greater than 0)');
                }
            }
            // Check if session log already exists
            let sessionLog = await SessionLog.findOne({
                session_id: new mongoose.Types.ObjectId(input.sessionId),
                client_id: new mongoose.Types.ObjectId(userIdString),
            });
            if (sessionLog) {
                // Update existing log
                if (isWeightRelated && input.weight) {
                    sessionLog.weight = parseFloat(input.weight);
                }
                sessionLog.progressImages = {
                    front: front,
                    rightSide: rightSide,
                    leftSide: leftSide,
                    back: back,
                };
                sessionLog.clientConfirmed = true;
                sessionLog.coachConfirmed = true; // Auto-confirm since coach confirmation is no longer required
                if (input.notes !== undefined)
                    sessionLog.notes = input.notes;
                await sessionLog.save();
            }
            else {
                // Create new log
                const logData = {
                    session_id: new mongoose.Types.ObjectId(input.sessionId),
                    client_id: new mongoose.Types.ObjectId(userIdString),
                    coach_id: session.coach_id,
                    progressImages: {
                        front: front,
                        rightSide: rightSide,
                        leftSide: leftSide,
                        back: back,
                    },
                    clientConfirmed: true,
                    coachConfirmed: true, // Auto-confirm since coach confirmation is no longer required
                    notes: input.notes || null,
                };
                if (isWeightRelated && input.weight) {
                    logData.weight = parseFloat(input.weight);
                }
                sessionLog = new SessionLog(logData);
                await sessionLog.save();
            }
            const populatedLog = await SessionLog.findById(sessionLog._id)
                .populate({
                path: 'session_id',
                populate: [
                    { path: 'coach_id', select: 'id firstName lastName email' },
                    { path: 'clients_ids', select: 'id firstName lastName email' },
                    {
                        path: 'goalId',
                        select: 'id title goalType description targetValue currentValue startDate targetDate client_id coach_id',
                        populate: [
                            { path: 'client_id', select: 'id firstName lastName email' },
                            { path: 'coach_id', select: 'id firstName lastName email' },
                        ],
                    },
                ],
            })
                .populate('coach_id', 'id firstName lastName email')
                .populate('client_id', 'id firstName lastName email')
                .lean();
            return mapSessionLogToGraphQL(populatedLog);
        },
        confirmSessionCompletion: async (_, { input }, context) => {
            // Authorization: Only coaches can confirm session completion
            const userId = context.auth.user?.id;
            const userRole = context.auth.user?.role;
            if (userRole !== 'coach' && userRole !== 'admin') {
                throw new Error('Unauthorized: Only coaches can confirm session completion');
            }
            if (!userId) {
                throw new Error('Unauthorized: Please log in');
            }
            const sessionLog = await SessionLog.findById(input.sessionLogId).lean();
            if (!sessionLog) {
                throw new Error('Session log not found');
            }
            // Check if coach created the session
            const session = await Session.findById(sessionLog.session_id).lean();
            if (!session) {
                throw new Error('Session not found');
            }
            const isCoach = session.coach_id.toString() === userId;
            if (!isCoach && userRole !== 'admin') {
                throw new Error('Unauthorized: You cannot confirm completion for this session');
            }
            const updatedLog = await SessionLog.findByIdAndUpdate(input.sessionLogId, {
                coachConfirmed: input.confirm,
            }, { new: true })
                .populate('session_id')
                .populate('coach_id', 'firstName lastName')
                .populate('client_id', 'firstName lastName')
                .lean();
            // If both confirmed, mark session as completed
            if (updatedLog?.clientConfirmed &&
                updatedLog?.coachConfirmed &&
                session.status === 'scheduled') {
                await Session.findByIdAndUpdate(session._id, {
                    status: 'completed',
                });
            }
            return mapSessionLogToGraphQL(updatedLog);
        },
        clientConfirmWeight: async (_, { sessionLogId }, context) => {
            // Authorization: Only members/clients can confirm their weight
            const userId = context.auth.user?.id;
            const userRole = context.auth.user?.role;
            if (userRole !== 'member' && userRole !== 'admin') {
                throw new Error('Unauthorized: Only clients can confirm their weight');
            }
            if (!userId) {
                throw new Error('Unauthorized: Please log in');
            }
            const sessionLog = await SessionLog.findById(sessionLogId).lean();
            if (!sessionLog) {
                throw new Error('Session log not found');
            }
            // Check if this is the client's own session log
            if (sessionLog.client_id.toString() !== userId && userRole !== 'admin') {
                throw new Error('Unauthorized: This is not your session log');
            }
            const updatedLog = await SessionLog.findByIdAndUpdate(sessionLogId, {
                clientConfirmed: true,
            }, { new: true })
                .populate('session_id')
                .populate('coach_id', 'firstName lastName')
                .populate('client_id', 'firstName lastName')
                .lean();
            return mapSessionLogToGraphQL(updatedLog);
        },
    },
    Session: {
        coach: async (parent) => {
            // If coach is already populated (object), return it
            if (parent.coach && typeof parent.coach === 'object' && parent.coach._id) {
                const coachId = parent.coach._id.toString();
                if (!coachId) {
                    return null;
                }
                return {
                    id: coachId,
                    firstName: parent.coach.firstName || '',
                    lastName: parent.coach.lastName || '',
                    email: parent.coach.email || '',
                };
            }
            // If coach is an ID string, fetch it
            if (parent.coachId) {
                const coachIdString = String(parent.coachId);
                if (!mongoose.Types.ObjectId.isValid(coachIdString)) {
                    return null;
                }
                const user = await User.findById(coachIdString)
                    .select('firstName lastName email')
                    .lean();
                return user && user._id
                    ? {
                        id: user._id.toString(),
                        firstName: user.firstName || '',
                        lastName: user.lastName || '',
                        email: user.email || '',
                    }
                    : null;
            }
            return null;
        },
        clients: async (parent) => {
            // If clients are already populated (array of objects), return them
            if (parent.clients && Array.isArray(parent.clients) && parent.clients.length > 0) {
                return parent.clients
                    .filter((client) => client && client._id) // Filter out null/undefined clients
                    .map((client) => {
                    // Handle populated object
                    const clientId = client._id.toString();
                    if (!clientId) {
                        return null;
                    }
                    return {
                        id: clientId,
                        firstName: client.firstName || '',
                        lastName: client.lastName || '',
                        email: client.email || '',
                    };
                })
                    .filter((client) => client !== null); // Remove any null entries
            }
            // If clientsIds exist, fetch clients
            if (parent.clientsIds && parent.clientsIds.length > 0) {
                const clientsIds = parent.clientsIds
                    .map((id) => {
                    const idString = String(id);
                    if (!mongoose.Types.ObjectId.isValid(idString)) {
                        return null;
                    }
                    return new mongoose.Types.ObjectId(idString);
                })
                    .filter((id) => id !== null);
                if (clientsIds.length === 0) {
                    return [];
                }
                const clients = await User.find({
                    _id: { $in: clientsIds },
                })
                    .select('firstName lastName email')
                    .lean();
                return clients
                    .filter((client) => client && client._id) // Filter out null/undefined
                    .map((client) => {
                    const clientId = client._id.toString();
                    if (!clientId) {
                        return null;
                    }
                    return {
                        id: clientId,
                        firstName: client.firstName || '',
                        lastName: client.lastName || '',
                        email: client.email || '',
                    };
                })
                    .filter((client) => client !== null); // Remove any null entries
            }
            return [];
        },
        goal: async (parent) => {
            if (!parent.goalId)
                return null;
            // If goal is already populated (object), format it
            if (parent.goal && typeof parent.goal === 'object' && parent.goal._id) {
                // Handle populated goal object
                const goal = parent.goal;
                // Get client ID
                let clientId;
                if (goal.client_id) {
                    if (goal.client_id._id) {
                        clientId = goal.client_id._id.toString();
                    }
                    else if (goal.client_id instanceof mongoose.Types.ObjectId) {
                        clientId = goal.client_id.toString();
                    }
                    else {
                        clientId = String(goal.client_id);
                    }
                }
                else {
                    return null; // Invalid goal data
                }
                // Get coach ID
                let coachId = null;
                if (goal.coach_id) {
                    if (goal.coach_id._id) {
                        coachId = goal.coach_id._id.toString();
                    }
                    else if (goal.coach_id instanceof mongoose.Types.ObjectId) {
                        coachId = goal.coach_id.toString();
                    }
                    else {
                        coachId = String(goal.coach_id);
                    }
                }
                return {
                    id: goal._id.toString(),
                    clientId: clientId,
                    coachId: coachId,
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
            }
            // If goalId exists but goal is not populated, fetch it
            if (parent.goalId) {
                const goalIdString = String(parent.goalId);
                if (!mongoose.Types.ObjectId.isValid(goalIdString)) {
                    return null;
                }
                const goal = await Goal.findById(goalIdString)
                    .populate('client_id', 'firstName lastName email')
                    .populate('coach_id', 'firstName lastName email')
                    .lean();
                if (!goal)
                    return null;
                // Handle populated objects
                let clientId;
                if (goal.client_id) {
                    if (goal.client_id._id) {
                        clientId = goal.client_id._id.toString();
                    }
                    else if (goal.client_id instanceof mongoose.Types.ObjectId) {
                        clientId = goal.client_id.toString();
                    }
                    else {
                        clientId = String(goal.client_id);
                    }
                }
                else {
                    return null;
                }
                let coachId = null;
                if (goal.coach_id) {
                    if (goal.coach_id._id) {
                        coachId = goal.coach_id._id.toString();
                    }
                    else if (goal.coach_id instanceof mongoose.Types.ObjectId) {
                        coachId = goal.coach_id.toString();
                    }
                    else {
                        coachId = String(goal.coach_id);
                    }
                }
                return {
                    id: goal._id.toString(),
                    clientId: clientId,
                    coachId: coachId,
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
            }
            return null;
        },
    },
    SessionLog: {
        session: async (parent) => {
            if (typeof parent.session === 'string') {
                const session = await Session.findById(parent.session)
                    .populate('coach_id', 'firstName lastName')
                    .populate('clients_ids', 'firstName lastName email')
                    .lean();
                return session ? mapSessionToGraphQL(session) : null;
            }
            return parent.session;
        },
        client: async (parent) => {
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
        coach: async (parent) => {
            if (typeof parent.coach === 'string') {
                const user = await User.findById(parent.coach)
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
