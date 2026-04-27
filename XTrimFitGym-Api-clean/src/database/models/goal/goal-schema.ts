import mongoose, { Schema } from 'mongoose';

// FitnessGoalType is now a string type - predefined values are managed in config/fitness-goal-types.ts
export type FitnessGoalType = string;

export interface IGoal {
	_id?: mongoose.Types.ObjectId;
	client_id: mongoose.Types.ObjectId;
	coach_id?: mongoose.Types.ObjectId; // Coach assigned to help with this goal (one coach per goal)
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
		coach_id: {
			type: mongoose.SchemaTypes.ObjectId,
			ref: 'User',
			required: false,
		},
		goalType: {
			type: String,
			required: true,
			// No enum constraint - values are managed in config/fitness-goal-types.ts
			// Predefined values: Weight loss, Muscle building, General fitness, Strength training, Endurance, Flexibility, Rehabilitation, Athletic Performance
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

