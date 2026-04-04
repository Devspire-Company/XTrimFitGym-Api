import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import type { User as ClerkUser } from '@clerk/backend';
import User from '../database/models/user/user-schema.js';
import { generateUniqueAttendanceId } from '../database/generateUniqueAttendanceId.js';

function escapeRegex(s: string) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Create a Mongo member when a verified Clerk user has no local record yet (self-service sign-up).
 * Set CLERK_AUTO_PROVISION_MEMBERS=false to disable.
 */
export async function tryProvisionMemberFromClerk(
	clerkUser: ClerkUser,
	clerkId: string
): Promise<{ id: string; role: 'member' } | null> {
	if (process.env.CLERK_AUTO_PROVISION_MEMBERS === 'false') {
		return null;
	}

	const primary =
		clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId) ??
		clerkUser.emailAddresses[0];
	if (!primary?.emailAddress) return null;
	if (primary.verification?.status !== 'verified') return null;

	const email = primary.emailAddress.trim().toLowerCase();
	const dup = await User.findOne({ email: new RegExp(`^${escapeRegex(email)}$`, 'i') }).lean();
	if (dup) return null;

	const firstName = (clerkUser.firstName || '').trim() || 'Member';
	const lastName = (clerkUser.lastName || '').trim() || 'User';

	const hashedPassword = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10);
	const attendanceId = await generateUniqueAttendanceId();

	const doc = await User.create({
		firstName,
		lastName,
		email,
		password: hashedPassword,
		role: 'member',
		clerkId,
		attendanceId,
		agreedToTermsAndConditions: true,
		agreedToPrivacyPolicy: true,
		agreedToLiabilityWaiver: true,
	});

	return { id: doc._id!.toString(), role: 'member' };
}
