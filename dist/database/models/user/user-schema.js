import mongoose, { Schema } from 'mongoose';
const memberSchema = new Schema({
    membership_id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Membership',
    },
    physiqueGoalType: {
        type: String,
        enum: ['Ectomorph', 'Endomorph', 'Mesomorph', 'Not sure'],
    },
    fitnessGoal: {
        type: [String],
        // No enum constraint - values are managed in config/fitness-goal-types.ts
        // Predefined values: Weight loss, Muscle building, General fitness, Strength training, Endurance, Flexibility, Rehabilitation, Athletic Performance
    },
    workOutTime: [String],
    coaches_ids: {
        type: [mongoose.SchemaTypes.ObjectId],
        ref: 'User',
    },
    hasEnteredDetails: {
        type: Boolean,
        default: false,
    },
    facilityBiometricEnrollmentComplete: {
        type: Boolean,
        default: false,
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
        // No enum constraint - values are managed in config/fitness-goal-types.ts
        // Predefined values: Weight loss, Muscle building, General fitness, Strength training, Endurance, Flexibility, Rehabilitation, Athletic Performance
    },
    ratings: {
        type: Number,
        default: 0,
    },
    yearsOfExperience: Number,
    moreDetails: String,
    teachingDate: [String],
    teachingTime: [String],
    clientLimit: {
        type: Number,
        default: 999, // Default to high number (unlimited)
    },
});
const userSchema = new Schema({
    firstName: {
        type: String,
        required: true,
    },
    middleName: {
        type: String,
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
    guardianIdVerificationPhotoUrl: String,
    minorLiabilityWaiverPrintedName: String,
    minorLiabilityWaiverSignatureUrl: String,
    clerkId: {
        type: String,
        unique: true,
        sparse: true,
    },
    attendanceId: {
        type: Number,
        unique: true,
        sparse: true, // Allows null/undefined values but enforces uniqueness for non-null values
        min: 10000000, // Minimum 8-digit number
        max: 99999999, // Maximum 8-digit number
    },
    membershipDetails: memberSchema,
    coachDetails: coachSchema,
    loginHistory: [
        {
            ipAddress: String,
            userAgent: String,
            loginAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    isDisabled: {
        type: Boolean,
        default: false,
        index: true,
    },
    disabledAt: Date,
    disabledBy: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
    },
    disableReason: String,
}, {
    timestamps: true,
});
const User = mongoose.models.User ||
    mongoose.model('User', userSchema);
export default User;
