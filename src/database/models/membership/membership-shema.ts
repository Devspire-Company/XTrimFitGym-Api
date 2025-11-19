import mongoose, { Schema } from 'mongoose';

export type MembershipStatusType = 'Active' | 'Inactive' | 'Coming soon';
export type DurationTypeType = 'Monthly' | 'Yearly' | 'Quarterly';
export interface IMembership {
	status: MembershipStatusType;
	durationType: DurationTypeType;
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
		durationType: {
			type: String,
			enum: ['Monthly', 'Yearly', 'Quarterly'],
			required: true,
		},
	},
	{ timestamps: true }
);

const Membership = mongoose.model<IMembership>('Membership', membershipSchema);

export default Membership;
