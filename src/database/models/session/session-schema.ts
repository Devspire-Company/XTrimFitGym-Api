import mongoose, { Schema } from 'mongoose';

export interface ISession {
	_id?: mongoose.Types.ObjectId;
	coach_id: mongoose.Types.ObjectId;
	clients_ids: mongoose.Types.ObjectId[];
	name: string; // Workout name (e.g., "Chest", "Back", "Leg Day")
	workoutType?: string; // Additional workout type details
	date: Date;
	startTime: string; // Start time (e.g., "6:00 PM")
	endTime?: string; // End time (e.g., "7:30 PM")
	time?: string; // Time period for backwards compatibility
	gymArea: string; // Gym area/location (e.g., "Main Training Area", "Cardio Zone")
	note?: string;
	status: 'scheduled' | 'completed' | 'cancelled';
	createdAt?: Date;
	updatedAt?: Date;
}

const sessionSchema = new Schema(
	{
		coach_id: {
			type: mongoose.SchemaTypes.ObjectId,
			ref: 'User',
			required: true,
		},
		clients_ids: {
			type: [mongoose.SchemaTypes.ObjectId],
			ref: 'User',
			required: true,
		},
		name: {
			type: String,
			required: true,
		},
		workoutType: {
			type: String,
		},
		date: {
			type: Date,
			required: true,
		},
		startTime: {
			type: String,
			required: true,
		},
		endTime: {
			type: String,
		},
		time: {
			type: String,
		},
		gymArea: {
			type: String,
			required: true,
		},
		note: String,
		status: {
			type: String,
			enum: ['scheduled', 'completed', 'cancelled'],
			default: 'scheduled',
		},
	},
	{
		timestamps: true,
	}
);

// Backwards compatibility: if client_id exists, migrate to clients_ids
sessionSchema.pre('save', function (next) {
	if ((this as any).client_id && !this.clients_ids?.length) {
		this.clients_ids = [(this as any).client_id];
		delete (this as any).client_id;
	}
	next();
});

const Session = mongoose.model<ISession>('Session', sessionSchema);

export default Session;
