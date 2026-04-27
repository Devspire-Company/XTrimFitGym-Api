import mongoose, { Schema } from 'mongoose';

export type SessionKindType = 'personal' | 'group_class';
export type ClassEnrollmentStatusType =
	| 'invited'
	| 'pending'
	| 'accepted'
	| 'declined'
	| 'rejected';

export interface IClassEnrollment {
	client_id: mongoose.Types.ObjectId;
	status: ClassEnrollmentStatusType;
	createdAt?: Date;
}

export interface ISessionEquipmentReservation {
	equipment_id: mongoose.Types.ObjectId;
	quantity?: number;
	reservedStartTime?: string;
	reservedEndTime?: string;
}

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
	templateId?: mongoose.Types.ObjectId; // Reference to template session if this was created from a template
	goalId?: mongoose.Types.ObjectId; // Link to goal this session is helping achieve
	isTemplate?: boolean; // Whether this session is a reusable template
	sessionKind?: SessionKindType;
	maxParticipants?: number;
	enrollments?: IClassEnrollment[];
	equipmentReservations?: ISessionEquipmentReservation[];
	createdAt?: Date;
	updatedAt?: Date;
}

const classEnrollmentSchema = new Schema(
	{
		client_id: {
			type: mongoose.SchemaTypes.ObjectId,
			ref: 'User',
			required: true,
		},
		status: {
			type: String,
			enum: ['invited', 'pending', 'accepted', 'declined', 'rejected'],
			required: true,
		},
		createdAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ _id: false }
);

const sessionEquipmentReservationSchema = new Schema(
	{
		equipment_id: {
			type: mongoose.SchemaTypes.ObjectId,
			ref: 'Equipment',
			required: true,
		},
		quantity: {
			type: Number,
			min: 1,
			default: 1,
		},
		reservedStartTime: {
			type: String,
		},
		reservedEndTime: {
			type: String,
		},
	},
	{ _id: false }
);

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
			required: false, // Allow empty array for templates
			default: [],
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
		templateId: {
			type: mongoose.SchemaTypes.ObjectId,
			ref: 'Session',
			required: false,
		},
		goalId: {
			type: mongoose.SchemaTypes.ObjectId,
			ref: 'Goal',
			required: false,
		},
		isTemplate: {
			type: Boolean,
			default: false,
		},
		sessionKind: {
			type: String,
			enum: ['personal', 'group_class'],
			default: 'personal',
		},
		maxParticipants: {
			type: Number,
			min: 1,
		},
		enrollments: {
			type: [classEnrollmentSchema],
			default: [],
		},
		equipmentReservations: {
			type: [sessionEquipmentReservationSchema],
			default: [],
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
