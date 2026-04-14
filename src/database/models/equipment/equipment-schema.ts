import mongoose, { Schema } from 'mongoose';

export type EquipmentStatusValue = 'AVAILABLE' | 'DAMAGED' | 'UNDERMAINTENANCE';

export interface IEquipment {
	_id?: mongoose.Types.ObjectId;
	name: string;
	imageUrl: string;
	description?: string;
	notes?: string;
	acquiredAt?: Date;
	sortOrder?: number;
	status: EquipmentStatusValue;
	isArchived?: boolean;
	archivedAt?: Date;
	archivedBy?: mongoose.Types.ObjectId;
	archiveReason?: string;
	lifecycleLogs?: Array<{
		action: 'CREATED' | 'UPDATED' | 'STATUS_CHANGED' | 'ARCHIVED' | 'UNARCHIVED';
		notes?: string;
		status?: EquipmentStatusValue;
		changedAt: Date;
		changedBy?: mongoose.Types.ObjectId;
	}>;
	createdAt?: Date;
	updatedAt?: Date;
}

const equipmentSchema = new Schema(
	{
		name: { type: String, required: true, trim: true },
		imageUrl: { type: String, required: true },
		description: { type: String, trim: true },
		notes: { type: String, trim: true },
		acquiredAt: { type: Date },
		sortOrder: { type: Number, default: 0 },
		status: {
			type: String,
			enum: ['AVAILABLE', 'DAMAGED', 'UNDERMAINTENANCE'],
			default: 'AVAILABLE',
		},
		isArchived: { type: Boolean, default: false, index: true },
		archivedAt: Date,
		archivedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		archiveReason: { type: String, trim: true },
		lifecycleLogs: [
			{
				action: {
					type: String,
					enum: ['CREATED', 'UPDATED', 'STATUS_CHANGED', 'ARCHIVED', 'UNARCHIVED'],
					required: true,
				},
				notes: String,
				status: {
					type: String,
					enum: ['AVAILABLE', 'DAMAGED', 'UNDERMAINTENANCE'],
				},
				changedAt: { type: Date, default: Date.now },
				changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
			},
		],
	},
	{ timestamps: true }
);

equipmentSchema.index({ sortOrder: 1 });

const Equipment =
	(mongoose.models.Equipment as mongoose.Model<IEquipment>) ||
	mongoose.model<IEquipment>('Equipment', equipmentSchema);
export default Equipment;
