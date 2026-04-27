import mongoose, { Schema } from 'mongoose';

export type MembershipStatusType = 'Active' | 'Inactive' | 'Coming soon';
export type DurationTypeType = 'Monthly' | 'Yearly' | 'Quarterly' | 'Daily' | 'Minutes';
export interface IMembership {
	status: MembershipStatusType;
	durationType: DurationTypeType;
	statusEffectiveAt?: Date;
}

const membershipSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
		},
		monthlyPrice: {
			type: Number,
			required: true,
		},
		description: String,
		features: {
			type: [String],
			required: true,
		},
		status: {
			type: String,
			enum: ['Active', 'Inactive', 'Coming soon'],
			required: true,
		},
		statusEffectiveAt: {
			type: Date,
			default: Date.now,
		},
		durationType: {
			type: String,
			enum: ['Monthly', 'Yearly', 'Quarterly', 'Daily', 'Minutes'],
			required: true,
		},
		monthDuration: {
			type: Number,
			required: true,
			default: 1,
			min: 1,
		},
	},
	{ timestamps: true }
);

const Membership = mongoose.model<IMembership>('Membership', membershipSchema);

export default Membership;
