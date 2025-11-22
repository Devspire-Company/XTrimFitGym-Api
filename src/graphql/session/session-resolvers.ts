import Session from '../../database/models/session/session-schema.js';
import SessionLog from '../../database/models/session/sessionLog-schema.js';
import User from '../../database/models/user/user-schema.js';
import { IAuthContext } from '../../context/auth-context.js';
import mongoose from 'mongoose';

type Context = IAuthContext;

const mapSessionToGraphQL = (session: any) => {
	return {
		id: session._id.toString(),
		coachId: session.coach_id.toString(),
		coach: session.coach_id,
		clientsIds: session.clients_ids?.map((id: mongoose.Types.ObjectId) =>
			id.toString()
		) || [],
		clients: session.clients_ids || [],
		name: session.name,
		workoutType: session.workoutType || null,
		date: session.date?.toISOString(),
		startTime: session.startTime || session.time || '',
		endTime: session.endTime || null,
		time: session.time || `${session.startTime}${session.endTime ? ` - ${session.endTime}` : ''}`,
		gymArea: session.gymArea,
		note: session.note || null,
		status: session.status || 'scheduled',
		createdAt: session.createdAt?.toISOString(),
		updatedAt: session.updatedAt?.toISOString(),
	};
};

const mapSessionLogToGraphQL = (sessionLog: any) => {
	return {
		id: sessionLog._id.toString(),
		sessionId: sessionLog.session_id.toString(),
		session: sessionLog.session_id,
		clientId: sessionLog.client_id.toString(),
		client: sessionLog.client_id,
		coachId: sessionLog.coach_id.toString(),
		coach: sessionLog.coach_id,
		weight: sessionLog.weight,
		clientConfirmed: sessionLog.clientConfirmed,
		coachConfirmed: sessionLog.coachConfirmed,
		notes: sessionLog.notes || null,
		completedAt: sessionLog.completedAt?.toISOString(),
		createdAt: sessionLog.createdAt?.toISOString(),
		updatedAt: sessionLog.updatedAt?.toISOString(),
	};
};

export default {
	Query: {
		getCoachSessions: async (
			_: any,
			{ coachId, status }: { coachId: string; status?: string },
			context: Context
		) => {
			// Authorization: Only coach can view their own sessions
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (userId !== coachId && userRole !== 'admin') {
				throw new Error('Unauthorized: You can only view your own sessions');
			}

			const query: any = { coach_id: new mongoose.Types.ObjectId(coachId) };
			if (status) {
				query.status = status;
			}

			const sessions = await Session.find(query)
				.populate('coach_id', 'firstName lastName')
				.populate('clients_ids', 'firstName lastName email')
				.sort({ date: 1, startTime: 1 })
				.lean();

			return sessions.map(mapSessionToGraphQL);
		},

		getClientSessions: async (
			_: any,
			{ clientId, status }: { clientId: string; status?: string },
			context: Context
		) => {
			// Authorization: Only client can view their own sessions
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (userId !== clientId && userRole !== 'admin') {
				throw new Error('Unauthorized: You can only view your own sessions');
			}

			const query: any = {
				clients_ids: new mongoose.Types.ObjectId(clientId),
			};
			if (status) {
				query.status = status;
			}

			const sessions = await Session.find(query)
				.populate('coach_id', 'firstName lastName')
				.populate('clients_ids', 'firstName lastName email')
				.sort({ date: 1, startTime: 1 })
				.lean();

			return sessions.map(mapSessionToGraphQL);
		},

		getUpcomingSessions: async (_: any, __: any, context: Context) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			const now = new Date();
			const query: any = {
				date: { $gte: now },
				status: 'scheduled',
			};

			// Get sessions where user is either coach or client
			if (userRole === 'coach') {
				query.coach_id = new mongoose.Types.ObjectId(userId);
			} else {
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

		getSession: async (_: any, { id }: { id: string }, context: Context) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			const session = await Session.findById(id)
				.populate('coach_id', 'firstName lastName email')
				.populate('clients_ids', 'firstName lastName email')
				.lean();

			if (!session) {
				throw new Error('Session not found');
			}

			// Authorization: Only coach, clients, or admin can view
			const isCoach = session.coach_id.toString() === userId;
			const isClient = session.clients_ids?.some(
				(clientId: mongoose.Types.ObjectId) =>
					clientId.toString() === userId
			);
			const isAdmin = userRole === 'admin';

			if (!isCoach && !isClient && !isAdmin) {
				throw new Error('Unauthorized: You cannot view this session');
			}

			return mapSessionToGraphQL(session);
		},

		getSessionLogs: async (
			_: any,
			{ clientId }: { clientId: string },
			context: Context
		) => {
			// Authorization: Only client or admin can view session logs
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (userId !== clientId && userRole !== 'admin') {
				throw new Error('Unauthorized: You can only view your own session logs');
			}

			const sessionLogs = await SessionLog.find({
				client_id: new mongoose.Types.ObjectId(clientId),
			})
				.populate('session_id')
				.populate('coach_id', 'firstName lastName')
				.populate('client_id', 'firstName lastName')
				.sort({ completedAt: -1 })
				.lean();

			return sessionLogs.map(mapSessionLogToGraphQL);
		},

		getWeightProgress: async (
			_: any,
			{ clientId, goalId }: { clientId: string; goalId?: string },
			context: Context
		) => {
			// Authorization: Only client or admin can view weight progress
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (userId !== clientId && userRole !== 'admin') {
				throw new Error('Unauthorized: You can only view your own progress');
			}

			const query: any = {
				client_id: new mongoose.Types.ObjectId(clientId),
				clientConfirmed: true,
				coachConfirmed: true,
			};

			if (goalId) {
				// Filter by goal if provided
				// Note: You might want to link goals to sessions in the future
			}

			const sessionLogs = await SessionLog.find(query)
				.populate('session_id', 'date name')
				.sort({ completedAt: 1 })
				.lean();

			return sessionLogs.map(mapSessionLogToGraphQL);
		},
	},

	Mutation: {
		createSession: async (
			_: any,
			{ input }: { input: any },
			context: Context
		) => {
			// Authorization: Only coaches can create sessions
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (userRole !== 'coach' && userRole !== 'admin') {
				throw new Error('Unauthorized: Only coaches can create sessions');
			}

			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			const session = new Session({
				coach_id: new mongoose.Types.ObjectId(userId),
				clients_ids: input.clientsIds.map(
					(id: string) => new mongoose.Types.ObjectId(id)
				),
				name: input.name,
				workoutType: input.workoutType || null,
				date: new Date(input.date),
				startTime: input.startTime,
				endTime: input.endTime || null,
				time: input.endTime
					? `${input.startTime} - ${input.endTime}`
					: input.startTime,
				gymArea: input.gymArea,
				note: input.note || null,
				status: 'scheduled',
			});

			await session.save();

			// Update coach's sessions_ids
			await User.findByIdAndUpdate(userId, {
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
				.lean();

			return mapSessionToGraphQL(populatedSession);
		},

		updateSession: async (
			_: any,
			{ id, input }: { id: string; input: any },
			context: Context
		) => {
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

			const updateData: any = {};
			if (input.name !== undefined) updateData.name = input.name;
			if (input.workoutType !== undefined)
				updateData.workoutType = input.workoutType;
			if (input.date !== undefined) updateData.date = new Date(input.date);
			if (input.startTime !== undefined)
				updateData.startTime = input.startTime;
			if (input.endTime !== undefined) updateData.endTime = input.endTime;
			if (input.gymArea !== undefined) updateData.gymArea = input.gymArea;
			if (input.note !== undefined) updateData.note = input.note;
			if (input.status !== undefined) updateData.status = input.status;

			if (input.startTime || input.endTime) {
				updateData.time = input.endTime
					? `${input.startTime || session.startTime} - ${input.endTime}`
					: input.startTime || session.startTime;
			}

			const updatedSession = await Session.findByIdAndUpdate(
				id,
				updateData,
				{ new: true }
			)
				.populate('coach_id', 'firstName lastName')
				.populate('clients_ids', 'firstName lastName email')
				.lean();

			return mapSessionToGraphQL(updatedSession);
		},

		cancelSession: async (_: any, { id }: { id: string }, context: Context) => {
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

		completeSession: async (
			_: any,
			{ input }: { input: any },
			context: Context
		) => {
			// Authorization: Only members/clients can complete sessions (enter weight)
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (userRole !== 'member' && userRole !== 'admin') {
				throw new Error('Unauthorized: Only clients can complete sessions');
			}

			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			const session = await Session.findById(input.sessionId).lean();
			if (!session) {
				throw new Error('Session not found');
			}

			// Check if client is part of this session
			const isClient = session.clients_ids?.some(
				(clientId: mongoose.Types.ObjectId) =>
					clientId.toString() === userId
			);

			if (!isClient && userRole !== 'admin') {
				throw new Error('Unauthorized: You are not part of this session');
			}

			// Check if session log already exists
			let sessionLog = await SessionLog.findOne({
				session_id: new mongoose.Types.ObjectId(input.sessionId),
				client_id: new mongoose.Types.ObjectId(userId),
			});

			if (sessionLog) {
				// Update existing log
				sessionLog.weight = input.weight;
				sessionLog.clientConfirmed = true;
				if (input.notes !== undefined) sessionLog.notes = input.notes;
				await sessionLog.save();
			} else {
				// Create new log
				sessionLog = new SessionLog({
					session_id: new mongoose.Types.ObjectId(input.sessionId),
					client_id: new mongoose.Types.ObjectId(userId),
					coach_id: session.coach_id,
					weight: input.weight,
					clientConfirmed: true,
					coachConfirmed: false,
					notes: input.notes || null,
				});
				await sessionLog.save();
			}

			const populatedLog = await SessionLog.findById(sessionLog._id)
				.populate('session_id')
				.populate('coach_id', 'firstName lastName')
				.populate('client_id', 'firstName lastName')
				.lean();

			return mapSessionLogToGraphQL(populatedLog);
		},

		confirmSessionCompletion: async (
			_: any,
			{ input }: { input: any },
			context: Context
		) => {
			// Authorization: Only coaches can confirm session completion
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (userRole !== 'coach' && userRole !== 'admin') {
				throw new Error(
					'Unauthorized: Only coaches can confirm session completion'
				);
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
				throw new Error(
					'Unauthorized: You cannot confirm completion for this session'
				);
			}

			const updatedLog = await SessionLog.findByIdAndUpdate(
				input.sessionLogId,
				{
					coachConfirmed: input.confirm,
				},
				{ new: true }
			)
				.populate('session_id')
				.populate('coach_id', 'firstName lastName')
				.populate('client_id', 'firstName lastName')
				.lean();

			// If both confirmed, mark session as completed
			if (
				updatedLog?.clientConfirmed &&
				updatedLog?.coachConfirmed &&
				session.status === 'scheduled'
			) {
				await Session.findByIdAndUpdate(session._id, {
					status: 'completed',
				});
			}

			return mapSessionLogToGraphQL(updatedLog);
		},

		clientConfirmWeight: async (
			_: any,
			{ sessionLogId }: { sessionLogId: string },
			context: Context
		) => {
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

			const updatedLog = await SessionLog.findByIdAndUpdate(
				sessionLogId,
				{
					clientConfirmed: true,
				},
				{ new: true }
			)
				.populate('session_id')
				.populate('coach_id', 'firstName lastName')
				.populate('client_id', 'firstName lastName')
				.lean();

			return mapSessionLogToGraphQL(updatedLog);
		},
	},

	Session: {
		coach: async (parent: any) => {
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
		clients: async (parent: any) => {
			if (parent.clientsIds && parent.clientsIds.length > 0) {
				const clients = await User.find({
					_id: { $in: parent.clientsIds.map((id: string) => new mongoose.Types.ObjectId(id)) },
				})
					.select('firstName lastName email')
					.lean();
				return clients.map((client: any) => ({
					id: client._id.toString(),
					firstName: client.firstName,
					lastName: client.lastName,
					email: client.email,
				}));
			}
			return [];
		},
	},

	SessionLog: {
		session: async (parent: any) => {
			if (typeof parent.session === 'string') {
				const session = await Session.findById(parent.session)
					.populate('coach_id', 'firstName lastName')
					.populate('clients_ids', 'firstName lastName email')
					.lean();
				return session ? mapSessionToGraphQL(session) : null;
			}
			return parent.session;
		},
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
		coach: async (parent: any) => {
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

