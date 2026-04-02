import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { Request, Response } from 'express';
import z from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { verifyToken, createClerkClient } from '@clerk/backend';
import User, { RoleType } from '../database/models/user/user-schema.js';
import { generateUniqueAttendanceId } from '../database/generateUniqueAttendanceId.js';

export interface IAuthContext {
	db: typeof mongoose;
	auth: {
		user: { id: string; role: RoleType } | null;
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

function roleFromPublicMetadata(meta: unknown): RoleType | null {
	if (!meta || typeof meta !== 'object') return null;
	const r = (meta as Record<string, unknown>).role;
	if (r === 'admin' || r === 'coach' || r === 'member') return r;
	return null;
}

async function resolveProvisionRole(normalizedEmail: string): Promise<RoleType> {
	const adminEmails = (process.env.CLERK_ADMIN_EMAILS ?? '')
		.split(',')
		.map((s) => s.trim().toLowerCase())
		.filter(Boolean);
	if (adminEmails.length > 0 && adminEmails.includes(normalizedEmail)) {
		return 'admin';
	}
	const total = await User.countDocuments();
	if (total === 0) {
		return 'admin';
	}
	return 'member';
}

type ClerkUserResource = Awaited<ReturnType<ReturnType<typeof createClerkClient>['users']['getUser']>>;

async function provisionClerkUser(
	sub: string,
	cu: ClerkUserResource,
	primaryEmail: string
): Promise<{ id: string; role: RoleType } | null> {
	const normalizedEmail = primaryEmail.trim().toLowerCase();

	let firstName = (cu.firstName || '').trim();
	let lastName = (cu.lastName || '').trim();
	if (!firstName && !lastName && cu.username) {
		firstName = String(cu.username).trim();
	}
	if (!firstName) {
		firstName = normalizedEmail.split('@')[0] || 'User';
	}
	if (!lastName) {
		lastName = '-';
	}

	const fromMeta = roleFromPublicMetadata(cu.publicMetadata);
	const role: RoleType = fromMeta ?? (await resolveProvisionRole(normalizedEmail));

	const hashedPassword = await bcrypt.hash(crypto.randomBytes(48).toString('hex'), 10);
	const attendanceId = await generateUniqueAttendanceId();

	try {
		const doc = await User.create({
			firstName,
			lastName,
			email: normalizedEmail,
			password: hashedPassword,
			role,
			clerkId: sub,
			gender: 'Prefer not to say',
			attendanceId,
		});
		return { id: doc._id!.toString(), role: doc.role as RoleType };
	} catch (err: unknown) {
		const code = err && typeof err === 'object' && 'code' in err ? (err as { code: number }).code : 0;
		if (code === 11000) {
			const again = await User.findOne({ clerkId: sub }).lean();
			if (again) {
				return { id: again._id!.toString(), role: again.role as RoleType };
			}
		}
		throw err;
	}
}

async function resolveClerkUser(bearerToken: string): Promise<{ id: string; role: RoleType } | null> {
	const secret = process.env.CLERK_SECRET_KEY;
	if (!secret) return null;

	try {
		const payload = await verifyToken(bearerToken, { secretKey: secret });
		const sub = payload.sub;
		if (!sub) return null;

		let doc = await User.findOne({ clerkId: sub }).lean();
		if (doc) {
			return { id: doc._id!.toString(), role: doc.role as RoleType };
		}

		const clerk = createClerkClient({ secretKey: secret });
		const cu = await clerk.users.getUser(sub);
		const email =
			cu.emailAddresses.find((e) => e.id === cu.primaryEmailAddressId)?.emailAddress ??
			cu.emailAddresses[0]?.emailAddress;
		if (!email) return null;

		doc = await User.findOne({ email: new RegExp(`^${escapeRegex(email)}$`, 'i') }).lean();
		if (doc) {
			await User.updateOne({ _id: doc._id }, { $set: { clerkId: sub } });
			return { id: doc._id!.toString(), role: doc.role as RoleType };
		}

		return provisionClerkUser(sub, cu, email);
	} catch {
		return null;
	}
}

async function resolveUser(bearerToken: string | undefined) {
	if (!bearerToken) return null;
	const fromJwt = parseJwtToken(bearerToken);
	if (fromJwt) return fromJwt;
	return resolveClerkUser(bearerToken);
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
	const token = tokenFromCookie || tokenFromHeader;

	const user = await resolveUser(token);

	if (!user && process.env.NODE_ENV !== 'production') {
		console.log('🔒 No authenticated user found');
		console.log('  - Cookie token:', tokenFromCookie ? 'Present' : 'Missing');
		console.log('  - Header token:', tokenFromHeader ? 'Present' : 'Missing');
		console.log('  - Auth header:', authHeader ? 'Present' : 'Missing');
		if (tokenFromHeader) {
			console.log('  - Token length:', tokenFromHeader.length);
		}
	}

	return {
		db: mongoose,
		auth: {
			user,
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
