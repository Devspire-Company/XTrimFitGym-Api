import mongoose, { Schema } from 'mongoose';

export interface ISessionLog {
	_id?: mongoose.Types.ObjectId;
	session_id: mongoose.Types.ObjectId;
	client_id: mongoose.Types.ObjectId;
	coach_id: mongoose.Types.ObjectId;
	weight: number; // Weight entered by client at end of session
	clientConfirmed: boolean; // Client confirmed they entered weight
	coachConfirmed: boolean; // Coach confirmed the session completion
	notes?: string; // Additional notes about the session
	completedAt?: Date; // When the session was completed
	createdAt?: Date;
	updatedAt?: Date;
}

const sessionLogSchema = new Schema(
	{
		session_id: {
			type: mongoose.SchemaTypes.ObjectId,
			ref: 'Session',
			required: true,
		},
		client_id: {
			type: mongoose.SchemaTypes.ObjectId,
			ref: 'User',
			required: true,
		},
		coach_id: {
			type: mongoose.SchemaTypes.ObjectId,
			ref: 'User',
			required: true,
		},
		weight: {
			type: Number,
			required: true,
		},
		clientConfirmed: {
			type: Boolean,
			default: false,
		},
		coachConfirmed: {
			type: Boolean,
			default: false,
		},
		notes: String,
		completedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{
		timestamps: true,
	}
);

const SessionLog = mongoose.model<ISessionLog>(
	'SessionLog',
	sessionLogSchema
);

export default SessionLog;

