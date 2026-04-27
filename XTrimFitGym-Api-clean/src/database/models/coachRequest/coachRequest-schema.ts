import mongoose, { Schema } from 'mongoose';

export type CoachRequestStatusType = 'pending' | 'approved' | 'denied';

export interface ICoachRequest {
	client_id: mongoose.Types.ObjectId;
	coach_id: mongoose.Types.ObjectId;
	status: CoachRequestStatusType;
	message?: string;
}

const coachRequestSchema = new Schema(
	{
		client_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		coach_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		status: {
			type: String,
			enum: ['pending', 'approved', 'denied'],
			default: 'pending',
			required: true,
		},
		message: String,
	},
	{ timestamps: true }
);

// Index to prevent duplicate pending requests
coachRequestSchema.index(
	{ client_id: 1, coach_id: 1, status: 1 },
	{
		unique: true,
		partialFilterExpression: { status: 'pending' },
	}
);

const CoachRequest = mongoose.model<ICoachRequest>(
	'CoachRequest',
	coachRequestSchema
);

export default CoachRequest;

