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

async function resolveAuthFromBearer(token: string | undefined): Promise<{
	user: { id: string; role: RoleType } | null;
	clerkSub: string | null;
}> {
	if (!token) {
		return { user: null, clerkSub: null };
	}

	const fromJwt = parseJwtToken(token);
	if (fromJwt) {
		const dbUser = await User.findById(fromJwt.id).select('isDisabled').lean();
		if (dbUser?.isDisabled) {
			return { user: null, clerkSub: null };
		}
		return { user: fromJwt, clerkSub: null };
	}

	const secret = process.env.CLERK_SECRET_KEY;
	if (!secret) {
		return { user: null, clerkSub: null };
	}

	try {
		const payload = await verifyToken(token, { secretKey: secret });
		const sub = payload.sub;
		if (!sub) {
			return { user: null, clerkSub: null };
		}

		let doc = await User.findOne({ clerkId: sub }).lean();
		if (doc) {
		if (doc.isDisabled) {
			return { user: null, clerkSub: sub };
		}
			return {
				user: { id: doc._id!.toString(), role: doc.role as RoleType },
				clerkSub: sub,
			};
		}

		const clerk = createClerkClient({ secretKey: secret });
		const cu = await clerk.users.getUser(sub);
		const email =
			cu.emailAddresses.find((e) => e.id === cu.primaryEmailAddressId)?.emailAddress ??
			cu.emailAddresses[0]?.emailAddress;
		if (!email) {
			return { user: null, clerkSub: sub };
		}

		doc = await User.findOne({ email: new RegExp(`^${escapeRegex(email)}$`, 'i') }).lean();
		if (!doc) {
			return { user: null, clerkSub: sub };
		}
	if (doc.isDisabled) {
		return { user: null, clerkSub: sub };
	}

		await User.updateOne({ _id: doc._id }, { $set: { clerkId: sub } });
		return {
			user: { id: doc._id!.toString(), role: doc.role as RoleType },
			clerkSub: sub,
		};
	} catch {
		return { user: null, clerkSub: null };
	}
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
