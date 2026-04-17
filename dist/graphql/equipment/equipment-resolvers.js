import Equipment from '../../database/models/equipment/equipment-schema.js';
import mongoose from 'mongoose';
const normalizeStatus = (raw) => {
    const s = String(raw || 'AVAILABLE').toUpperCase();
    if (s === 'DAMAGED' || s === 'UNDERMAINTENANCE')
        return s;
    return 'AVAILABLE';
};
const mapEquipmentToGraphQL = (doc) => ({
    id: doc._id.toString(),
    name: doc.name,
    imageUrl: doc.imageUrl,
    description: doc.description ?? null,
    notes: doc.notes?.trim() ? doc.notes.trim() : null,
    acquiredAt: doc.acquiredAt?.toISOString?.() ?? null,
    sortOrder: doc.sortOrder ?? 0,
    status: normalizeStatus(doc.status),
    isArchived: !!doc.isArchived,
    archivedAt: doc.archivedAt?.toISOString?.() ?? null,
    archiveReason: doc.archiveReason ?? null,
    lifecycleLogs: (doc.lifecycleLogs ?? []).map((row) => ({
        action: row.action,
        notes: row.notes ?? null,
        status: row.status ? normalizeStatus(row.status) : null,
        changedAt: row.changedAt?.toISOString?.() ?? new Date().toISOString(),
        changedById: row.changedBy?.toString?.() ?? null,
    })),
    createdAt: doc.createdAt?.toISOString() ?? null,
    updatedAt: doc.updatedAt?.toISOString() ?? null,
});
const requireAdmin = (context) => {
    if (context.auth.user?.role !== 'admin') {
        throw new Error('Unauthorized: Admin only');
    }
};
export default {
    Query: {
        getEquipments: async (_, { includeArchived }, _context) => {
            const query = includeArchived ? {} : { isArchived: { $ne: true } };
            const list = await Equipment.find(query)
                .sort({ sortOrder: 1, createdAt: 1 })
                .lean();
            return list.map(mapEquipmentToGraphQL);
        },
        getEquipment: async (_, { id }, _context) => {
            const doc = await Equipment.findById(id).lean();
            if (!doc)
                return null;
            return mapEquipmentToGraphQL(doc);
        },
    },
    Mutation: {
        createEquipment: async (_, { input }, context) => {
            requireAdmin(context);
            const sortOrder = input.sortOrder ?? (await Equipment.countDocuments({})) ?? 0;
            const changedBy = context.auth.user?.id;
            const equipment = new Equipment({
                name: input.name?.trim(),
                imageUrl: input.imageUrl?.trim(),
                description: input.description?.trim() || undefined,
                notes: input.notes?.trim() || undefined,
                acquiredAt: input.acquiredAt ? new Date(input.acquiredAt) : undefined,
                sortOrder,
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
        updateEquipment: async (_, { id, input }, context) => {
            requireAdmin(context);
            const doc = await Equipment.findById(id).lean();
            if (!doc)
                throw new Error('Equipment not found');
            const changedBy = context.auth.user?.id;
            const update = {};
            if (input.name !== undefined)
                update.name = input.name.trim();
            if (input.imageUrl !== undefined)
                update.imageUrl = input.imageUrl.trim();
            if (input.description !== undefined)
                update.description = input.description?.trim() ?? null;
            if (input.notes !== undefined)
                update.notes = input.notes?.trim() ? input.notes.trim() : null;
            if (input.acquiredAt !== undefined)
                update.acquiredAt = input.acquiredAt ? new Date(input.acquiredAt) : null;
            if (input.sortOrder !== undefined)
                update.sortOrder = input.sortOrder;
            if (input.status !== undefined)
                update.status = normalizeStatus(input.status);
            const lifecycleAction = input.status !== undefined && normalizeStatus(input.status) !== normalizeStatus(doc.status)
                ? 'STATUS_CHANGED'
                : 'UPDATED';
            const updated = await Equipment.findByIdAndUpdate(id, {
                $set: update,
                $push: {
                    lifecycleLogs: {
                        action: lifecycleAction,
                        notes: input.notes?.trim() || 'Equipment updated',
                        status: input.status !== undefined
                            ? normalizeStatus(input.status)
                            : normalizeStatus(doc.status),
                        ...(changedBy
                            ? { changedBy: new mongoose.Types.ObjectId(changedBy) }
                            : {}),
                    },
                },
            }, { new: true }).lean();
            if (!updated)
                throw new Error('Failed to update equipment');
            return mapEquipmentToGraphQL(updated);
        },
        deleteEquipment: async (_, { id }, context) => {
            requireAdmin(context);
            const userId = context.auth.user?.id;
            const doc = await Equipment.findByIdAndUpdate(id, {
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
            }, { new: true });
            if (!doc)
                throw new Error('Equipment not found');
            return true;
        },
        archiveEquipment: async (_, { id, reason }, context) => {
            requireAdmin(context);
            if (!reason?.trim())
                throw new Error('Archive reason is required');
            const userId = context.auth.user?.id;
            const updated = await Equipment.findByIdAndUpdate(id, {
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
            }, { new: true }).lean();
            if (!updated)
                throw new Error('Equipment not found');
            return mapEquipmentToGraphQL(updated);
        },
        unarchiveEquipment: async (_, { id }, context) => {
            requireAdmin(context);
            const userId = context.auth.user?.id;
            const updated = await Equipment.findByIdAndUpdate(id, {
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
            }, { new: true }).lean();
            if (!updated)
                throw new Error('Equipment not found');
            return mapEquipmentToGraphQL(updated);
        },
    },
};
