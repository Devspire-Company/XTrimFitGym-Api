import mongoose from 'mongoose';
import { Request, Response } from 'express';
import z from 'zod';
import jwt from 'jsonwebtoken';
import { verifyToken, createClerkClient } from '@clerk/backend';
import User, { RoleType } from '../database/models/user/user-schema.js';

export interface IAuthContext {
	db: typeof mongoose;
	auth: {
		user: { id: string; role: RoleType } | null;
		/** Clerk user id when the Bearer token is a valid Clerk session JWT (even if no Mongo user yet). */
		clerkSub: string | null;
		logIn: (args: { id: string; role: RoleType }) => void;
		logOut: () => void;
	};
}

function parseJwtToken(token?: string) {
	if (!token) return null;

	try {
		const decoded = jwt.verify(token, process.env.JWT_SIKRIT!);
		const payload = z
			.object({
				id: z.string(),
				role: z.enum(['admin', 'coach', 'member']),
			})
			.safeParse(decoded);

		return payload.success ? payload.data : null;
	} catch {
		return null;
	}
}

function escapeRegex(s: string) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeEmail(value: string): string {
	return value.trim().toLowerCase();
}

function buildNormalizedEmailQuery(email: string) {
	const normalized = normalizeEmail(email);
	return {
		$or: [
			{ email: new RegExp(`^${escapeRegex(normalized)}$`, 'i') },
			{
				$expr: {
					$eq: [{ $toLower: { $trim: { input: '$email' } } }, normalized],
				},
			},
		],
	};
}

function extractEmailFromVerifiedClerkToken(payload: Record<string, unknown>): string | null {
	const direct =
		typeof payload.email === 'string'
			? payload.email
			: typeof payload.email_address === 'string'
				? payload.email_address
				: null;
	if (direct?.trim()) return direct.trim();

	const primaryObj =
		payload.primary_email_address &&
		typeof payload.primary_email_address === 'object' &&
		!Array.isArray(payload.primary_email_address)
			? (payload.primary_email_address as Record<string, unknown>)
			: null;
	if (typeof primaryObj?.email_address === 'string' && primaryObj.email_address.trim()) {
		return primaryObj.email_address.trim();
	}

	const emails = Array.isArray(payload.email_addresses) ? payload.email_addresses : [];
	for (const item of emails) {
		if (!item || typeof item !== 'object') continue;
		const record = item as Record<string, unknown>;
		if (typeof record.email_address === 'string' && record.email_address.trim()) {
			return record.email_address.trim();
		}
	}
	return null;
}

async function resolveUserByEmailAndLinkClerk(
	email: string,
	clerkSub: string
): Promise<{ user: { id: string; role: RoleType }; clerkSub: string } | null> {
	const normalized = normalizeEmail(email);
	if (!normalized) return null;
	const doc = await User.findOne(buildNormalizedEmailQuery(normalized)).lean();
	if (!doc) return null;

	try {
		await User.updateOne({ _id: doc._id }, { $set: { clerkId: clerkSub, email: normalized } });
	} catch {
		// If another row already has this clerkId, use that row as source of truth.
		const linked = await User.findOne({ clerkId: clerkSub }).lean();
		if (linked) {
			return {
				user: { id: linked._id!.toString(), role: linked.role as RoleType },
				clerkSub,
			};
		}
	}

	return {
		user: { id: doc._id!.toString(), role: doc.role as RoleType },
		clerkSub,
	};
}

export async function resolveAuthFromBearer(token: string | undefined): Promise<{
	user: { id: string; role: RoleType } | null;
	clerkSub: string | null;
}> {
	if (!token) {
		return { user: null, clerkSub: null };
	}

	const fromJwt = parseJwtToken(token);
	if (fromJwt) {
		return { user: fromJwt, clerkSub: null };
	}

	const secret = process.env.CLERK_SECRET_KEY;
	if (!secret) {
		return { user: null, clerkSub: null };
	}

	try {
		const payload = (await verifyToken(token, { secretKey: secret })) as Record<
			string,
			unknown
		>;
		const sub = typeof payload.sub === 'string' ? payload.sub : null;
		if (!sub) {
			return { user: null, clerkSub: null };
		}

		let doc = await User.findOne({ clerkId: sub }).lean();
		if (doc) {
			return {
				user: { id: doc._id!.toString(), role: doc.role as RoleType },
				clerkSub: sub,
			};
		}

		const emailFromToken = extractEmailFromVerifiedClerkToken(payload);
		if (emailFromToken) {
			const linkedFromTokenEmail = await resolveUserByEmailAndLinkClerk(emailFromToken, sub);
			if (linkedFromTokenEmail) return linkedFromTokenEmail;
		}

		const clerk = createClerkClient({ secretKey: secret });
		const cu = await clerk.users.getUser(sub);
		const email =
			cu.emailAddresses.find((e) => e.id === cu.primaryEmailAddressId)?.emailAddress ??
			cu.emailAddresses[0]?.emailAddress;
		if (!email) {
			return { user: null, clerkSub: sub };
		}

		const linkedFromClerkEmail = await resolveUserByEmailAndLinkClerk(email, sub);
		if (linkedFromClerkEmail) return linkedFromClerkEmail;
		return { user: null, clerkSub: sub };
	} catch {
		return { user: null, clerkSub: null };
	}
}

/** For REST routes (e.g. image verification) that use the same Bearer / cookie auth as GraphQL. */
export async function getAuthUserFromHttpRequest(
	req: Request
): Promise<{ id: string; role: RoleType } | null> {
	const tokenFromCookie = req.cookies?.token;
	const authHeader = req.headers.authorization || req.headers.Authorization;
	const tokenFromHeader = authHeader?.toString().replace(/^Bearer\s+/i, '');
	const token = tokenFromHeader || tokenFromCookie;
	const { user } = await resolveAuthFromBearer(token);
	return user;
}

const authContext = async ({
	req,
	res,
}: {
	req: Request;
	res: Response;
}): Promise<IAuthContext> => {
	const tokenFromCookie = req.cookies?.token;
	const authHeader = req.headers.authorization || req.headers.Authorization;
	const tokenFromHeader = authHeader?.toString().replace(/^Bearer\s+/i, '');
	// Prefer Bearer (mobile / Clerk) over cookie so a stale cookie cannot hide a valid Clerk token.
	const token = tokenFromHeader || tokenFromCookie;

	const { user, clerkSub } = await resolveAuthFromBearer(token);

	if (!user && process.env.NODE_ENV !== 'production') {
		console.log('🔒 No authenticated user found');
		console.log('  - Cookie token:', tokenFromCookie ? 'Present' : 'Missing');
		console.log('  - Header token:', tokenFromHeader ? 'Present' : 'Missing');
		console.log('  - Auth header:', authHeader ? 'Present' : 'Missing');
		if (tokenFromHeader) {
			console.log('  - Token length:', tokenFromHeader.length);
		}
		if (clerkSub) {
			console.log('  - Clerk sub present (no Mongo user yet):', clerkSub.slice(0, 8) + '…');
		}
	}

	return {
		db: mongoose,
		auth: {
			user,
			clerkSub,
			logIn: (args: { id: string; role: RoleType }) => {
				const t = jwt.sign(args, process.env.JWT_SIKRIT!);
				res.cookie('token', t, {
					httpOnly: true,
					secure: false,
					sameSite: 'lax',
					expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
					path: '/',
				});
			},
			logOut: () => res.clearCookie('token', { path: '/' }),
		},
	};
};

export default authContext;
