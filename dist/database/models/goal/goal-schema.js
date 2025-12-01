import mongoose, { Schema } from 'mongoose';
const goalSchema = new Schema({
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
}, {
    timestamps: true,
});
const Goal = mongoose.model('Goal', goalSchema);
export default Goal;
