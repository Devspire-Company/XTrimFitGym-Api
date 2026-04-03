import { createClerkClient } from '@clerk/backend';

/** Create a Clerk user or return existing id so the email can sign in. */
export async function provisionClerkUserForAdmin(params: {
	email: string;
	firstName: string;
	lastName: string;
}): Promise<string> {
	const secret = process.env.CLERK_SECRET_KEY;
	if (!secret) {
		throw new Error('CLERK_SECRET_KEY is not set; cannot create Clerk login for this admin.');
	}

	const clerk = createClerkClient({ secretKey: secret });
	const email = params.email.trim().toLowerCase();
	const firstName = params.firstName.trim();
	const lastName = params.lastName.trim();

	const existing = await clerk.users.getUserList({ emailAddress: [email], limit: 5 });
	if (existing.data.length > 0) {
		return existing.data[0].id;
	}

	const created = await clerk.users.createUser({
		firstName,
		lastName,
		emailAddress: [email],
		skipPasswordRequirement: true,
	});

	return created.id;
}
