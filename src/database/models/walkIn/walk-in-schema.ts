import mongoose, { Schema } from 'mongoose';

export type WalkInGenderValue =
	| 'MALE'
	| 'FEMALE'
	| 'NON_BINARY'
	| 'PREFER_NOT_TO_SAY';

export interface IWalkInClient {
	_id?: mongoose.Types.ObjectId;
	firstName: string;
	middleName?: string;
	lastName: string;
	phoneNumber?: string;
	email?: string;
	gender: WalkInGenderValue;
	notes?: string;
	createdByAdminId?: mongoose.Types.ObjectId;
	createdAt?: Date;
	updatedAt?: Date;
}

const walkInClientSchema = new Schema(
	{
		firstName: { type: String, required: true, trim: true },
		middleName: { type: String, trim: true },
		lastName: { type: String, required: true, trim: true },
		phoneNumber: { type: String, trim: true },
		email: { type: String, trim: true, lowercase: true },
		gender: {
			type: String,
			enum: ['MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY'],
			required: true,
		},
		notes: { type: String, trim: true },
		createdByAdminId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
	},
	{ timestamps: true },
);

walkInClientSchema.index({ lastName: 1, firstName: 1 });
walkInClientSchema.index({ email: 1 }, { sparse: true });

export interface IWalkInAttendanceLog {
	_id?: mongoose.Types.ObjectId;
	walkInClientId: mongoose.Types.ObjectId;
	timedInAt: Date;
	/** YYYY-MM-DD in Asia/Manila */
	localDate: string;
	createdByAdminId?: mongoose.Types.ObjectId;
	createdAt?: Date;
	updatedAt?: Date;
}

const walkInAttendanceLogSchema = new Schema(
	{
		walkInClientId: {
			type: Schema.Types.ObjectId,
			ref: 'WalkInClient',
			required: true,
		},
		timedInAt: { type: Date, required: true },
		localDate: { type: String, required: true },
		createdByAdminId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
	},
	{ timestamps: true },
);

walkInAttendanceLogSchema.index({ localDate: 1, timedInAt: -1 });
walkInAttendanceLogSchema.index({ walkInClientId: 1, timedInAt: -1 });

const WalkInClient = mongoose.model<IWalkInClient>(
	'WalkInClient',
	walkInClientSchema,
);
const WalkInAttendanceLog = mongoose.model<IWalkInAttendanceLog>(
	'WalkInAttendanceLog',
	walkInAttendanceLogSchema,
);

export { WalkInClient, WalkInAttendanceLog };
