import mongoose, { Schema } from 'mongoose';
const notificationSchema = new Schema({
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    recipientRole: {
        type: String,
        enum: ['admin', 'coach', 'member'],
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: ['INACTIVITY', 'MEMBERSHIP_EXPIRING'],
        required: true,
        index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    dedupeKey: { type: String, required: true, unique: true, index: true },
    metadataJson: { type: String },
    isRead: { type: Boolean, default: false, index: true },
    readAt: Date,
}, { timestamps: true });
notificationSchema.index({ recipientId: 1, createdAt: -1 });
const Notification = mongoose.models.Notification ||
    mongoose.model('Notification', notificationSchema);
export default Notification;
