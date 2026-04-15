import mongoose, { Schema } from 'mongoose';

export type TransactionStatusType = 'Active' | 'Canceled' | 'Expired';
export interface IMembershipTransaction {
	status: TransactionStatusType;
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
		status: {
			type: String,
			enum: ['Active', 'Canceled', 'Expired'],
			default: 'Active',
		},
	},
	{ timestamps: true }
);

const MembershipTransaction = mongoose.model<IMembershipTransaction>(
	'MembershipTransaction',
	membershipTransactionSchema
);

export default MembershipTransaction;
