import Equipment from '../../database/models/equipment/equipment-schema.js';
import Session from '../../database/models/session/session-schema.js';
import { IAuthContext } from '../../context/auth-context.js';
import mongoose from 'mongoose';

type Context = IAuthContext;

const formatCoachName = (coach: any): string | null => {
	if (!coach) return null;
	const first = String(coach.firstName || '').trim();
	const last = String(coach.lastName || '').trim();
	const full = `${first} ${last}`.trim();
	return full || null;
};

const normalizeStatus = (raw: unknown): 'AVAILABLE' | 'DAMAGED' | 'UNDERMAINTENANCE' => {
	const s = String(raw || 'AVAILABLE').toUpperCase();
	if (s === 'DAMAGED' || s === 'UNDERMAINTENANCE') return s;
	return 'AVAILABLE';
};

const parseTimeToMinutes = (raw: string): number => {
	const value = String(raw || '').trim().toUpperCase();
	const m = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
	if (!m) throw new Error(`Invalid time format: ${raw}`);
	let hours = parseInt(m[1], 10);
	const minutes = parseInt(m[2], 10);
	if (m[3] === 'AM' && hours === 12) hours = 0;
	if (m[3] === 'PM' && hours !== 12) hours += 12;
	return hours * 60 + minutes;
};

const overlaps = (startA: number, endA: number, startB: number, endB: number) =>
	startA < endB && startB < endA;

const mapEquipmentToGraphQL = (
	doc: any,
	opts?: { checkStartMinutes?: number; checkEndMinutes?: number; usages?: any[]; windowLabel?: string }
) => {
	const relevantUsages = (opts?.usages || []).filter(
		(row) => row.equipmentId === doc._id.toString()
	);
	let reservedQuantityInWindow = 0;
	if (
		typeof opts?.checkStartMinutes === 'number' &&
		typeof opts?.checkEndMinutes === 'number'
	) {
		for (const slot of relevantUsages) {
			if (
				overlaps(
					opts.checkStartMinutes,
					opts.checkEndMinutes,
					slot.startMinutes,
					slot.endMinutes
				)
			) {
				reservedQuantityInWindow += slot.quantity;
			}
		}
	}
	return ({
	id: doc._id.toString(),
	name: doc.name,
	imageUrl: doc.imageUrl,
	description: doc.description ?? null,
	notes: doc.notes?.trim() ? doc.notes.trim() : null,
	acquiredAt: doc.acquiredAt?.toISOString?.() ?? null,
	sortOrder: doc.sortOrder ?? 0,
	quantity: Math.max(0, Number(doc.quantity ?? 0)),
	maintenanceStartedAt: doc.maintenanceStartedAt?.toISOString?.() ?? null,
	status: normalizeStatus(doc.status),
	isArchived: !!doc.isArchived,
	archivedAt: doc.archivedAt?.toISOString?.() ?? null,
	archiveReason: doc.archiveReason ?? null,
	lifecycleLogs: (doc.lifecycleLogs ?? []).map((row: any) => ({
		action: row.action,
		notes: row.notes ?? null,
		status: row.status ? normalizeStatus(row.status) : null,
		changedAt: row.changedAt?.toISOString?.() ?? new Date().toISOString(),
		changedById: row.changedBy?.toString?.() ?? null,
	})),
	createdAt: doc.createdAt?.toISOString() ?? null,
	updatedAt: doc.updatedAt?.toISOString() ?? null,
	isReservedInWindow: reservedQuantityInWindow > 0,
	reservedQuantityInWindow,
	reservationWindowLabel: opts?.windowLabel ?? null,
	upcomingUsages: relevantUsages.slice(0, 5).map((slot) => ({
		sessionId: slot.sessionId,
		sessionName: slot.sessionName,
		coachName: slot.coachName || null,
		date: slot.date,
		startTime: slot.startTime,
		endTime: slot.endTime || null,
		quantity: slot.quantity,
	})),
});
};

const requireAdmin = (context: Context) => {
	if (context.auth.user?.role !== 'admin') {
		throw new Error('Unauthorized: Admin only');
	}
};

export default {
	Query: {
		getEquipments: async (
			_: any,
			{
				includeArchived,
				checkDate,
				checkStartTime,
				checkEndTime,
			}: {
				includeArchived?: boolean;
				checkDate?: string;
				checkStartTime?: string;
				checkEndTime?: string;
			},
			_context: Context
		) => {
			const query = includeArchived ? {} : { isArchived: { $ne: true } };
			const list = await Equipment.find(query)
				.sort({ sortOrder: 1, createdAt: 1 })
				.lean();
			let checkStartMinutes: number | undefined;
			let checkEndMinutes: number | undefined;
			let windowLabel: string | undefined;
			const hasCustomWindow = !!(checkDate && checkStartTime);
			if (hasCustomWindow) {
				checkStartMinutes = parseTimeToMinutes(String(checkStartTime));
				checkEndMinutes = parseTimeToMinutes(
					String(checkEndTime || checkStartTime)
				);
				if (checkEndMinutes <= checkStartMinutes) {
					checkEndMinutes = checkStartMinutes + 60;
				}
				windowLabel = `${checkDate} ${checkStartTime}${checkEndTime ? ` - ${checkEndTime}` : ''}`;
			} else {
				const now = new Date();
				const h = now.getHours();
				const m = now.getMinutes();
				checkStartMinutes = h * 60 + m;
				checkEndMinutes = checkStartMinutes + 1;
				windowLabel = `${now.toISOString()} (current minute)`;
				checkDate = now.toISOString();
			}
			const baseDate = new Date(String(checkDate));
			const dayStart = new Date(baseDate);
			dayStart.setHours(0, 0, 0, 0);
			const dayEnd = new Date(dayStart);
			dayEnd.setDate(dayEnd.getDate() + 1);

			const daySessions = await Session.find({
				status: 'scheduled',
				date: { $gte: dayStart, $lt: dayEnd },
				equipmentReservations: { $exists: true, $ne: [] },
			})
				.select('name date startTime endTime coach_id equipmentReservations')
				.populate('coach_id', 'firstName lastName')
				.lean();
			const usages = (daySessions as any[]).flatMap((session) =>
				(session.equipmentReservations || []).map((slot: any) => {
					const coachName = formatCoachName(session.coach_id);
					const sessionName = coachName
						? `${session.name || 'Session'} (Coach: ${coachName})`
						: session.name || 'Session';
					return ({
					sessionId: session._id.toString(),
					sessionName,
					coachName,
					date: session.date?.toISOString?.() || new Date(session.date).toISOString(),
					equipmentId: slot.equipment_id?.toString?.() || String(slot.equipment_id || ''),
					startTime: slot.reservedStartTime || session.startTime,
					endTime: slot.reservedEndTime || session.endTime || null,
					startMinutes: parseTimeToMinutes(slot.reservedStartTime || session.startTime),
					endMinutes: parseTimeToMinutes(
						slot.reservedEndTime || session.endTime || slot.reservedStartTime || session.startTime
					),
					quantity: Math.max(1, Number(slot.quantity || 1)),
				});
				})
			);
			return list.map((doc) =>
				mapEquipmentToGraphQL(doc, {
					checkStartMinutes,
					checkEndMinutes,
					usages,
					windowLabel,
				})
			);
		},

		getEquipment: async (_: any, { id }: { id: string }, _context: Context) => {
			const doc = await Equipment.findById(id).lean();
			if (!doc) return null;
			return mapEquipmentToGraphQL(doc);
		},
	},

	Mutation: {
		createEquipment: async (
			_: any,
			{ input }: { input: any },
			context: Context
		) => {
			requireAdmin(context);
			const sortOrder =
				input.sortOrder ?? (await Equipment.countDocuments({})) ?? 0;
			const changedBy = context.auth.user?.id;
			const equipment = new Equipment({
				name: input.name?.trim(),
				imageUrl: input.imageUrl?.trim(),
				description: input.description?.trim() || undefined,
				notes: input.notes?.trim() || undefined,
				acquiredAt: input.acquiredAt ? new Date(input.acquiredAt) : undefined,
				sortOrder,
				quantity: Math.max(0, Number(input.quantity ?? 1)),
				maintenanceStartedAt:
					normalizeStatus(input.status ?? 'AVAILABLE') === 'UNDERMAINTENANCE'
						? new Date()
						: undefined,
				status: normalizeStatus(input.status ?? 'AVAILABLE'),
				lifecycleLogs: [
					{
						action: 'CREATED',
						notes: 'Equipment created',
						status: normalizeStatus(input.status ?? 'AVAILABLE'),
						...(changedBy ? { changedBy: new mongoose.Types.ObjectId(changedBy) } : {}),
					},
				],
			});
			await equipment.save();
			return mapEquipmentToGraphQL(equipment.toObject());
		},

		updateEquipment: async (
			_: any,
			{ id, input }: { id: string; input: any },
			context: Context
		) => {
			requireAdmin(context);
			const doc = await Equipment.findById(id).lean();
			if (!doc) throw new Error('Equipment not found');
			const changedBy = context.auth.user?.id;
			const update: any = {};
			if (input.name !== undefined) update.name = input.name.trim();
			if (input.imageUrl !== undefined) update.imageUrl = input.imageUrl.trim();
			if (input.description !== undefined)
				update.description = input.description?.trim() ?? null;
			if (input.notes !== undefined)
				update.notes = input.notes?.trim() ? input.notes.trim() : null;
			if (input.acquiredAt !== undefined)
				update.acquiredAt = input.acquiredAt ? new Date(input.acquiredAt) : null;
			if (input.sortOrder !== undefined) update.sortOrder = input.sortOrder;
			if (input.status !== undefined) update.status = normalizeStatus(input.status);
			if (input.quantity !== undefined) update.quantity = Math.max(0, Number(input.quantity));
			if (input.status !== undefined) {
				const nextStatus = normalizeStatus(input.status);
				if (nextStatus === 'UNDERMAINTENANCE') {
					update.maintenanceStartedAt = new Date();
				} else {
					update.maintenanceStartedAt = null;
				}
			}
			const lifecycleAction =
				input.status !== undefined && normalizeStatus(input.status) !== normalizeStatus(doc.status)
					? 'STATUS_CHANGED'
					: 'UPDATED';
			const updated = await Equipment.findByIdAndUpdate(
				id,
				{
					$set: update,
					$push: {
						lifecycleLogs: {
							action: lifecycleAction,
							notes: input.notes?.trim() || 'Equipment updated',
							status:
								input.status !== undefined
									? normalizeStatus(input.status)
									: normalizeStatus(doc.status),
							...(changedBy
								? { changedBy: new mongoose.Types.ObjectId(changedBy) }
								: {}),
						},
					},
				},
				{ new: true }
			).lean();
			if (!updated) throw new Error('Failed to update equipment');
			return mapEquipmentToGraphQL(updated);
		},

		deleteEquipment: async (
			_: any,
			{ id }: { id: string },
			context: Context
		) => {
			requireAdmin(context);
			const userId = context.auth.user?.id;
			const doc = await Equipment.findByIdAndUpdate(
				id,
				{
					$set: {
						isArchived: true,
						archivedAt: new Date(),
						archiveReason: 'Archived via delete action',
						...(userId ? { archivedBy: new mongoose.Types.ObjectId(userId) } : {}),
					},
					$push: {
						lifecycleLogs: {
							action: 'ARCHIVED',
							notes: 'Archived via delete action',
							...(userId
								? { changedBy: new mongoose.Types.ObjectId(userId) }
								: {}),
						},
					},
				},
				{ new: true }
			);
			if (!doc) throw new Error('Equipment not found');
			return true;
		},
		archiveEquipment: async (_: any, { id, reason }: { id: string; reason: string }, context: Context) => {
			requireAdmin(context);
			if (!reason?.trim()) throw new Error('Archive reason is required');
			const userId = context.auth.user?.id;
			const updated = await Equipment.findByIdAndUpdate(
				id,
				{
					$set: {
						isArchived: true,
						archivedAt: new Date(),
						archiveReason: reason.trim(),
						...(userId ? { archivedBy: new mongoose.Types.ObjectId(userId) } : {}),
					},
					$push: {
						lifecycleLogs: {
							action: 'ARCHIVED',
							notes: reason.trim(),
							...(userId
								? { changedBy: new mongoose.Types.ObjectId(userId) }
								: {}),
						},
					},
				},
				{ new: true }
			).lean();
			if (!updated) throw new Error('Equipment not found');
			return mapEquipmentToGraphQL(updated);
		},
		unarchiveEquipment: async (_: any, { id }: { id: string }, context: Context) => {
			requireAdmin(context);
			const userId = context.auth.user?.id;
			const updated = await Equipment.findByIdAndUpdate(
				id,
				{
					$set: { isArchived: false },
					$unset: { archivedAt: '', archivedBy: '', archiveReason: '' },
					$push: {
						lifecycleLogs: {
							action: 'UNARCHIVED',
							notes: 'Equipment restored from archive',
							...(userId
								? { changedBy: new mongoose.Types.ObjectId(userId) }
								: {}),
						},
					},
				},
				{ new: true }
			).lean();
			if (!updated) throw new Error('Equipment not found');
			return mapEquipmentToGraphQL(updated);
		},
	},
};
