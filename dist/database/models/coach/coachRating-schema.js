import mongoose, { Schema } from 'mongoose';
const coachRatingSchema = new Schema({
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
}, {
    timestamps: true,
});
// Index for efficient queries
coachRatingSchema.index({ coach_id: 1, client_id: 1 });
coachRatingSchema.index({ sessionLog_id: 1 }, { unique: true }); // One rating per session log
const CoachRating = mongoose.model('CoachRating', coachRatingSchema);
export default CoachRating;
