import mongoose, { Schema } from 'mongoose';

export type FitnessGoalType =
	| 'Weight loss'
	| 'Muscle building'
	| 'General fitness'
	| 'Strength training'
	| 'Endurance'
	| 'Flexibility'
	| 'Athletic performance'
	| 'Rehabilitation';

export interface IGoal {
	_id?: mongoose.Types.ObjectId;
	client_id: mongoose.Types.ObjectId;
	goalType: FitnessGoalType;
	title: string; // Custom goal title
	description?: string; // Goal description
	targetWeight?: number; // Target weight in kg
	currentWeight?: number; // Starting weight
	targetDate?: Date; // Target date to achieve goal
	status: 'active' | 'completed' | 'paused' | 'cancelled';
	createdAt?: Date;
	updatedAt?: Date;
}

const goalSchema = new Schema(
	{
		client_id: {
			type: mongoose.SchemaTypes.ObjectId,
			ref: 'User',
			required: true,
		},
		goalType: {
			type: String,
			enum: [
				'Weight loss',
				'Muscle building',
				'General fitness',
				'Strength training',
				'Endurance',
				'Flexibility',
				'Athletic performance',
				'Rehabilitation',
			],
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		description: String,
		targetWeight: Number,
		currentWeight: Number,
		targetDate: Date,
		status: {
			type: String,
			enum: ['active', 'completed', 'paused', 'cancelled'],
			default: 'active',
		},
	},
	{
		timestamps: true,
	}
);

const Goal = mongoose.model<IGoal>('Goal', goalSchema);

export default Goal;

