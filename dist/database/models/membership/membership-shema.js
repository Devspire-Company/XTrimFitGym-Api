import mongoose, { Schema } from 'mongoose';
const membershipSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    monthlyPrice: {
        type: Number,
        required: true,
    },
    description: String,
    features: {
        type: [String],
        required: true,
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Coming soon'],
        required: true,
    },
    durationType: {
        type: String,
        enum: ['Monthly', 'Yearly', 'Quarterly', 'Daily'],
        required: true,
    },
    monthDuration: {
        type: Number,
        required: true,
        default: 1,
        min: 1,
    },
}, { timestamps: true });
const Membership = mongoose.model('Membership', membershipSchema);
export default Membership;
