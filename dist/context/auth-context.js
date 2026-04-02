import crypto from 'node:crypto';
import mongoose from 'mongoose';
import z from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { verifyToken, createClerkClient } from '@clerk/backend';
import User from '../database/models/user/user-schema.js';
import { generateUniqueAttendanceId } from '../database/generateUniqueAttendanceId.js';
function parseJwtToken(token) {
    if (!token)
        return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SIKRIT);
        const payload = z
            .object({
            id: z.string(),
            role: z.enum(['admin', 'coach', 'member']),
        })
            .safeParse(decoded);
        return payload.success ? payload.data : null;
    }
    catch {
        return null;
    }
}
function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function roleFromPublicMetadata(meta) {
    if (!meta || typeof meta !== 'object')
        return null;
    const r = meta.role;
    if (r === 'admin' || r === 'coach' || r === 'member')
        return r;
    return null;
}
async function resolveProvisionRole(normalizedEmail) {
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
async function provisionClerkUser(sub, cu, primaryEmail) {
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
    const role = fromMeta ?? (await resolveProvisionRole(normalizedEmail));
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
        return { id: doc._id.toString(), role: doc.role };
    }
    catch (err) {
        const code = err && typeof err === 'object' && 'code' in err ? err.code : 0;
        if (code === 11000) {
            const again = await User.findOne({ clerkId: sub }).lean();
            if (again) {
                return { id: again._id.toString(), role: again.role };
            }
        }
        throw err;
    }
}
async function resolveClerkUser(bearerToken) {
    const secret = process.env.CLERK_SECRET_KEY;
    if (!secret)
        return null;
    try {
        const payload = await verifyToken(bearerToken, { secretKey: secret });
        const sub = payload.sub;
        if (!sub)
            return null;
        let doc = await User.findOne({ clerkId: sub }).lean();
        if (doc) {
            return { id: doc._id.toString(), role: doc.role };
        }
        const clerk = createClerkClient({ secretKey: secret });
        const cu = await clerk.users.getUser(sub);
        const email = cu.emailAddresses.find((e) => e.id === cu.primaryEmailAddressId)?.emailAddress ??
            cu.emailAddresses[0]?.emailAddress;
        if (!email)
            return null;
        doc = await User.findOne({ email: new RegExp(`^${escapeRegex(email)}$`, 'i') }).lean();
        if (doc) {
            await User.updateOne({ _id: doc._id }, { $set: { clerkId: sub } });
            return { id: doc._id.toString(), role: doc.role };
        }
        return provisionClerkUser(sub, cu, email);
    }
    catch {
        return null;
    }
}
async function resolveUser(bearerToken) {
    if (!bearerToken)
        return null;
    const fromJwt = parseJwtToken(bearerToken);
    if (fromJwt)
        return fromJwt;
    return resolveClerkUser(bearerToken);
}
const authContext = async ({ req, res, }) => {
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
            logIn: (args) => {
                const t = jwt.sign(args, process.env.JWT_SIKRIT);
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
