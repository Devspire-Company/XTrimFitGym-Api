import mongoose, { Schema } from 'mongoose';

export type ReportTypeValue =
	| 'ATTENDANCE'
	| 'WALK_IN'
	| 'NEAR_ENDING_MEMBERSHIPS'
	| 'REVENUE'
	| 'EQUIPMENT';

export interface IReportDownloadLog {
	_id?: mongoose.Types.ObjectId;
	reportType: ReportTypeValue;
	format: 'PDF';
	downloadedBy: mongoose.Types.ObjectId;
	downloadedByRole: 'admin' | 'coach' | 'member';
	fileName?: string;
	dateRange?: {
		startDate?: Date;
		endDate?: Date;
	};
	filterSummary?: string;
	metadataJson?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

const reportDownloadLogSchema = new Schema(
	{
		reportType: {
			type: String,
			enum: [
				'ATTENDANCE',
				'WALK_IN',
				'NEAR_ENDING_MEMBERSHIPS',
				'REVENUE',
				'EQUIPMENT',
			],
			required: true,
		},
		format: {
			type: String,
			enum: ['PDF'],
			default: 'PDF',
			required: true,
		},
		downloadedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		downloadedByRole: {
			type: String,
			enum: ['admin', 'coach', 'member'],
			required: true,
		},
		fileName: { type: String, trim: true },
		dateRange: {
			startDate: Date,
			endDate: Date,
		},
		filterSummary: { type: String, trim: true },
		metadataJson: { type: String },
	},
	{ timestamps: true }
);

reportDownloadLogSchema.index({ reportType: 1, createdAt: -1 });

const ReportDownloadLog =
	(mongoose.models.ReportDownloadLog as mongoose.Model<IReportDownloadLog>) ||
	mongoose.model<IReportDownloadLog>('ReportDownloadLog', reportDownloadLogSchema);

export default ReportDownloadLog;
