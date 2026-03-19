import mongoose, { Schema } from 'mongoose';

export interface IEquipment {
	_id?: mongoose.Types.ObjectId;
	name: string;
	imageUrl: string;
	description?: string;
	sortOrder?: number;
	createdAt?: Date;
	updatedAt?: Date;
}

const equipmentSchema = new Schema(
	{
		name: { type: String, required: true, trim: true },
		imageUrl: { type: String, required: true },
		description: { type: String, trim: true },
		sortOrder: { type: Number, default: 0 },
	},
	{ timestamps: true }
);

equipmentSchema.index({ sortOrder: 1 });

const Equipment = mongoose.model<IEquipment>('Equipment', equipmentSchema);
export default Equipment;
