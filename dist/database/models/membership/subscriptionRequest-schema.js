import mongoose, { Schema } from 'mongoose';
const subscriptionRequestSchema = new Schema({
    member_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    membership_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Membership',
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
    },
    requestedAt: {
        type: Date,
        default: Date.now,
    },
    approvedAt: {
        type: Date,
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    rejectedAt: {
        type: Date,
    },
    rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true });
// Index for efficient querying
subscriptionRequestSchema.index({ status: 1 });
subscriptionRequestSchema.index({ member_id: 1, status: 1 });
const SubscriptionRequest = mongoose.models.SubscriptionRequest ||
    mongoose.model('SubscriptionRequest', subscriptionRequestSchema);
export default SubscriptionRequest;
