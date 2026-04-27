import Session from '../../database/models/session/session-schema.js';
import SessionLog from '../../database/models/session/sessionLog-schema.js';
import User from '../../database/models/user/user-schema.js';
import Goal from '../../database/models/goal/goal-schema.js';
import MembershipTransaction from '../../database/models/membership/membershipTransaction-schema.js';
import Notification from '../../database/models/notification/notification-schema.js';
import Equipment from '../../database/models/equipment/equipment-schema.js';
import { IAuthContext } from '../../context/auth-context.js';
import mongoose from 'mongoose';

type Context = IAuthContext;

const sessionPopulatePaths = [
	{ path: 'coach_id', select: 'firstName lastName email' },
	{ path: 'clients_ids', select: 'firstName lastName email' },
	{ path: 'enrollments.client_id', select: 'firstName lastName email' },
	{ path: 'goalId', select: 'title goalType' },
] as const;

async function fetchSessionDocument(sessionId: string) {
	return Session.findById(sessionId)
		.populate([...sessionPopulatePaths])
		.lean();
}

function parseTimeToMinutes(raw: string): number {
	const value = String(raw || '').trim().toUpperCase();
	const m = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
	if (!m) throw new Error(`Invalid time format: ${raw}`);
	let hours = parseInt(m[1], 10);
	const minutes = parseInt(m[2], 10);
	if (minutes < 0 || minutes > 59 || hours < 1 || hours > 12) {
		throw new Error(`Invalid time value: ${raw}`);
	}
	if (m[3] === 'AM' && hours === 12) hours = 0;
	if (m[3] === 'PM' && hours !== 12) hours += 12;
	return hours * 60 + minutes;
}

function windowsOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
	return startA < endB && startB < endA;
}

function normalizeEquipmentReservationsInput(input: any): Array<{
	equipment_id: mongoose.Types.ObjectId;
	quantity: number;
	reservedStartTime?: string;
	reservedEndTime?: string;
}> {
	if (!Array.isArray(input) || input.length === 0) return [];
	return input.map((row: any) => {
		const equipmentId = String(row?.equipmentId || '');
		if (!mongoose.Types.ObjectId.isValid(equipmentId)) {
			throw new Error('One or more equipment IDs are invalid');
		}
		const quantity = Math.max(1, Number(row?.quantity || 1));
		const reservedStartTime = row?.reservedStartTime
			? String(row.reservedStartTime).trim()
			: undefined;
		const reservedEndTime = row?.reservedEndTime
			? String(row.reservedEndTime).trim()
			: undefined;
		return {
			equipment_id: new mongoose.Types.ObjectId(equipmentId),
			quantity,
			...(reservedStartTime ? { reservedStartTime } : {}),
			...(reservedEndTime ? { reservedEndTime } : {}),
		};
	});
}

async function validateEquipmentReservationsOrThrow(opts: {
	reservations: Array<{
		equipment_id: mongoose.Types.ObjectId;
		quantity: number;
		reservedStartTime?: string;
		reservedEndTime?: string;
	}>;
	date: Date;
	fallbackStartTime: string;
	fallbackEndTime?: string | null;
	excludeSessionId?: string;
}) {
	const { reservations, date, fallbackStartTime, fallbackEndTime, excludeSessionId } = opts;
	if (!reservations.length) return;

	const equipmentIds = [...new Set(reservations.map((r) => r.equipment_id.toString()))];
	const equipmentDocs = await Equipment.find({
		_id: { $in: equipmentIds.map((id) => new mongoose.Types.ObjectId(id)) },
		isArchived: { $ne: true },
	}).lean();
	if (equipmentDocs.length !== equipmentIds.length) {
		throw new Error('One or more selected equipment items do not exist');
	}
	const blocked = equipmentDocs.find((x: any) => String(x.status || 'AVAILABLE') !== 'AVAILABLE');
	if (blocked) {
		throw new Error(`Equipment "${blocked.name}" is not available for scheduling`);
	}
	const equipmentById = new Map(
		equipmentDocs.map((x: any) => [x._id.toString(), Math.max(0, Number(x.quantity ?? 1))])
	);

	const dayStart = new Date(date);
	dayStart.setHours(0, 0, 0, 0);
	const dayEnd = new Date(dayStart);
	dayEnd.setDate(dayEnd.getDate() + 1);

	const query: any = {
		status: 'scheduled',
		date: { $gte: dayStart, $lt: dayEnd },
		equipmentReservations: {
			$elemMatch: {
				equipment_id: { $in: equipmentIds.map((id) => new mongoose.Types.ObjectId(id)) },
			},
		},
	};
	if (excludeSessionId && mongoose.Types.ObjectId.isValid(excludeSessionId)) {
		query._id = { $ne: new mongoose.Types.ObjectId(excludeSessionId) };
	}
	const sameDaySessions = await Session.find(query)
		.select('name startTime endTime equipmentReservations')
		.lean();

	for (const target of reservations) {
		const targetStart = parseTimeToMinutes(target.reservedStartTime || fallbackStartTime);
		const targetEnd = parseTimeToMinutes(
			target.reservedEndTime || fallbackEndTime || target.reservedStartTime || fallbackStartTime
		);
		if (targetEnd <= targetStart) {
			throw new Error('Equipment reservation end time must be after start time');
		}
		let totalQuantityInWindow = Math.max(1, Number(target.quantity || 1));
		for (const existingSession of sameDaySessions as any[]) {
			for (const exRow of existingSession.equipmentReservations || []) {
				if (exRow.equipment_id?.toString() !== target.equipment_id.toString()) continue;
				const exStart = parseTimeToMinutes(exRow.reservedStartTime || existingSession.startTime);
				const exEnd = parseTimeToMinutes(
					exRow.reservedEndTime ||
						existingSession.endTime ||
						exRow.reservedStartTime ||
						existingSession.startTime
				);
				if (exEnd <= exStart) continue;
				if (windowsOverlap(targetStart, targetEnd, exStart, exEnd)) {
					totalQuantityInWindow += Math.max(1, Number(exRow.quantity || 1));
				}
			}
		}
		const capacity = equipmentById.get(target.equipment_id.toString()) ?? 1;
		if (totalQuantityInWindow > capacity) {
			throw new Error(
				`Equipment capacity exceeded for selected time window (requested total ${totalQuantityInWindow}, capacity ${capacity})`
			);
		}
	}
}

function mapEnrollmentToGraphQL(e: any) {
	const rawCid = e.client_id;
	const clientId =
		rawCid?._id?.toString() ||
		(rawCid instanceof mongoose.Types.ObjectId
			? rawCid.toString()
			: String(rawCid || ''));
	let client: any = null;
	if (rawCid && typeof rawCid === 'object' && rawCid.firstName !== undefined) {
		client = {
			id: clientId,
			firstName: rawCid.firstName || '',
			lastName: rawCid.lastName || '',
			email: rawCid.email || '',
		};
	}
	return {
		clientId,
		client,
		status: e.status,
		createdAt: e.createdAt?.toISOString?.() || null,
	};
}

/** Ensures IDs exist. Invites are not limited to the coach's assigned client list. */
async function assertInviteUserIdsExist(clientIds: string[]) {
	if (clientIds.length === 0) return;
	const unique = [...new Set(clientIds.map((x) => String(x)))];
	const oids: mongoose.Types.ObjectId[] = [];
	for (const id of unique) {
		if (!mongoose.Types.ObjectId.isValid(id)) {
			throw new Error('One or more invalid user ids');
		}
		oids.push(new mongoose.Types.ObjectId(id));
	}
	const n = await User.countDocuments({ _id: { $in: oids } });
	if (n !== unique.length) {
		throw new Error('One or more users were not found');
	}
}

function getEnrollmentForClient(session: any, clientIdStr: string) {
	return (session.enrollments || []).find(
		(e: any) => e.client_id?.toString() === clientIdStr,
	);
}

function acceptedCount(session: any) {
	return (session.clients_ids || []).length;
}

async function assertActiveMembershipForUserIds(userIds: string[]) {
	if (userIds.length === 0) return;
	const now = new Date();
	const unique = [...new Set(userIds.map((x) => String(x)))];
	for (const uid of unique) {
		if (!mongoose.Types.ObjectId.isValid(uid)) {
			throw new Error('One or more invalid user ids for membership check');
		}
		const t = await MembershipTransaction.findOne({
			client_id: new mongoose.Types.ObjectId(uid),
			status: 'Active',
			expiresAt: { $gte: now },
		}).lean();
		if (!t) {
			throw new Error(
				'Each selected member must have an active, non-expired membership',
			);
		}
	}
}

async function notifyMembersSessionScheduled(opts: {
	recipientIds: string[];
	sessionId: string;
	sessionName: string;
	coachLabel: string;
	sessionDateIso: string;
}) {
	const { recipientIds, sessionId, sessionName, coachLabel, sessionDateIso } =
		opts;
	const when = new Date(sessionDateIso);
	const whenLabel = Number.isFinite(when.getTime())
		? when.toLocaleString()
		: sessionDateIso;
	const title = 'Session scheduled';
	const message = `${coachLabel} scheduled "${sessionName}" (${whenLabel}).`;
	for (const rid of recipientIds) {
		if (!mongoose.Types.ObjectId.isValid(rid)) continue;
		const dedupeKey = `session_scheduled:${sessionId}:${rid}`;
		try {
			await Notification.create({
				recipientId: new mongoose.Types.ObjectId(rid),
				recipientRole: 'member',
				type: 'SESSION_SCHEDULED',
				title,
				message,
				dedupeKey,
				metadataJson: JSON.stringify({ sessionId }),
			});
		} catch (e: any) {
			if (e?.code !== 11000) throw e;
		}
	}
}

/** Member should not see group classes they left or were removed from (declined/rejected, off roster). */
function clientVisibleInGroupClassSession(session: any, clientIdStr: string): boolean {
	if (session.sessionKind !== 'group_class') return true;
	const inRoster = (session.clients_ids || []).some(
		(x: any) => x.toString() === clientIdStr,
	);
	const myEn = (session.enrollments || []).find(
		(e: any) => e.client_id?.toString() === clientIdStr,
	);
	if (
		!inRoster &&
		myEn &&
		(myEn.status === 'declined' || myEn.status === 'rejected')
	) {
		return false;
	}
	return true;
}

const mapSessionToGraphQL = (session: any) => {
	// Handle coach_id - it might be an ObjectId or a populated object
	let coachId: string;
	if (session.coach_id) {
		if (session.coach_id._id) {
			// Populated object - use _id
			coachId = session.coach_id._id.toString();
		} else if (session.coach_id instanceof mongoose.Types.ObjectId) {
			// ObjectId instance
			coachId = session.coach_id.toString();
		} else {
			// Already a string or other format
			coachId = String(session.coach_id);
		}
	} else {
		coachId = '';
	}

	// Handle clients_ids - they might be ObjectIds or populated objects
	const clientsIds = (session.clients_ids || []).map((id: any) => {
		if (id._id) {
			// Populated object - use _id
			return id._id.toString();
		} else if (id instanceof mongoose.Types.ObjectId) {
			// ObjectId instance
			return id.toString();
		} else {
			// Already a string or other format
			return String(id);
		}
	});

	// Handle goalId - it might be an ObjectId or a populated object
	let goalId: string | null = null;
	let goal: any = null;
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
		} else if (session.goalId instanceof mongoose.Types.ObjectId) {
			// ObjectId instance - not populated
			goalId = session.goalId.toString();
			goal = null;
		} else {
			// Already a string or other format
			goalId = String(session.goalId);
			goal = null;
		}
	}

	// Handle templateId
	let templateId: string | null = null;
	if (session.templateId) {
		if (session.templateId instanceof mongoose.Types.ObjectId) {
			templateId = session.templateId.toString();
		} else {
			templateId = String(session.templateId);
		}
	}

	const sessionKind =
		session.sessionKind === 'group_class' ? 'group_class' : 'personal';
	const enrollments = (session.enrollments || []).map(mapEnrollmentToGraphQL);
	const equipmentReservations = (session.equipmentReservations || []).map((row: any) => ({
		equipmentId: row.equipment_id?.toString?.() || String(row.equipment_id || ''),
		quantity: Math.max(1, Number(row.quantity || 1)),
		reservedStartTime: row.reservedStartTime || null,
		reservedEndTime: row.reservedEndTime || null,
	}));

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
		time:
			session.time ||
			`${session.startTime}${session.endTime ? ` - ${session.endTime}` : ''}`,
		gymArea: session.gymArea,
		note: session.note || null,
		status: session.status || 'scheduled',
		templateId: templateId,
		goalId: goalId,
		goal: goal, // Use the properly mapped goal object
		isTemplate: session.isTemplate || false,
		sessionKind,
		maxParticipants:
			sessionKind === 'group_class' && session.maxParticipants != null
				? session.maxParticipants
				: null,
		enrollments,
		equipmentReservations,
		createdAt: session.createdAt?.toISOString(),
		updatedAt: session.updatedAt?.toISOString(),
	};
};

const mapSessionLogToGraphQL = (sessionLog: any) => {
	// Map session using mapSessionToGraphQL if it's populated
	let mappedSession = null;
	if (sessionLog.session_id) {
		if (sessionLog.session_id._id || sessionLog.session_id.name) {
			// It's a populated object, use mapSessionToGraphQL
			mappedSession = mapSessionToGraphQL(sessionLog.session_id);
		} else {
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
		} else {
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
		} else {
			// It's just an ObjectId
			mappedCoach = {
				id: sessionLog.coach_id.toString(),
			};
		}
	}

	// Get sessionId and IDs as strings
	const sessionId =
		sessionLog.session_id?._id?.toString() ||
		sessionLog.session_id?.id ||
		sessionLog.session_id?.toString() ||
		'';
	const clientId =
		sessionLog.client_id?._id?.toString() ||
		sessionLog.client_id?.id ||
		sessionLog.client_id?.toString() ||
		'';
	const coachId =
		sessionLog.coach_id?._id?.toString() ||
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
		getCoachSessions: async (
			_: any,
			{ coachId, status }: { coachId: string; status?: string },
			context: Context,
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

			// Get all sessions first
			const allSessions = await Session.find(query)
				.populate('coach_id', 'firstName lastName')
				.populate('clients_ids', 'firstName lastName email')
				.populate({
					path: 'enrollments.client_id',
					select: 'firstName lastName email',
				})
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
			const completedSessionIds = new Set(
				sessionLogs.map((log: any) => {
					const sessionId = log.session_id;
					return sessionId instanceof mongoose.Types.ObjectId
						? sessionId.toString()
						: sessionId._id
							? sessionId._id.toString()
							: String(sessionId);
				}),
			);

			// Filter out completed sessions
			const sessions = allSessions.filter((session: any) => {
				const sessionId = session._id.toString();
				return !completedSessionIds.has(sessionId);
			});

			return sessions.map(mapSessionToGraphQL);
		},

		getClientSessions: async (
			_: any,
			{ clientId, status }: { clientId: string; status?: string },
			context: Context,
		) => {
			// Authorization: Only client can view their own sessions
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (userId !== clientId && userRole !== 'admin') {
				throw new Error('Unauthorized: You can only view your own sessions');
			}

			const clientOid = new mongoose.Types.ObjectId(clientId);
			const query: any = {
				$or: [
					{ clients_ids: clientOid },
					{ enrollments: { $elemMatch: { client_id: clientOid } } },
				],
			};
			if (status) {
				query.status = status;
			}

			// Get all sessions first
			const allSessions = await Session.find(query)
				.populate('coach_id', 'firstName lastName')
				.populate('clients_ids', 'firstName lastName email')
				.populate({
					path: 'enrollments.client_id',
					select: 'firstName lastName email',
				})
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
			const completedSessionIds = new Set(
				sessionLogs.map((log: any) => {
					const sessionId = log.session_id;
					return sessionId instanceof mongoose.Types.ObjectId
						? sessionId.toString()
						: sessionId._id
							? sessionId._id.toString()
							: String(sessionId);
				}),
			);

			// Filter out completed sessions and group classes the member has left / been removed from
			const sessions = allSessions.filter((session: any) => {
				const sessionId = session._id.toString();
				if (completedSessionIds.has(sessionId)) return false;
				if (!clientVisibleInGroupClassSession(session, String(clientId))) {
					return false;
				}
				return true;
			});

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

			const userOid = new mongoose.Types.ObjectId(userId);
			if (userRole === 'coach') {
				query.coach_id = userOid;
			} else {
				query.$or = [
					{ clients_ids: userOid },
					{ enrollments: { $elemMatch: { client_id: userOid } } },
				];
			}

			const sessions = await Session.find(query)
				.populate('coach_id', 'firstName lastName')
				.populate('clients_ids', 'firstName lastName email')
				.populate({
					path: 'enrollments.client_id',
					select: 'firstName lastName email',
				})
				.sort({ date: 1, startTime: 1 })
				.limit(10)
				.lean();

			const filtered =
				userRole === 'member'
					? sessions.filter((s: any) =>
							clientVisibleInGroupClassSession(s, String(userId)),
						)
					: sessions;

			return filtered.map(mapSessionToGraphQL);
		},

		getJoinableGroupClasses: async (_: any, __: any, context: Context) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (!userId || userRole !== 'member') {
				throw new Error(
					'Unauthorized: Only members can browse joinable classes',
				);
			}
			const memberOid = new mongoose.Types.ObjectId(userId);
			const now = new Date();
			now.setHours(0, 0, 0, 0);
			const sessions = await Session.find({
				sessionKind: 'group_class',
				status: 'scheduled',
				date: { $gte: now },
				clients_ids: { $nin: [memberOid] },
				$nor: [
					{
						enrollments: {
							$elemMatch: {
								client_id: memberOid,
								status: { $in: ['invited', 'pending', 'accepted'] },
							},
						},
					},
				],
			})
				.populate('coach_id', 'firstName lastName')
				.populate('clients_ids', 'firstName lastName email')
				.populate({
					path: 'enrollments.client_id',
					select: 'firstName lastName email',
				})
				.populate('goalId', 'title goalType')
				.sort({ date: 1, startTime: 1 })
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
				.populate({
					path: 'enrollments.client_id',
					select: 'firstName lastName email',
				})
				.populate('goalId', 'title goalType')
				.lean();

			if (!session) {
				throw new Error('Session not found');
			}

			// Authorization: Only coach, clients, or admin can view
			const isCoach = session.coach_id.toString() === userId;
			const isClient = session.clients_ids?.some(
				(clientId: mongoose.Types.ObjectId) => clientId.toString() === userId,
			);
			const hasEnrollment = (session.enrollments || []).some(
				(e: any) => e.client_id?.toString() === userId,
			);
			const isAdmin = userRole === 'admin';

			if (!isCoach && !isClient && !hasEnrollment && !isAdmin) {
				throw new Error('Unauthorized: You cannot view this session');
			}

			return mapSessionToGraphQL(session);
		},

		getSessionTemplates: async (
			_: any,
			{ coachId }: { coachId: string },
			context: Context,
		) => {
			// Authorization: Only coach can view their own templates
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;

			// Ensure coachId is a string for comparison
			const coachIdString = String(coachId);
			const userIdString = userId ? String(userId) : null;

			if (userIdString !== coachIdString && userRole !== 'admin') {
				throw new Error(
					'Unauthorized: You can only view your own session templates',
				);
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

		getSessionLogs: async (
			_: any,
			{ clientId }: { clientId: string },
			context: Context,
		) => {
			// Authorization: Only client or admin can view session logs
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (userId !== clientId && userRole !== 'admin') {
				throw new Error(
					'Unauthorized: You can only view your own session logs',
				);
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
							select:
								'id title goalType description targetValue currentValue startDate targetDate client_id coach_id',
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

		getCoachSessionLogs: async (
			_: any,
			{ coachId }: { coachId: string },
			context: Context,
		) => {
			// Authorization: Only coach or admin can view their session logs
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (userId !== coachId && userRole !== 'admin') {
				throw new Error(
					'Unauthorized: You can only view your own session logs',
				);
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
							select:
								'id title goalType description targetValue currentValue startDate targetDate client_id coach_id',
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

		getSessionLogBySessionId: async (
			_: any,
			{ sessionId }: { sessionId: string },
			context: Context,
		) => {
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
			const isClient = session.clients_ids?.some(
				(clientId: mongoose.Types.ObjectId) => clientId.toString() === userId,
			);

			if (!isCoach && !isClient && userRole !== 'admin') {
				throw new Error(
					'Unauthorized: You can only view session logs for your own sessions',
				);
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
							select:
								'id title goalType description targetValue currentValue startDate targetDate client_id coach_id',
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

		getWeightProgress: async (
			_: any,
			{ clientId, goalId }: { clientId: string; goalId?: string },
			context: Context,
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
				.populate({
					path: 'session_id',
					select: 'id date name',
					populate: [
						{ path: 'coach_id', select: 'id firstName lastName email' },
						{ path: 'clients_ids', select: 'id firstName lastName email' },
						{
							path: 'goalId',
							select:
								'id title goalType description targetValue currentValue startDate targetDate client_id coach_id',
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
		createSession: async (
			_: any,
			{ input }: { input: any },
			context: Context,
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

			// Ensure userId is a string
			const userIdString = String(userId);

			let effectiveCoachId = userIdString;
			if (userRole === 'admin') {
				const requestedCoach = input.coachId ? String(input.coachId) : '';
				if (!requestedCoach || !mongoose.Types.ObjectId.isValid(requestedCoach)) {
					throw new Error('Admin must select a valid coach (coachId) for this session');
				}
				effectiveCoachId = requestedCoach;
			} else {
				if (input.coachId && String(input.coachId) !== userIdString) {
					throw new Error('Unauthorized: Coaches cannot assign sessions to another coach');
				}
			}

			const coachUser = await User.findById(effectiveCoachId).lean();
			if (!coachUser || coachUser.role !== 'coach') {
				throw new Error('Coach not found or user is not a coach');
			}

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

			const sessionKind =
				input.sessionKind === 'group_class' ? 'group_class' : 'personal';
			const isGroupClass = sessionKind === 'group_class';

			if (input.isTemplate && isGroupClass) {
				throw new Error('Group class sessions cannot be created as templates');
			}

			// For templates, allow empty clients_ids array
			// For personal sessions, ensure at least one client is provided
			if (
				!input.isTemplate &&
				!isGroupClass &&
				(!input.clientsIds || input.clientsIds.length === 0)
			) {
				throw new Error('At least one client must be selected for a session');
			}

			if (
				isGroupClass &&
				input.maxParticipants != null &&
				input.maxParticipants < 1
			) {
				throw new Error('maxParticipants must be at least 1');
			}

			const invitedIds: string[] = (input.invitedClientIds || []).map(
				(x: string) => String(x),
			);
			if (isGroupClass && invitedIds.length > 0) {
				await assertInviteUserIdsExist(invitedIds);
			}

			if (userRole === 'admin') {
				const membershipCheckIds = !isGroupClass
					? (input.clientsIds || []).map((x: string) => String(x))
					: invitedIds;
				await assertActiveMembershipForUserIds(membershipCheckIds);
			}

			const clientsIds =
				input.isTemplate || isGroupClass
					? []
					: (input.clientsIds || []).map(
							(id: string) => new mongoose.Types.ObjectId(id),
						);

			const enrollments =
				isGroupClass && invitedIds.length > 0
					? invitedIds.map((cid) => ({
							client_id: new mongoose.Types.ObjectId(cid),
							status: 'invited' as const,
							createdAt: new Date(),
						}))
					: [];

			const normalizedEquipmentReservations = normalizeEquipmentReservationsInput(
				input.equipmentReservations
			);
			await validateEquipmentReservationsOrThrow({
				reservations: normalizedEquipmentReservations,
				date: new Date(input.date),
				fallbackStartTime: input.startTime,
				fallbackEndTime: input.endTime || null,
			});

			const session = new Session({
				coach_id: new mongoose.Types.ObjectId(effectiveCoachId),
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
				sessionKind,
				maxParticipants: isGroupClass
					? (input.maxParticipants ?? 20)
					: undefined,
				enrollments,
				equipmentReservations: normalizedEquipmentReservations,
			});

			await session.save();

			// Update coach's sessions_ids
			await User.findByIdAndUpdate(effectiveCoachId, {
				$push: {
					'coachDetails.sessions_ids': session._id,
				},
			});

			const populatedSession = await Session.findById(session._id)
				.populate('coach_id', 'firstName lastName')
				.populate('clients_ids', 'firstName lastName email')
				.populate({
					path: 'enrollments.client_id',
					select: 'firstName lastName email',
				})
				.populate('goalId', 'title goalType')
				.lean();

			const notifyIds: string[] = !isGroupClass
				? (input.clientsIds || []).map((x: string) => String(x))
				: invitedIds;
			if (notifyIds.length > 0 && !input.isTemplate) {
				const coachDoc = await User.findById(effectiveCoachId)
					.select('firstName lastName')
					.lean();
				const coachLabel = coachDoc
					? `${coachDoc.firstName || ''} ${coachDoc.lastName || ''}`.trim() ||
						'Your coach'
					: 'Your coach';
				const sessionNameForNotify = templateSession
					? templateSession.name
					: input.name;
				await notifyMembersSessionScheduled({
					recipientIds: notifyIds,
					sessionId: session._id.toString(),
					sessionName: sessionNameForNotify,
					coachLabel,
					sessionDateIso: input.date,
				});
			}

			return mapSessionToGraphQL(populatedSession);
		},

		createSessionFromTemplate: async (
			_: any,
			{ input }: { input: any },
			context: Context,
		) => {
			// Authorization: Only coaches can create sessions from templates
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (userRole !== 'coach' && userRole !== 'admin') {
				throw new Error(
					'Unauthorized: Only coaches can create sessions from templates',
				);
			}

			if (!userId) {
				throw new Error('Unauthorized: Please log in');
			}

			// Ensure all IDs are strings
			const userIdString = String(userId);
			const templateIdString = String(input.templateId);
			const goalIdString = input.goalId ? String(input.goalId) : null;

			// Validate and convert client IDs
			if (
				!input.clientsIds ||
				!Array.isArray(input.clientsIds) ||
				input.clientsIds.length === 0
			) {
				throw new Error('At least one client must be selected');
			}

			const clientsIds = input.clientsIds.map((id: string) => {
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
					const isGoalForSelectedClient = clientsIds.some(
						(clientObjId: mongoose.Types.ObjectId) =>
							clientObjId.toString() === goalClientId,
					);
					if (!isGoalForSelectedClient && userRole !== 'admin') {
						throw new Error(
							'The selected goal must belong to one of the selected clients',
						);
					}
				}
			}

			// Create new session from template
			// Use workoutType from input if provided, otherwise use template's workoutType
			const workoutType =
				input.workoutType !== undefined && input.workoutType !== null
					? input.workoutType
					: templateSession.workoutType || null;
			const normalizedEquipmentReservations = normalizeEquipmentReservationsInput(
				input.equipmentReservations
			);
			await validateEquipmentReservationsOrThrow({
				reservations: normalizedEquipmentReservations,
				date: new Date(input.date),
				fallbackStartTime: input.startTime,
				fallbackEndTime: input.endTime || null,
			});

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
				sessionKind: 'personal',
				enrollments: [],
				equipmentReservations: normalizedEquipmentReservations,
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
					path: 'enrollments.client_id',
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
				throw new Error(
					'Failed to create session: Session was not saved properly',
				);
			}

			// Validate that populated fields have valid IDs
			if (!populatedSession.coach_id || !populatedSession.coach_id._id) {
				throw new Error('Failed to populate coach: Coach not found');
			}

			if (
				!populatedSession.clients_ids ||
				populatedSession.clients_ids.length === 0
			) {
				throw new Error('Failed to populate clients: No valid clients found');
			}

			// Validate all clients have valid IDs
			const invalidClients = populatedSession.clients_ids.filter(
				(client: any) => !client || !client._id,
			);
			if (invalidClients.length > 0) {
				throw new Error(
					`Failed to populate clients: ${invalidClients.length} invalid client(s)`,
				);
			}

			// If goalId was provided, validate it was populated correctly
			if (goalIdString && populatedSession.goalId) {
				if (!populatedSession.goalId._id) {
					throw new Error('Failed to populate goal: Goal not found');
				}
			}

			return mapSessionToGraphQL(populatedSession);
		},

		updateSession: async (
			_: any,
			{ id, input }: { id: string; input: any },
			context: Context,
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
			if (input.startTime !== undefined) updateData.startTime = input.startTime;
			if (input.endTime !== undefined) updateData.endTime = input.endTime;
			if (input.gymArea !== undefined) updateData.gymArea = input.gymArea;
			if (input.note !== undefined) updateData.note = input.note;
			if (input.status !== undefined) updateData.status = input.status;
			if (input.maxParticipants !== undefined) {
				if (session.sessionKind !== 'group_class') {
					throw new Error(
						'maxParticipants applies only to group class sessions',
					);
				}
				if (input.maxParticipants < acceptedCount(session)) {
					throw new Error(
						'maxParticipants cannot be below current accepted count',
					);
				}
				updateData.maxParticipants = input.maxParticipants;
			}
			if (input.equipmentReservations !== undefined) {
				const normalizedEquipmentReservations = normalizeEquipmentReservationsInput(
					input.equipmentReservations
				);
				const effectiveDate = input.date ? new Date(input.date) : new Date(session.date);
				const effectiveStartTime = input.startTime || session.startTime;
				const effectiveEndTime =
					input.endTime !== undefined ? input.endTime : (session.endTime || null);
				await validateEquipmentReservationsOrThrow({
					reservations: normalizedEquipmentReservations,
					date: effectiveDate,
					fallbackStartTime: effectiveStartTime,
					fallbackEndTime: effectiveEndTime,
					excludeSessionId: id,
				});
				updateData.equipmentReservations = normalizedEquipmentReservations;
			}

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
				.populate({
					path: 'enrollments.client_id',
					select: 'firstName lastName email',
				})
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
			context: Context,
		) => {
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
				throw new Error(
					'All four progress images are required: front, rightSide, leftSide, and back',
				);
			}

			const session = await Session.findById(input.sessionId)
				.populate('goalId')
				.lean();
			if (!session) {
				throw new Error('Session not found');
			}

			// Check if client is part of this session
			const isClient = session.clients_ids?.some(
				(clientId: mongoose.Types.ObjectId) =>
					clientId.toString() === userIdString,
			);

			if (!isClient && userRole !== 'admin') {
				throw new Error('Unauthorized: You are not part of this session');
			}

			// Check if goal is weight-related
			// If goalId is not populated, fetch it
			let goal = session.goalId as any;
			if (!goal || (!goal.goalType && !goal._id)) {
				// Goal not populated, fetch it
				if (session.goalId) {
					const goalId =
						session.goalId instanceof mongoose.Types.ObjectId
							? session.goalId
							: new mongoose.Types.ObjectId(String(session.goalId));
					goal = await Goal.findById(goalId).select('goalType title').lean();
				}
			}

			const isWeightRelated =
				goal &&
				goal.goalType &&
				(String(goal.goalType).trim() === 'Weight loss' ||
					String(goal.goalType).trim() === 'Muscle building');

			// Validate weight if goal is weight-related - THIS IS REQUIRED
			if (isWeightRelated) {
				if (
					!input.weight ||
					input.weight === null ||
					input.weight === undefined
				) {
					throw new Error(
						`Weight is required for weight-related goals. This session is associated with a "${goal.goalType}" goal, and weight tracking is mandatory.`,
					);
				}
				const weightNum = parseFloat(String(input.weight));
				if (isNaN(weightNum) || weightNum <= 0) {
					throw new Error(
						'Please enter a valid weight (must be greater than 0)',
					);
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
				if (input.notes !== undefined) sessionLog.notes = input.notes;
				await sessionLog.save();
			} else {
				// Create new log
				const logData: any = {
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
							select:
								'id title goalType description targetValue currentValue startDate targetDate client_id coach_id',
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

		confirmSessionCompletion: async (
			_: any,
			{ input }: { input: any },
			context: Context,
		) => {
			// Authorization: Only coaches can confirm session completion
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (userRole !== 'coach' && userRole !== 'admin') {
				throw new Error(
					'Unauthorized: Only coaches can confirm session completion',
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
					'Unauthorized: You cannot confirm completion for this session',
				);
			}

			const updatedLog = await SessionLog.findByIdAndUpdate(
				input.sessionLogId,
				{
					coachConfirmed: input.confirm,
				},
				{ new: true },
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
			context: Context,
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
				{ new: true },
			)
				.populate('session_id')
				.populate('coach_id', 'firstName lastName')
				.populate('client_id', 'firstName lastName')
				.lean();

			return mapSessionLogToGraphQL(updatedLog);
		},

		inviteClientsToClassSession: async (
			_: any,
			{ sessionId, clientIds }: { sessionId: string; clientIds: string[] },
			context: Context,
		) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (!userId || (userRole !== 'coach' && userRole !== 'admin')) {
				throw new Error('Unauthorized');
			}
			const session = await Session.findById(sessionId).lean();
			if (!session) throw new Error('Session not found');
			if (session.coach_id.toString() !== userId && userRole !== 'admin') {
				throw new Error('Unauthorized');
			}
			if (session.sessionKind !== 'group_class') {
				throw new Error('Not a group class session');
			}
			if (session.status !== 'scheduled') {
				throw new Error('Session is not open for invites');
			}
			const ids = clientIds.map((x) => String(x));
			await assertInviteUserIdsExist(ids);

			const doc = await Session.findById(sessionId);
			if (!doc) throw new Error('Session not found');
			for (const cid of ids) {
				const oid = new mongoose.Types.ObjectId(cid);
				const existing = (doc.enrollments || []).find(
					(e: any) => e.client_id.toString() === cid,
				);
				if (existing) {
					if (existing.status === 'accepted' || existing.status === 'invited') {
						continue;
					}
					if (existing.status === 'pending') {
						throw new Error(
							'Member already has a pending request for this class',
						);
					}
					if (
						existing.status === 'declined' ||
						existing.status === 'rejected'
					) {
						existing.status = 'invited';
						existing.createdAt = new Date();
					}
				} else {
					doc.enrollments = doc.enrollments || [];
					doc.enrollments.push({
						client_id: oid,
						status: 'invited',
						createdAt: new Date(),
					} as any);
				}
			}
			await doc.save();
			const out = await fetchSessionDocument(sessionId);
			return mapSessionToGraphQL(out);
		},

		requestToJoinClassSession: async (
			_: any,
			{ sessionId }: { sessionId: string },
			context: Context,
		) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (!userId || userRole !== 'member') {
				throw new Error('Unauthorized: Only members can request to join');
			}
			const session = await Session.findById(sessionId).lean();
			if (!session) throw new Error('Session not found');
			if (
				session.sessionKind !== 'group_class' ||
				session.status !== 'scheduled'
			) {
				throw new Error('This class is not available to join');
			}
			const cid = String(userId);
			const doc = await Session.findById(sessionId);
			if (!doc) throw new Error('Session not found');
			const existing = getEnrollmentForClient(doc, cid);
			if (existing) {
				if (
					existing.status === 'accepted' ||
					doc.clients_ids?.some((x: any) => x.toString() === cid)
				) {
					throw new Error('You are already in this class');
				}
				if (existing.status === 'invited') {
					throw new Error(
						'You have an invitation — accept it from your schedule',
					);
				}
				if (existing.status === 'pending') {
					throw new Error('Join request already pending');
				}
				if (existing.status === 'declined' || existing.status === 'rejected') {
					existing.status = 'pending';
					existing.createdAt = new Date();
				}
			} else {
				doc.enrollments = doc.enrollments || [];
				doc.enrollments.push({
					client_id: new mongoose.Types.ObjectId(cid),
					status: 'pending',
					createdAt: new Date(),
				} as any);
			}
			await doc.save();
			const out = await fetchSessionDocument(sessionId);
			return mapSessionToGraphQL(out);
		},

		respondToClassInvitation: async (
			_: any,
			{ sessionId, accept }: { sessionId: string; accept: boolean },
			context: Context,
		) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (!userId || userRole !== 'member') {
				throw new Error('Unauthorized');
			}
			const cid = String(userId);
			const doc = await Session.findById(sessionId);
			if (!doc) throw new Error('Session not found');
			if (doc.sessionKind !== 'group_class') {
				throw new Error('Not a group class');
			}
			const en = getEnrollmentForClient(doc, cid);
			if (!en || en.status !== 'invited') {
				throw new Error('No pending invitation for this class');
			}
			if (!accept) {
				en.status = 'declined';
				await doc.save();
				return mapSessionToGraphQL(await fetchSessionDocument(sessionId));
			}
			const max = doc.maxParticipants ?? 20;
			if (acceptedCount(doc) >= max) {
				throw new Error('This class is full');
			}
			en.status = 'accepted';
			const oid = new mongoose.Types.ObjectId(cid);
			if (!doc.clients_ids?.some((x: any) => x.toString() === cid)) {
				doc.clients_ids = doc.clients_ids || [];
				doc.clients_ids.push(oid);
			}
			await doc.save();
			return mapSessionToGraphQL(await fetchSessionDocument(sessionId));
		},

		coachRespondToJoinRequest: async (
			_: any,
			{
				sessionId,
				clientId,
				accept,
			}: { sessionId: string; clientId: string; accept: boolean },
			context: Context,
		) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (!userId || (userRole !== 'coach' && userRole !== 'admin')) {
				throw new Error('Unauthorized');
			}
			const doc = await Session.findById(sessionId);
			if (!doc) throw new Error('Session not found');
			if (doc.coach_id.toString() !== userId && userRole !== 'admin') {
				throw new Error('Unauthorized');
			}
			if (doc.sessionKind !== 'group_class') {
				throw new Error('Not a group class');
			}
			const cid = String(clientId);
			const en = getEnrollmentForClient(doc, cid);
			if (!en || en.status !== 'pending') {
				throw new Error('No pending join request for this member');
			}
			if (!accept) {
				en.status = 'rejected';
				await doc.save();
				return mapSessionToGraphQL(await fetchSessionDocument(sessionId));
			}
			const max = doc.maxParticipants ?? 20;
			if (acceptedCount(doc) >= max) {
				throw new Error(
					'Class is full — increase capacity or reject the request',
				);
			}
			en.status = 'accepted';
			const oid = new mongoose.Types.ObjectId(cid);
			if (!doc.clients_ids?.some((x: any) => x.toString() === cid)) {
				doc.clients_ids = doc.clients_ids || [];
				doc.clients_ids.push(oid);
			}
			await doc.save();
			return mapSessionToGraphQL(await fetchSessionDocument(sessionId));
		},

		removeClientFromClassSession: async (
			_: any,
			{ sessionId, clientId }: { sessionId: string; clientId: string },
			context: Context,
		) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (!userId || (userRole !== 'coach' && userRole !== 'admin')) {
				throw new Error('Unauthorized');
			}
			const doc = await Session.findById(sessionId);
			if (!doc) throw new Error('Session not found');
			if (doc.coach_id.toString() !== userId && userRole !== 'admin') {
				throw new Error('Unauthorized');
			}
			if (doc.sessionKind !== 'group_class') {
				throw new Error('Not a group class');
			}
			if (doc.status !== 'scheduled') {
				throw new Error('Cannot change roster for this session');
			}
			const cid = String(clientId);
			const en = getEnrollmentForClient(doc, cid);
			if (!en) {
				throw new Error('Member is not on this class');
			}
			doc.clients_ids = (doc.clients_ids || []).filter(
				(x: any) => x.toString() !== cid,
			);
			en.status = 'rejected';
			await doc.save();
			return mapSessionToGraphQL(await fetchSessionDocument(sessionId));
		},

		leaveClassSession: async (
			_: any,
			{ sessionId }: { sessionId: string },
			context: Context,
		) => {
			const userId = context.auth.user?.id;
			const userRole = context.auth.user?.role;
			if (!userId || userRole !== 'member') {
				throw new Error('Unauthorized: Only members can leave a class');
			}
			const doc = await Session.findById(sessionId);
			if (!doc) throw new Error('Session not found');
			if (doc.sessionKind !== 'group_class') {
				throw new Error('Not a group class');
			}
			if (doc.status !== 'scheduled') {
				throw new Error('You cannot leave this session anymore');
			}
			const cid = String(userId);
			const en = getEnrollmentForClient(doc, cid);
			if (!en) {
				throw new Error('You are not part of this class');
			}
			if (
				en.status !== 'accepted' &&
				en.status !== 'pending' &&
				en.status !== 'invited'
			) {
				throw new Error('Nothing to leave for this class');
			}
			doc.clients_ids = (doc.clients_ids || []).filter(
				(x: any) => x.toString() !== cid,
			);
			en.status = 'declined';
			await doc.save();
			return mapSessionToGraphQL(await fetchSessionDocument(sessionId));
		},
	},

	Session: {
		coach: async (parent: any) => {
			// If coach is already populated (object), return it
			if (
				parent.coach &&
				typeof parent.coach === 'object' &&
				parent.coach._id
			) {
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
		clients: async (parent: any) => {
			// If clients are already populated (array of objects), return them
			if (
				parent.clients &&
				Array.isArray(parent.clients) &&
				parent.clients.length > 0
			) {
				return parent.clients
					.filter((client: any) => client && client._id) // Filter out null/undefined clients
					.map((client: any) => {
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
					.filter((client: any) => client !== null); // Remove any null entries
			}

			// If clientsIds exist, fetch clients
			if (parent.clientsIds && parent.clientsIds.length > 0) {
				const clientsIds = parent.clientsIds
					.map((id: string) => {
						const idString = String(id);
						if (!mongoose.Types.ObjectId.isValid(idString)) {
							return null;
						}
						return new mongoose.Types.ObjectId(idString);
					})
					.filter((id: any) => id !== null);

				if (clientsIds.length === 0) {
					return [];
				}

				const clients = await User.find({
					_id: { $in: clientsIds },
				})
					.select('firstName lastName email')
					.lean();

				return clients
					.filter((client: any) => client && client._id) // Filter out null/undefined
					.map((client: any) => {
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
					.filter((client: any) => client !== null); // Remove any null entries
			}
			return [];
		},
		goal: async (parent: any) => {
			if (!parent.goalId) return null;

			// If goal is already populated (object), format it
			if (parent.goal && typeof parent.goal === 'object' && parent.goal._id) {
				// Handle populated goal object
				const goal = parent.goal;

				// Get client ID
				let clientId: string;
				if (goal.client_id) {
					if (goal.client_id._id) {
						clientId = goal.client_id._id.toString();
					} else if (goal.client_id instanceof mongoose.Types.ObjectId) {
						clientId = goal.client_id.toString();
					} else {
						clientId = String(goal.client_id);
					}
				} else {
					return null; // Invalid goal data
				}

				// Get coach ID
				let coachId: string | null = null;
				if (goal.coach_id) {
					if (goal.coach_id._id) {
						coachId = goal.coach_id._id.toString();
					} else if (goal.coach_id instanceof mongoose.Types.ObjectId) {
						coachId = goal.coach_id.toString();
					} else {
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
				if (!goal) return null;

				// Handle populated objects
				let clientId: string;
				if (goal.client_id) {
					if (goal.client_id._id) {
						clientId = goal.client_id._id.toString();
					} else if (goal.client_id instanceof mongoose.Types.ObjectId) {
						clientId = goal.client_id.toString();
					} else {
						clientId = String(goal.client_id);
					}
				} else {
					return null;
				}

				let coachId: string | null = null;
				if (goal.coach_id) {
					if (goal.coach_id._id) {
						coachId = goal.coach_id._id.toString();
					} else if (goal.coach_id instanceof mongoose.Types.ObjectId) {
						coachId = goal.coach_id.toString();
					} else {
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
		session: async (parent: any) => {
			if (typeof parent.session === 'string') {
				const session = await Session.findById(parent.session)
					.populate('coach_id', 'firstName lastName')
					.populate('clients_ids', 'firstName lastName email')
					.populate({
						path: 'enrollments.client_id',
						select: 'firstName lastName email',
					})
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
