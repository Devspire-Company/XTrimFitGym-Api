import mongoose, { Schema } from 'mongoose';

export type NotificationTypeValue = 'INACTIVITY' | 'MEMBERSHIP_EXPIRING';

export interface INotification {
	_id?: mongoose.Types.ObjectId;
	recipientId: mongoose.Types.ObjectId;
	recipientRole: 'admin' | 'coach' | 'member';
	type: NotificationTypeValue;
	title: string;
	message: string;
	dedupeKey: string;
	metadataJson?: string;
	isRead?: boolean;
	readAt?: Date;
	createdAt?: Date;
	updatedAt?: Date;
}

const notificationSchema = new Schema(
	{
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
	},
	{ timestamps: true }
);

notificationSchema.index({ recipientId: 1, createdAt: -1 });

const Notification =
	(mongoose.models.Notification as mongoose.Model<INotification>) ||
	mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
