import mongoose, { Schema } from 'mongoose';

export type RoleType = 'admin' | 'coach' | 'member';
export type GenderType = 'Male' | 'Female' | 'Prefer not to say';
export type PhysiqueType =
	| 'Ectomorph'
	| 'Endomorph'
	| 'Mesomorph'
	| 'General';
// FitnessGoalType is now a string type - predefined values are managed in config/fitness-goal-types.ts
export type FitnessGoalType = string;
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
	/**
	 * Cloudinary (or similar) URL of parent/guardian ID verification photo for minors.
	 * Sensitive — only exposed via GraphQL to the member themself, coaches, and admins.
	 */
	guardianIdVerificationPhotoUrl?: string;
	/** Minor member: printed full legal name on liability waiver (must match account). */
	minorLiabilityWaiverPrintedName?: string;
	/** Minor member: uploaded waiver signature image URL. */
	minorLiabilityWaiverSignatureUrl?: string;
	attendanceId?: number;
	/** Linked Clerk user id (web/mobile OAuth). */
	clerkId?: string;
	membershipDetails?: {
		membership_id?: mongoose.Types.ObjectId;
		physiqueGoalType?: PhysiqueType;
		fitnessGoal?: FitnessGoalType[];
		workOutTime?: string[];
		coaches_ids?: mongoose.Types.ObjectId[];
		hasEnteredDetails?: boolean;
		/** When false, mobile app blocks dashboard until staff completes facility biometric enrollment. */
		facilityBiometricEnrollmentComplete?: boolean;
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
	loginHistory?: Array<{
		ipAddress?: string;
		userAgent?: string;
		loginAt: Date;
	}>;
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
		enum: ['Ectomorph', 'Endomorph', 'Mesomorph', 'General'],
	},
	fitnessGoal: {
		type: [String],
		// No enum constraint - values are managed in config/fitness-goal-types.ts
		// Predefined values: Weight loss, Muscle building, General fitness, Strength training, Endurance, Flexibility, Rehabilitation, Athletic Performance
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
	facilityBiometricEnrollmentComplete: {
		type: Boolean,
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
		// No enum constraint - values are managed in config/fitness-goal-types.ts
		// Predefined values: Weight loss, Muscle building, General fitness, Strength training, Endurance, Flexibility, Rehabilitation, Athletic Performance
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
		guardianIdVerificationPhotoUrl: {
			type: String,
		},
		minorLiabilityWaiverPrintedName: {
			type: String,
		},
		minorLiabilityWaiverSignatureUrl: {
			type: String,
		},
		clerkId: {
			type: String,
			unique: true,
			sparse: true,
		},
		attendanceId: {
			type: Number,
			unique: true,
			sparse: true, // Allows null/undefined values but enforces uniqueness for non-null values
			min: 10000000, // Minimum 8-digit number
			max: 99999999, // Maximum 8-digit number
		},
		membershipDetails: memberSchema,
		coachDetails: coachSchema,
		loginHistory: [
			{
				ipAddress: String,
				userAgent: String,
				loginAt: {
					type: Date,
					default: Date.now,
				},
			},
		],
	},
	{
		timestamps: true,
	}
);

const User = mongoose.model<IUser>('User', userSchema);

export default User;
