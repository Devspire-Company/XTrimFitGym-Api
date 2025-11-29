import mongoose, { Schema } from 'mongoose';

export type RoleType = 'admin' | 'coach' | 'member';
export type GenderType = 'Male' | 'Female' | 'Prefer not to say';
export type PhysiqueType = 'Ectomorph' | 'Endomorph' | 'Mesomorph';
export type FitnessGoalType =
	| 'Weight loss'
	| 'Muscle building'
	| 'General fitness'
	| 'Strength training'
	| 'Endurance'
	| 'Flexibility'
	| 'Rehabilitation'
	| 'Athletic Performance';
export interface IUser {
	_id?: mongoose.Types.ObjectId;
	firstName: string;
	middleName?: string;
	lastName: string;
	email: string;
	password: string;
	role: RoleType;
	phoneNumber?: number;
	dateOfBirth?: Date;
	gender?: GenderType;
	heardFrom?: string[];
	agreedToTermsAndConditions?: boolean;
	agreedToPrivacyPolicy?: boolean;
	agreedToLiabilityWaiver?: boolean;
	membershipDetails?: {
		membership_id?: mongoose.Types.ObjectId;
		physiqueGoalType?: PhysiqueType;
		fitnessGoal?: FitnessGoalType[];
		workOutTime?: string[];
		coaches_ids?: mongoose.Types.ObjectId[];
		hasEnteredDetails?: boolean;
	};
	coachDetails?: {
		clients_ids?: mongoose.Types.ObjectId[];
		sessions_ids?: mongoose.Types.ObjectId[];
		specialization?: FitnessGoalType[];
		ratings?: number;
		yearsOfExperience?: number;
		moreDetails?: string;
		teachingDate?: string[];
		teachingTime?: string[];
		clientLimit?: number;
	};
	createdAt?: Date;
	updatedAt?: Date;
}

const memberSchema = new Schema({
	membership_id: {
		type: mongoose.SchemaTypes.ObjectId,
		ref: 'Membership',
	},
	physiqueGoalType: {
		type: String,
		enum: ['Ectomorph', 'Endomorph', 'Mesomorph'],
	},
	fitnessGoal: {
		type: [String],
		enum: [
			'Weight loss',
			'Muscle building',
			'General fitness',
			'Strength training',
			'Endurance',
			'Flexibility',
			'Rehabilitation',
			'Athletic Performance',
		],
	},
	workOutTime: [String],
	coaches_ids: {
		type: [mongoose.SchemaTypes.ObjectId],
		ref: 'User',
	},
	hasEnteredDetails: {
		type: Boolean,
		default: false,
	},
});

const coachSchema = new Schema({
	clients_ids: {
		type: [mongoose.SchemaTypes.ObjectId],
		ref: 'User',
	},
	sessions_ids: {
		type: [mongoose.SchemaTypes.ObjectId],
		ref: 'Session',
	},
	specialization: {
		type: [String],
		enum: [
			'Weight loss',
			'Muscle building',
			'General fitness',
			'Strength training',
			'Endurance',
			'Flexibility',
			'Rehabilitation',
			'Athletic Performance',
		],
	},
	ratings: {
		type: Number,
		default: 0,
	},
	yearsOfExperience: Number,
	moreDetails: String,
	teachingDate: [String],
	teachingTime: [String],
	clientLimit: {
		type: Number,
		default: 999, // Default to high number (unlimited)
	},
});

const userSchema = new Schema(
	{
		firstName: {
			type: String,
			required: true,
		},
		middleName: {
			type: String,
		},
		lastName: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
		},
		password: {
			type: String,
			required: true,
		},
		role: {
			type: String,
			enum: ['admin', 'coach', 'member'],
			required: true,
		},
		phoneNumber: Number,
		dateOfBirth: Date,
		gender: {
			type: String,
			enum: ['Male', 'Female', 'Prefer not to say'],
		},
		heardFrom: [String],
		agreedToTermsAndConditions: {
			type: Boolean,
			default: false,
		},
		agreedToPrivacyPolicy: {
			type: Boolean,
			default: false,
		},
		agreedToLiabilityWaiver: {
			type: Boolean,
			default: false,
		},
		membershipDetails: memberSchema,
		coachDetails: coachSchema,
	},
	{
		timestamps: true,
	}
);

const User = mongoose.model<IUser>('User', userSchema);

export default User;
