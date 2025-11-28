import mongoose, { Schema } from 'mongoose';
const goalSchema = new Schema({
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
}, {
    timestamps: true,
});
const Goal = mongoose.model('Goal', goalSchema);
export default Goal;
