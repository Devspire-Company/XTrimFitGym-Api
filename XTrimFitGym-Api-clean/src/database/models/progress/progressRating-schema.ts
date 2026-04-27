import mongoose, { Schema } from 'mongoose';

export type ProgressVerdict = 'progressive' | 'close_to_achievement' | 'achieved' | 'regressing';

export interface IProgressRating {
	_id?: mongoose.Types.ObjectId;
	coach_id: mongoose.Types.ObjectId;
	client_id: mongoose.Types.ObjectId;
	goal_id: mongoose.Types.ObjectId;
	startDate: Date; // Start of the date range
	endDate: Date; // End of the date range
	rating: number; // Rating from 1-10 or similar
	comment: string; // Coach's comment about the progress
	verdict: ProgressVerdict; // Final verdict: progressive, close_to_achievement, achieved, regressing
	sessionLogIds: mongoose.Types.ObjectId[]; // Session logs used as basis for this rating
	createdAt?: Date;
	updatedAt?: Date;
}

const progressRatingSchema = new Schema(
	{
		coach_id: {
			type: mongoose.SchemaTypes.ObjectId,
			ref: 'User',
			required: true,
		},
		client_id: {
			type: mongoose.SchemaTypes.ObjectId,
			ref: 'User',
			required: true,
		},
		goal_id: {
			type: mongoose.SchemaTypes.ObjectId,
			ref: 'Goal',
			required: true,
		},
		startDate: {
			type: Date,
			required: true,
		},
		endDate: {
			type: Date,
			required: true,
		},
		rating: {
			type: Number,
			required: true,
			min: 1,
			max: 10,
		},
		comment: {
			type: String,
			required: true,
		},
		verdict: {
			type: String,
			enum: ['progressive', 'close_to_achievement', 'achieved', 'regressing'],
			required: true,
		},
		sessionLogIds: [
			{
				type: mongoose.SchemaTypes.ObjectId,
				ref: 'SessionLog',
			},
		],
	},
	{
		timestamps: true,
	}
);

// Index for efficient queries
progressRatingSchema.index({ coach_id: 1, client_id: 1, goal_id: 1 });
progressRatingSchema.index({ client_id: 1, goal_id: 1, startDate: 1, endDate: 1 });

const ProgressRating = mongoose.model<IProgressRating>(
	'ProgressRating',
	progressRatingSchema
);

export default ProgressRating;

