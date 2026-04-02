import mongoose, { Schema } from 'mongoose';

/** One-time code for an admin to confirm creating another admin (email verification). */
const adminCreateVerificationSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		codeHash: { type: String, required: true },
		expiresAt: { type: Date, required: true },
	},
	{ timestamps: true }
);

adminCreateVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('AdminCreateVerification', adminCreateVerificationSchema);
