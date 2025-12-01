import mongoose, { Schema } from 'mongoose';

export interface ICoachRating {
	_id?: mongoose.Types.ObjectId;
	coach_id: mongoose.Types.ObjectId;
	client_id: mongoose.Types.ObjectId;
	sessionLog_id: mongoose.Types.ObjectId; // The session log that triggered this rating
	rating: number; // Rating from 1-5 or 1-10
	comment?: string; // Optional comment from the client
	createdAt?: Date;
	updatedAt?: Date;
}

const coachRatingSchema = new Schema(
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
		sessionLog_id: {
			type: mongoose.SchemaTypes.ObjectId,
			ref: 'SessionLog',
			required: true,
		},
		rating: {
			type: Number,
			required: true,
			min: 1,
			max: 5, // Using 1-5 scale for coach ratings
		},
		comment: {
			type: String,
		},
	},
	{
		timestamps: true,
	}
);

// Index for efficient queries
coachRatingSchema.index({ coach_id: 1, client_id: 1 });
coachRatingSchema.index({ sessionLog_id: 1 }, { unique: true }); // One rating per session log

const CoachRating = mongoose.model<ICoachRating>(
	'CoachRating',
	coachRatingSchema
);

export default CoachRating;

