import mongoose, { Schema } from 'mongoose';
const sessionLogSchema = new Schema({
    session_id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Session',
        required: true,
    },
    client_id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true,
    },
    coach_id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true,
    },
    weight: {
        type: Number,
        required: true,
    },
    clientConfirmed: {
        type: Boolean,
        default: false,
    },
    coachConfirmed: {
        type: Boolean,
        default: false,
    },
    notes: String,
    completedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
const SessionLog = mongoose.model('SessionLog', sessionLogSchema);
export default SessionLog;
