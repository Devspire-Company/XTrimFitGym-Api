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

function normalizeEmail(email?: string | null) {
	return (email || '').trim().toLowerCase();
}

async function findUserByNormalizedEmail(normalizedEmail: string) {
	if (!normalizedEmail) return null;

	// Fast path for common case.
	const exactCi = await User.findOne({
		email: new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i'),
	}).lean();
	if (exactCi) return exactCi;

	// Fallback for legacy rows with leading/trailing spaces or odd casing.
	return User.findOne({
		$expr: {
			$eq: [
				{
					$toLower: {
						$trim: { input: '$email' },
					},
				},
				normalizedEmail,
			],
		},
	}).lean();
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

		const payloadRecord = payload as unknown as Record<string, unknown>;
		const emailFromToken = extractEmailFromVerifiedClerkToken(payloadRecord);
		if (emailFromToken) {
			const normalizedFromToken = normalizeEmail(emailFromToken);
			if (normalizedFromToken) {
				doc = await findUserByNormalizedEmail(normalizedFromToken);
				if (doc) {
					if (doc.isDisabled) {
						return { user: null, clerkSub: sub };
					}
					try {
						await User.updateOne(
							{ _id: doc._id },
							{ $set: { clerkId: sub, email: normalizedFromToken } }
						);
					} catch {
						const linked = await User.findOne({ clerkId: sub }).lean();
						if (linked && !linked.isDisabled) {
							return {
								user: { id: linked._id!.toString(), role: linked.role as RoleType },
								clerkSub: sub,
							};
						}
						return { user: null, clerkSub: sub };
					}
					return {
						user: { id: doc._id!.toString(), role: doc.role as RoleType },
						clerkSub: sub,
					};
				}
			}
		}

		const clerk = createClerkClient({ secretKey: secret });
		const cu = await clerk.users.getUser(sub);
		const email =
			cu.emailAddresses.find((e) => e.id === cu.primaryEmailAddressId)?.emailAddress ??
			cu.emailAddresses[0]?.emailAddress;
		const normalizedClerkEmail = normalizeEmail(email);
		if (!normalizedClerkEmail) {
			return { user: null, clerkSub: sub };
		}

		doc = await findUserByNormalizedEmail(normalizedClerkEmail);
		if (!doc) {
			return { user: null, clerkSub: sub };
		}
		if (doc.isDisabled) {
			return { user: null, clerkSub: sub };
		}

		try {
			await User.updateOne(
				{ _id: doc._id },
				{ $set: { clerkId: sub, email: normalizedClerkEmail } }
			);
		} catch {
			const linked = await User.findOne({ clerkId: sub }).lean();
			if (linked && !linked.isDisabled) {
				return {
					user: { id: linked._id!.toString(), role: linked.role as RoleType },
					clerkSub: sub,
				};
			}
			return { user: null, clerkSub: sub };
		}
		return {
			user: { id: doc._id!.toString(), role: doc.role as RoleType },
			clerkSub: sub,
		};
	} catch {
		return { user: null, clerkSub: null };
	}
}

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
				const isProd = process.env.NODE_ENV === 'production';
				res.cookie('token', t, {
					httpOnly: true,
					secure: isProd,
					sameSite: isProd ? 'none' : 'lax',
					expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
					path: '/',
				});
			},
			logOut: () => res.clearCookie('token', { path: '/' }),
		},
	};
};

export default authContext;
