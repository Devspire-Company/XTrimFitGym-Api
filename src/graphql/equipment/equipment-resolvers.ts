import Equipment from '../../database/models/equipment/equipment-schema.js';
import { IAuthContext } from '../../context/auth-context.js';
import mongoose from 'mongoose';

type Context = IAuthContext;

const normalizeStatus = (raw: unknown): 'AVAILABLE' | 'DAMAGED' | 'UNDERMAINTENANCE' => {
	const s = String(raw || 'AVAILABLE').toUpperCase();
	if (s === 'DAMAGED' || s === 'UNDERMAINTENANCE') return s;
	return 'AVAILABLE';
};

const normalizeEquipmentName = (raw: unknown): string => String(raw ?? '').trim().toLowerCase();

const normalizeQuantity = (raw: unknown, fieldName = 'quantity'): number => {
	if (raw === undefined || raw === null || raw === '') return 0;
	const parsed = Number(raw);
	if (!Number.isFinite(parsed) || parsed < 0) {
		throw new Error(`${fieldName} must be a non-negative number`);
	}
	return Math.floor(parsed);
};

const parseIsoDateOrNull = (raw: unknown): Date | null | undefined => {
	if (raw === undefined) return undefined;
	if (raw === null || raw === '') return null;
	const parsed = new Date(String(raw));
	if (!Number.isFinite(parsed.getTime())) return null;
	return parsed;
};

const mapEquipmentToGraphQL = (doc: any) => ({
	id: doc._id.toString(),
	name: doc.name,
	imageUrl: doc.imageUrl,
	description: doc.description ?? null,
	notes: doc.notes?.trim() ? doc.notes.trim() : null,
	acquiredAt: doc.acquiredAt?.toISOString?.() ?? null,
	sortOrder: doc.sortOrder ?? 0,
	status: normalizeStatus(doc.status),
	quantity: typeof doc.quantity === 'number' && doc.quantity >= 0 ? doc.quantity : 0,
	maintenanceStartedAt: doc.maintenanceStartedAt?.toISOString?.() ?? null,
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
});

const requireAdmin = (context: Context) => {
	if (context.auth.user?.role !== 'admin') {
		throw new Error('Unauthorized: Admin only');
	}
};

export default {
	Query: {
		getEquipments: async (
			_: any,
			{ includeArchived }: { includeArchived?: boolean },
			_context: Context
		) => {
			const query = includeArchived ? {} : { isArchived: { $ne: true } };
			const list = await Equipment.find(query)
				.sort({ sortOrder: 1, createdAt: 1 })
				.lean();
			return list.map(mapEquipmentToGraphQL);
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
			const normalizedName = normalizeEquipmentName(input.name);
			if (!normalizedName) throw new Error('Equipment name is required');
			const existingByName = await Equipment.findOne({
				nameNormalized: normalizedName,
			})
				.select('_id isArchived')
				.lean();
			if (existingByName) {
				throw new Error(
					existingByName.isArchived
						? 'Cannot create equipment with this name because it is archived. Restore the archived equipment instead.'
						: 'Equipment with this name already exists'
				);
			}
			const sortOrder =
				input.sortOrder ?? (await Equipment.countDocuments({})) ?? 0;
			const changedBy = context.auth.user?.id;
			const normalizedStatus = normalizeStatus(input.status ?? 'AVAILABLE');
			const quantity = normalizeQuantity(input.quantity, 'quantity');
			const parsedMaintenanceStartedAt = parseIsoDateOrNull(input.maintenanceStartedAt);
			const equipment = new Equipment({
				name: input.name?.trim(),
				nameNormalized: normalizedName,
				imageUrl: input.imageUrl?.trim(),
				description: input.description?.trim() || undefined,
				notes: input.notes?.trim() || undefined,
				acquiredAt: input.acquiredAt ? new Date(input.acquiredAt) : undefined,
				sortOrder,
				status: normalizedStatus,
				quantity,
				maintenanceStartedAt:
					normalizedStatus === 'UNDERMAINTENANCE'
						? parsedMaintenanceStartedAt ?? new Date()
						: null,
				lifecycleLogs: [
					{
						action: 'CREATED',
						notes: 'Equipment created',
						status: normalizedStatus,
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
			if (input.name !== undefined) {
				const normalizedName = normalizeEquipmentName(input.name);
				if (!normalizedName) throw new Error('Equipment name is required');
				const existingByName = await Equipment.findOne({
					nameNormalized: normalizedName,
					_id: { $ne: doc._id },
				})
					.select('_id isArchived')
					.lean();
				if (existingByName) {
					throw new Error(
						existingByName.isArchived
							? 'Cannot rename equipment to this archived name. Restore the archived equipment instead.'
							: 'Equipment with this name already exists'
					);
				}
				update.name = input.name.trim();
				update.nameNormalized = normalizedName;
			}
			if (input.imageUrl !== undefined) update.imageUrl = input.imageUrl.trim();
			if (input.description !== undefined)
				update.description = input.description?.trim() ?? null;
			if (input.notes !== undefined)
				update.notes = input.notes?.trim() ? input.notes.trim() : null;
			if (input.acquiredAt !== undefined)
				update.acquiredAt = input.acquiredAt ? new Date(input.acquiredAt) : null;
			if (input.sortOrder !== undefined) update.sortOrder = input.sortOrder;
			const nextStatus =
				input.status !== undefined ? normalizeStatus(input.status) : normalizeStatus(doc.status);
			const previousStatus = normalizeStatus(doc.status);
			if (input.status !== undefined) {
				update.status = nextStatus;
			}
			if (input.quantity !== undefined) {
				update.quantity = normalizeQuantity(input.quantity, 'quantity');
			}
			const parsedMaintenanceStartedAt = parseIsoDateOrNull(input.maintenanceStartedAt);
			if (parsedMaintenanceStartedAt !== undefined) {
				update.maintenanceStartedAt = parsedMaintenanceStartedAt;
			}
			if (nextStatus === 'UNDERMAINTENANCE') {
				if (update.maintenanceStartedAt === undefined && !doc.maintenanceStartedAt) {
					update.maintenanceStartedAt = new Date();
				}
			} else {
				update.maintenanceStartedAt = null;
			}
			const prevQuantity = typeof doc.quantity === 'number' && doc.quantity >= 0 ? doc.quantity : 0;
			const nextQuantity =
				typeof update.quantity === 'number' ? update.quantity : prevQuantity;
			const lifecycleAction =
				input.status !== undefined && nextStatus !== previousStatus
					? 'STATUS_CHANGED'
					: input.quantity !== undefined && nextQuantity !== prevQuantity
						? 'STOCK_ADJUSTED'
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
									? nextStatus
									: previousStatus,
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
		adjustEquipmentStock: async (_: any, { input }: { input: any }, context: Context) => {
			requireAdmin(context);
			const change = Number(input?.change);
			if (!Number.isInteger(change) || change === 0) {
				throw new Error('Stock change must be a non-zero integer');
			}
			const doc = await Equipment.findById(input.id).lean();
			if (!doc) throw new Error('Equipment not found');
			const currentQty = typeof doc.quantity === 'number' && doc.quantity >= 0 ? doc.quantity : 0;
			const nextQty = currentQty + change;
			if (nextQty < 0) {
				throw new Error('Stock adjustment cannot make quantity below zero');
			}
			const changedBy = context.auth.user?.id;
			const reason = String(input.reason ?? '').trim();
			const updated = await Equipment.findByIdAndUpdate(
				input.id,
				{
					$set: { quantity: nextQty },
					$push: {
						lifecycleLogs: {
							action: 'STOCK_ADJUSTED',
							notes: reason || `Stock adjusted by ${change > 0 ? '+' : ''}${change}`,
							status: normalizeStatus(doc.status),
							...(changedBy ? { changedBy: new mongoose.Types.ObjectId(changedBy) } : {}),
						},
					},
				},
				{ new: true }
			).lean();
			if (!updated) throw new Error('Failed to adjust stock');
			return mapEquipmentToGraphQL(updated);
		},
	},
};
