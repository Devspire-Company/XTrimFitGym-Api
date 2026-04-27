import { createClerkClient } from '@clerk/backend';

function requireSecret(): string {
	const secret = process.env.CLERK_SECRET_KEY;
	if (!secret) {
		throw new Error('CLERK_SECRET_KEY is not set; cannot provision Clerk login.');
	}
	return secret;
}

function mergePublicMetadata(
	prev: unknown,
	next: Record<string, unknown>
): Record<string, unknown> {
	const base =
		prev && typeof prev === 'object' && !Array.isArray(prev)
			? { ...(prev as Record<string, unknown>) }
			: {};
	return { ...base, ...next };
}

/** Create or link Clerk user; sets publicMetadata.role for the admin app. */
export async function provisionClerkUserForAdmin(params: {
	email: string;
	firstName: string;
	lastName: string;
}): Promise<string> {
	const clerk = createClerkClient({ secretKey: requireSecret() });
	const email = params.email.trim().toLowerCase();
	const firstName = params.firstName.trim();
	const lastName = params.lastName.trim();
	const meta = { role: 'admin' as const };

	const existing = await clerk.users.getUserList({ emailAddress: [email], limit: 5 });
	if (existing.data.length > 0) {
		const u = existing.data[0];
		await clerk.users.updateUser(u.id, {
			firstName,
			lastName,
			publicMetadata: mergePublicMetadata(u.publicMetadata, meta),
		});
		return u.id;
	}

	const created = await clerk.users.createUser({
		firstName,
		lastName,
		emailAddress: [email],
		skipPasswordRequirement: true,
		publicMetadata: meta,
	});

	return created.id;
}

export type CoachClerkProvisionInput = {
	email: string;
	firstName: string;
	lastName: string;
	middleName?: string | null;
	phoneNumber?: string | null;
	gender?: string | null;
	dateOfBirth?: string | null;
	coachDetails?: {
		specialization?: string[] | null;
		yearsOfExperience?: number | null;
		teachingDate?: string[] | null;
		teachingTime?: string[] | null;
		clientLimit?: number | null;
		moreDetails?: string | null;
	} | null;
};

function coachPublicMetadata(p: CoachClerkProvisionInput): Record<string, unknown> {
	const meta: Record<string, unknown> = { role: 'coach' };
	if (p.middleName?.trim()) meta.middleName = p.middleName.trim();
	if (p.phoneNumber?.trim()) meta.phoneNumber = p.phoneNumber.trim();
	if (p.gender?.trim()) meta.gender = p.gender.trim();
	if (p.dateOfBirth?.trim()) meta.dateOfBirth = p.dateOfBirth.trim();
	const cd = p.coachDetails;
	if (cd?.specialization?.length) meta.specialization = cd.specialization;
	if (cd?.yearsOfExperience != null && !Number.isNaN(cd.yearsOfExperience)) {
		meta.yearsOfExperience = cd.yearsOfExperience;
	}
	if (cd?.teachingDate?.length) meta.teachingDate = cd.teachingDate;
	if (cd?.teachingTime?.length) meta.teachingTime = cd.teachingTime;
	if (cd?.clientLimit != null && !Number.isNaN(cd.clientLimit)) {
		meta.clientLimit = cd.clientLimit;
	}
	if (cd?.moreDetails?.trim()) meta.moreDetails = cd.moreDetails.trim();
	return meta;
}

/** Create or link Clerk user with coach role + profile in publicMetadata (no password). */
export async function provisionClerkUserForCoach(
	params: CoachClerkProvisionInput
): Promise<string> {
	const clerk = createClerkClient({ secretKey: requireSecret() });
	const email = params.email.trim().toLowerCase();
	const firstName = params.firstName.trim();
	const lastName = params.lastName.trim();
	const meta = coachPublicMetadata(params);

	const existing = await clerk.users.getUserList({ emailAddress: [email], limit: 5 });
	if (existing.data.length > 0) {
		const u = existing.data[0];
		await clerk.users.updateUser(u.id, {
			firstName,
			lastName,
			publicMetadata: mergePublicMetadata(u.publicMetadata, meta),
		});
		return u.id;
	}

	const created = await clerk.users.createUser({
		firstName,
		lastName,
		emailAddress: [email],
		skipPasswordRequirement: true,
		publicMetadata: meta,
	});

	return created.id;
}
