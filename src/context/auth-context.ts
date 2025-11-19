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
	const user = parseToken(req.cookies?.token);

	return {
		db: mongoose,
		auth: {
			user,
			logIn: (args: { id: string; role: RoleType }) => {
				const token = jwt.sign('token', process.env.JWT_SIKRIT!);
				res.cookie('token', token, {
					domain: 'localhost',
					httpOnly: true,
					expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
				});
			},
			logOut: () => res.clearCookie('token'),
		},
	};
};

export default authContext;
