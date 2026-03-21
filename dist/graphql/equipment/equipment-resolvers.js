import Equipment from '../../database/models/equipment/equipment-schema.js';
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
    sortOrder: doc.sortOrder ?? 0,
    status: normalizeStatus(doc.status),
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
        getEquipments: async (_, __, _context) => {
            const list = await Equipment.find({})
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
            const equipment = new Equipment({
                name: input.name?.trim(),
                imageUrl: input.imageUrl?.trim(),
                description: input.description?.trim() || undefined,
                notes: input.notes?.trim() || undefined,
                sortOrder,
                status: normalizeStatus(input.status ?? 'AVAILABLE'),
            });
            await equipment.save();
            return mapEquipmentToGraphQL(equipment.toObject());
        },
        updateEquipment: async (_, { id, input }, context) => {
            requireAdmin(context);
            const doc = await Equipment.findById(id).lean();
            if (!doc)
                throw new Error('Equipment not found');
            const update = {};
            if (input.name !== undefined)
                update.name = input.name.trim();
            if (input.imageUrl !== undefined)
                update.imageUrl = input.imageUrl.trim();
            if (input.description !== undefined)
                update.description = input.description?.trim() ?? null;
            if (input.notes !== undefined)
                update.notes = input.notes?.trim() ? input.notes.trim() : null;
            if (input.sortOrder !== undefined)
                update.sortOrder = input.sortOrder;
            if (input.status !== undefined)
                update.status = normalizeStatus(input.status);
            const updated = await Equipment.findByIdAndUpdate(id, update, { new: true }).lean();
            if (!updated)
                throw new Error('Failed to update equipment');
            return mapEquipmentToGraphQL(updated);
        },
        deleteEquipment: async (_, { id }, context) => {
            requireAdmin(context);
            const doc = await Equipment.findByIdAndDelete(id);
            if (!doc)
                throw new Error('Equipment not found');
            return true;
        },
    },
};
