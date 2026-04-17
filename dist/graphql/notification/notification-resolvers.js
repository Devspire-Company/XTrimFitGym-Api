import mongoose from 'mongoose';
import Notification from '../../database/models/notification/notification-schema.js';
const mapNotification = (doc) => ({
    id: doc._id.toString(),
    recipientId: doc.recipientId?.toString?.() ?? String(doc.recipientId),
    recipientRole: doc.recipientRole,
    type: doc.type,
    title: doc.title,
    message: doc.message,
    dedupeKey: doc.dedupeKey,
    metadataJson: doc.metadataJson ?? null,
    isRead: !!doc.isRead,
    readAt: doc.readAt?.toISOString?.() ?? null,
    createdAt: doc.createdAt?.toISOString?.() ?? null,
    updatedAt: doc.updatedAt?.toISOString?.() ?? null,
});
export default {
    Query: {
        getMyNotifications: async (_, { limit, offset, unreadOnly, }, context) => {
            const userId = context.auth.user?.id;
            if (!userId)
                throw new Error('Unauthorized: Please log in');
            const lim = Math.min(Math.max(limit ?? 30, 1), 200);
            const off = Math.max(offset ?? 0, 0);
            const query = { recipientId: new mongoose.Types.ObjectId(userId) };
            if (unreadOnly)
                query.isRead = false;
            const rows = await Notification.find(query)
                .sort({ createdAt: -1 })
                .skip(off)
                .limit(lim)
                .lean();
            return rows.map(mapNotification);
        },
    },
    Mutation: {
        markNotificationRead: async (_, { id }, context) => {
            const userId = context.auth.user?.id;
            if (!userId)
                throw new Error('Unauthorized: Please log in');
            const updated = await Notification.findOneAndUpdate({ _id: id, recipientId: new mongoose.Types.ObjectId(userId) }, { $set: { isRead: true, readAt: new Date() } }, { new: true }).lean();
            if (!updated)
                throw new Error('Notification not found');
            return mapNotification(updated);
        },
        markAllMyNotificationsRead: async (_, __, context) => {
            const userId = context.auth.user?.id;
            if (!userId)
                throw new Error('Unauthorized: Please log in');
            await Notification.updateMany({ recipientId: new mongoose.Types.ObjectId(userId), isRead: false }, { $set: { isRead: true, readAt: new Date() } });
            return true;
        },
    },
};
