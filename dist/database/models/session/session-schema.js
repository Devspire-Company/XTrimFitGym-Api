import mongoose, { Schema } from 'mongoose';
const sessionSchema = new Schema({
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
    name: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
    },
    time: {
        type: String,
    },
    note: String,
});
const Session = mongoose.model('Session', sessionSchema);
export default Session;
