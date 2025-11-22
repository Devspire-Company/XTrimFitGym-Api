import mongoose from 'mongoose';
import { Request, Response } from 'express';
import z from 'zod';
import jwt from 'jsonwebtoken';
import { RoleType } from '../database/models/user/user-schema.js';

export interface IAuthContext {
	db: typeof mongoose;
	auth: {
		user: { id: string; role: RoleType } | null;
		logIn: (args: { id: string; role: RoleType }) => void;
		logOut: () => void;
	};
}

function parseToken(token?: string) {
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
	} catch (error) {
		return null;
	}
}

const authContext = async ({
	req,
	res,
}: {
	req: Request;
	res: Response;
}): Promise<IAuthContext> => {
	// Get token from cookie or Authorization header
	const tokenFromCookie = req.cookies?.token;
	const authHeader = req.headers.authorization || req.headers.Authorization;
	const tokenFromHeader = authHeader?.toString().replace(/^Bearer\s+/i, '');
	const token = tokenFromCookie || tokenFromHeader;

	const user = parseToken(token);

	// Debug: Log authentication status only in development
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
				const token = jwt.sign(args, process.env.JWT_SIKRIT!);
				// Remove domain restriction to work with IP addresses and different origins
				res.cookie('token', token, {
					httpOnly: true,
					secure: false, // Set to true in production with HTTPS
					sameSite: 'lax', // Helps with cross-origin requests
					expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
					path: '/',
				});
			},
			logOut: () => res.clearCookie('token', { path: '/' }),
		},
	};
};

export default authContext;
