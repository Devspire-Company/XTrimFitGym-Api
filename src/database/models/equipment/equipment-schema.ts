import mongoose, { Schema } from 'mongoose';

export type EquipmentStatusValue = 'AVAILABLE' | 'DAMAGED' | 'UNDERMAINTENANCE';

export interface IEquipment {
	_id?: mongoose.Types.ObjectId;
	name: string;
	imageUrl: string;
	description?: string;
	sortOrder?: number;
	status: EquipmentStatusValue;
	createdAt?: Date;
	updatedAt?: Date;
}

const equipmentSchema = new Schema(
	{
		name: { type: String, required: true, trim: true },
		imageUrl: { type: String, required: true },
		description: { type: String, trim: true },
		sortOrder: { type: Number, default: 0 },
		status: {
			type: String,
			enum: ['AVAILABLE', 'DAMAGED', 'UNDERMAINTENANCE'],
			default: 'AVAILABLE',
		},
	},
	{ timestamps: true }
);

equipmentSchema.index({ sortOrder: 1 });

const Equipment = mongoose.model<IEquipment>('Equipment', equipmentSchema);
export default Equipment;
