import mongoose, { Schema } from 'mongoose';

export interface IAnalytics {
	date: Date;
	totalRevenue: number;
	activeSubscriptions: number;
	newSubscriptions: number;
	canceledSubscriptions: number;
	expiredSubscriptions: number;
	revenueByMembership: Array<{
		membershipId: mongoose.Types.ObjectId;
		membershipName: string;
		revenue: number;
		count: number;
	}>;
	createdAt?: Date;
	updatedAt?: Date;
}

const analyticsSchema = new Schema(
	{
		date: {
			type: Date,
			required: true,
			unique: true,
			index: true,
		},
		totalRevenue: {
			type: Number,
			default: 0,
		},
		activeSubscriptions: {
			type: Number,
			default: 0,
		},
		newSubscriptions: {
			type: Number,
			default: 0,
		},
		canceledSubscriptions: {
			type: Number,
			default: 0,
		},
		expiredSubscriptions: {
			type: Number,
			default: 0,
		},
		revenueByMembership: [
			{
				membershipId: {
					type: mongoose.Schema.Types.ObjectId,
					ref: 'Membership',
					required: true,
				},
				membershipName: {
					type: String,
					required: true,
				},
				revenue: {
					type: Number,
					default: 0,
				},
				count: {
					type: Number,
					default: 0,
				},
			},
		],
	},
	{ timestamps: true }
);

// Index for efficient date-based queries
analyticsSchema.index({ date: -1 });
analyticsSchema.index({ createdAt: -1 });

const Analytics =
	(mongoose.models.Analytics as mongoose.Model<IAnalytics>) ||
	mongoose.model<IAnalytics>('Analytics', analyticsSchema);

export default Analytics;

