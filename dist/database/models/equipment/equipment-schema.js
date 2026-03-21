import mongoose, { Schema } from 'mongoose';
const equipmentSchema = new Schema({
    name: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true },
    description: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['AVAILABLE', 'DAMAGED', 'UNDERMAINTENANCE'],
        default: 'AVAILABLE',
    },
}, { timestamps: true });
equipmentSchema.index({ sortOrder: 1 });
const Equipment = mongoose.model('Equipment', equipmentSchema);
export default Equipment;
