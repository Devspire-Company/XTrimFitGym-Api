import mongoose, { Schema } from 'mongoose';

const SETTINGS_KEY = 'default';

export interface IGymSettings {
	_id?: mongoose.Types.ObjectId;
	key: string;
	walkInTimeInPaymentPesos: number;
	createdAt?: Date;
	updatedAt?: Date;
}

const gymSettingsSchema = new Schema(
	{
		key: { type: String, required: true, unique: true, default: SETTINGS_KEY },
		walkInTimeInPaymentPesos: {
			type: Number,
			required: true,
			default: 60,
			min: 0,
		},
	},
	{ timestamps: true },
);

const GymSettings =
	(mongoose.models.GymSettings as mongoose.Model<IGymSettings>) ||
	mongoose.model<IGymSettings>('GymSettings', gymSettingsSchema);

export const WALK_IN_DEFAULT_PAYMENT_PESOS = 60;

export async function getWalkInTimeInPaymentPesos(): Promise<number> {
	const doc = await GymSettings.findOne({ key: SETTINGS_KEY }).lean();
	if (!doc) return WALK_IN_DEFAULT_PAYMENT_PESOS;
	return Number(doc.walkInTimeInPaymentPesos);
}

export async function setWalkInTimeInPaymentPesos(pesos: number): Promise<number> {
	const n = Math.max(0, Number(pesos));
	if (!Number.isFinite(n)) {
		throw new Error('Invalid payment amount');
	}
	const doc = await GymSettings.findOneAndUpdate(
		{ key: SETTINGS_KEY },
		{ $set: { walkInTimeInPaymentPesos: n } },
		{ upsert: true, new: true },
	).lean();
	return doc!.walkInTimeInPaymentPesos;
}

export { GymSettings, SETTINGS_KEY };
