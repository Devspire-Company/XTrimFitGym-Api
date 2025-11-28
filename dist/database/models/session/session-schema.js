import mongoose, { Schema } from 'mongoose';
const sessionSchema = new Schema({
    coach_id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true,
    },
    clients_ids: {
        type: [mongoose.SchemaTypes.ObjectId],
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    workoutType: {
        type: String,
    },
    date: {
        type: Date,
        required: true,
    },
    startTime: {
        type: String,
        required: true,
    },
    endTime: {
        type: String,
    },
    time: {
        type: String,
    },
    gymArea: {
        type: String,
        required: true,
    },
    note: String,
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled'],
        default: 'scheduled',
    },
}, {
    timestamps: true,
});
// Backwards compatibility: if client_id exists, migrate to clients_ids
sessionSchema.pre('save', function (next) {
    if (this.client_id && !this.clients_ids?.length) {
        this.clients_ids = [this.client_id];
        delete this.client_id;
    }
    next();
});
const Session = mongoose.model('Session', sessionSchema);
export default Session;
