import mongoose, { Schema } from 'mongoose';

export type TransactionStatusType = 'Active' | 'Canceled' | 'Expired';
export interface IMembershipTransaction {
	status: TransactionStatusType;
	monthDuration?: number;
	canceledReason?: string;
}

const membershipTransactionSchema = new Schema(
	{
		client_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		membership_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Membership',
			required: true,
		},
		priceAtPurchase: {
			type: Number,
			required: true,
		},
		startedAt: {
			type: Date,
			default: Date.now,
		},
		expiresAt: {
			type: Date,
			required: true,
		},
		/** Total subscription length in months from startedAt (may differ from catalog plan). */
		monthDuration: {
			type: Number,
			required: false,
			min: 0,
		},
		/** When set, expiry is computed as startedAt + dayDuration calendar days. */
		dayDuration: {
			type: Number,
			required: false,
			min: 1,
		},
		status: {
			type: String,
			enum: ['Active', 'Canceled', 'Expired'],
			default: 'Active',
		},
		canceledReason: {
			type: String,
			trim: true,
		},
		canceledBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		canceledAt: Date,
		lastAdjustedReason: {
			type: String,
			trim: true,
		},
		lastAdjustedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		lastAdjustedAt: Date,
	},
	{ timestamps: true }
);

const MembershipTransaction =
	(mongoose.models.MembershipTransaction as mongoose.Model<IMembershipTransaction>) ||
	mongoose.model<IMembershipTransaction>(
		'MembershipTransaction',
		membershipTransactionSchema
	);

export default MembershipTransaction;
