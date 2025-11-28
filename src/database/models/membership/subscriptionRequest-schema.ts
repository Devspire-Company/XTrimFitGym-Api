import mongoose, { Schema } from 'mongoose';

export type SubscriptionRequestStatusType = 'Pending' | 'Approved' | 'Rejected' | 'Expired';
export interface ISubscriptionRequest {
	status: SubscriptionRequestStatusType;
}

const subscriptionRequestSchema = new Schema(
	{
		member_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		membership_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Membership',
			required: true,
		},
		status: {
			type: String,
			enum: ['Pending', 'Approved', 'Rejected', 'Expired'],
			default: 'Pending',
		},
		requestedAt: {
			type: Date,
			default: Date.now,
		},
		expiresAt: {
			type: Date,
			required: true,
		},
		approvedAt: {
			type: Date,
		},
		approvedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		rejectedAt: {
			type: Date,
		},
		rejectedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
	},
	{ timestamps: true }
);

// Index for efficient querying
subscriptionRequestSchema.index({ status: 1, expiresAt: 1 });
subscriptionRequestSchema.index({ member_id: 1, status: 1 });

// Auto-expire pending requests after 1 minute
subscriptionRequestSchema.pre('save', function (next) {
	if (this.status === 'Pending' && new Date() > this.expiresAt) {
		this.status = 'Expired';
	}
	next();
});

const SubscriptionRequest =
	(mongoose.models.SubscriptionRequest as mongoose.Model<ISubscriptionRequest>) ||
	mongoose.model<ISubscriptionRequest>('SubscriptionRequest', subscriptionRequestSchema);

export default SubscriptionRequest;

