import mongoose, { Schema } from 'mongoose';
const memberSchema = new Schema({
    membership_id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Membership',
    },
    physiqueGoalType: {
        type: String,
        enum: ['Ectomorph', 'Endomorph', 'Mesomorph'],
    },
    fitnessGoal: {
        type: [String],
        enum: [
            'Weight loss',
            'Muscle building',
            'General fitness',
            'Strength training',
            'Endurance',
        ],
    },
    workOutTime: [String],
    coaches_ids: {
        type: [mongoose.SchemaTypes.ObjectId],
        ref: 'User',
    },
});
const coachSchema = new Schema({
    clients_ids: {
        type: [mongoose.SchemaTypes.ObjectId],
        ref: 'User',
    },
    sessions_ids: {
        type: [mongoose.SchemaTypes.ObjectId],
        ref: 'Session',
    },
    specialization: {
        type: [String],
        enum: [
            'Weight loss',
            'Muscle building',
            'General fitness',
            'Strength training',
            'Endurance',
        ],
    },
    ratings: {
        type: Number,
        default: 0,
    },
    yearsOfExperience: Number,
    moreDetails: String,
    teachingDate: [String],
    teachingTime: [String],
});
const userSchema = new Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['admin', 'coach', 'member'],
        required: true,
    },
    phoneNumber: Number,
    dateOfBirth: Date,
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Prefer not to say'],
    },
    heardFrom: [String],
    agreedToTermsAndConditions: {
        type: Boolean,
        default: false,
    },
    agreedToPrivacyPolicy: {
        type: Boolean,
        default: false,
    },
    agreedToLiabilityWaiver: {
        type: Boolean,
        default: false,
    },
    membershipDetails: memberSchema,
    coachDetails: coachSchema,
}, {
    timestamps: true,
});
const User = mongoose.model('User', userSchema);
export default User;
