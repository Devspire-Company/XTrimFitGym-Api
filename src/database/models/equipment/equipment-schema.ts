import mongoose, { Schema } from 'mongoose';

export type EquipmentStatusValue = 'AVAILABLE' | 'DAMAGED' | 'UNDERMAINTENANCE';

export interface IEquipment {
	_id?: mongoose.Types.ObjectId;
	name: string;
	nameNormalized?: string;
	imageUrl: string;
	description?: string;
	notes?: string;
	acquiredAt?: Date;
	sortOrder?: number;
	status: EquipmentStatusValue;
	quantity: number;
	maintenanceStartedAt?: Date;
	isArchived?: boolean;
	archivedAt?: Date;
	archivedBy?: mongoose.Types.ObjectId;
	archiveReason?: string;
	lifecycleLogs?: Array<{
		action:
			| 'CREATED'
			| 'UPDATED'
			| 'STATUS_CHANGED'
			| 'STOCK_ADJUSTED'
			| 'ARCHIVED'
			| 'UNARCHIVED';
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
		nameNormalized: { type: String, required: true, trim: true, lowercase: true, index: true },
		imageUrl: { type: String, required: true },
		description: { type: String, trim: true },
		notes: { type: String, trim: true },
		acquiredAt: { type: Date },
		sortOrder: { type: Number, default: 0 },
		quantity: { type: Number, required: true, default: 0, min: 0 },
		status: {
			type: String,
			enum: ['AVAILABLE', 'DAMAGED', 'UNDERMAINTENANCE'],
			default: 'AVAILABLE',
		},
		maintenanceStartedAt: { type: Date },
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
					enum: [
						'CREATED',
						'UPDATED',
						'STATUS_CHANGED',
						'STOCK_ADJUSTED',
						'ARCHIVED',
						'UNARCHIVED',
					],
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
