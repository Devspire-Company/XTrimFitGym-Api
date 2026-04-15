import { IAuthContext } from '../../context/auth-context.js';
import User from '../../database/models/user/user-schema.js';
import type { IUser } from '../../database/models/user/user-schema.js';
import {
	WalkInClient,
	WalkInAttendanceLog,
	type IWalkInClient,
	type IWalkInAttendanceLog,
	type WalkInGenderValue,
} from '../../database/models/walkIn/walk-in-schema.js';
import mongoose from 'mongoose';
import { updateTodayAnalytics } from '../../database/models/analytics/analytics-helper.js';
import {
	getWalkInTimeInPaymentPesos,
	setWalkInTimeInPaymentPesos,
} from '../../database/models/gym/gym-settings-schema.js';

type Context = IAuthContext;

const MANILA_TZ = 'Asia/Manila';

export function toManilaDateString(d: Date): string {
	return d.toLocaleDateString('en-CA', { timeZone: MANILA_TZ });
}

const requireAdmin = (context: Context) => {
	if (context.auth.user?.role !== 'admin') {
		throw new Error('Unauthorized: Admin only');
	}
};

const requireMember = (context: Context) => {
	if (!context.auth.user?.id) {
		throw new Error('Unauthorized');
	}
	if (context.auth.user.role !== 'member') {
		throw new Error('Only members can use this');
	}
};

function mapUserGenderToWalkIn(g?: string | null): WalkInGenderValue {
	const x = (g ?? '').toLowerCase();
	if (x === 'male') return 'MALE';
	if (x === 'female') return 'FEMALE';
	return 'PREFER_NOT_TO_SAY';
}

const mapClient = (doc: IWalkInClient & { _id: mongoose.Types.ObjectId }) => ({
	id: doc._id.toString(),
	firstName: doc.firstName,
	middleName: doc.middleName?.trim() ? doc.middleName : null,
	lastName: doc.lastName,
	phoneNumber: doc.phoneNumber?.trim() ? doc.phoneNumber : null,
	email: doc.email?.trim() ? doc.email : null,
	gender: doc.gender,
	notes: doc.notes?.trim() ? doc.notes : null,
	linkedUserId: doc.linkedUserId?.toString() ?? null,
	createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
	updatedAt: doc.updatedAt?.toISOString() ?? new Date().toISOString(),
});

const mapLog = (
	log: IWalkInAttendanceLog & { _id: mongoose.Types.ObjectId },
	client: IWalkInClient & { _id: mongoose.Types.ObjectId },
) => ({
	id: log._id.toString(),
	walkInClient: mapClient(client),
	timedInAt: log.timedInAt.toISOString(),
	localDate: log.localDate,
	payment: Number(log.paymentPesos ?? 0),
	createdAt: log.createdAt?.toISOString() ?? log.timedInAt.toISOString(),
});

export default {
	Query: {
		searchWalkInClients: async (
			_: unknown,
			{
				query,
				limit,
				offset,
			}: { query?: string | null; limit?: number; offset?: number },
			context: Context,
		) => {
			requireAdmin(context);
			const q = query?.trim() ?? '';
			const lim = Math.min(Math.max(limit ?? 25, 1), 200);
			const off = Math.max(offset ?? 0, 0);

			if (q.length < 1) {
				const docs = await WalkInClient.find({})
					.sort({ updatedAt: -1 })
					.skip(off)
					.limit(lim)
					.lean();
				return docs.map((d) =>
					mapClient(d as IWalkInClient & { _id: mongoose.Types.ObjectId }),
				);
			}

			const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const regex = new RegExp(esc, 'i');
			const docs = await WalkInClient.find({
				$or: [
					{ firstName: regex },
					{ lastName: regex },
					{ middleName: regex },
					{ email: regex },
					{ phoneNumber: regex },
				],
			})
				.sort({ updatedAt: -1 })
				.skip(off)
				.limit(lim)
				.lean();
			return docs.map((d) =>
				mapClient(d as IWalkInClient & { _id: mongoose.Types.ObjectId }),
			);
		},

		walkInStats: async (_: unknown, __: unknown, context: Context) => {
			requireAdmin(context);
			const [totalWalkInAccounts, totalTimeInRecords] = await Promise.all([
				WalkInClient.countDocuments(),
				WalkInAttendanceLog.countDocuments(),
			]);
			return { totalWalkInAccounts, totalTimeInRecords };
		},

		walkInAttendanceLogs: async (
			_: unknown,
			{
				filter,
				pagination,
			}: {
				filter: { date: string };
				pagination?: { limit?: number; offset?: number };
			},
			context: Context,
		) => {
			requireAdmin(context);
			const dateStr = filter?.date?.trim();
			if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
				throw new Error('Invalid date: use YYYY-MM-DD');
			}
			const limit = Math.min(Math.max(pagination?.limit ?? 100, 1), 500);
			const offset = Math.max(pagination?.offset ?? 0, 0);

			const totalCount = await WalkInAttendanceLog.countDocuments({
				localDate: dateStr,
			});

			const rows = await WalkInAttendanceLog.find({ localDate: dateStr })
				.sort({ timedInAt: -1 })
				.skip(offset)
				.limit(limit)
				.populate('walkInClientId')
				.lean();

			const logs = rows.map((row: any) => {
				const c = row.walkInClientId as IWalkInClient & {
					_id: mongoose.Types.ObjectId;
				};
				if (!c?._id) {
					throw new Error('Walk-in client missing for log');
				}
				return mapLog(
					row as IWalkInAttendanceLog & { _id: mongoose.Types.ObjectId },
					c,
				);
			});

			return { logs, totalCount };
		},

		walkInLogsByClient: async (
			_: unknown,
			{
				walkInClientId,
				pagination,
			}: {
				walkInClientId: string;
				pagination?: { limit?: number; offset?: number };
			},
			context: Context,
		) => {
			requireAdmin(context);
			if (!mongoose.Types.ObjectId.isValid(walkInClientId)) {
				throw new Error('Invalid walk-in client id');
			}
			const client = await WalkInClient.findById(walkInClientId).lean();
			if (!client) {
				throw new Error('Walk-in client not found');
			}
			const clientObj = client as IWalkInClient & {
				_id: mongoose.Types.ObjectId;
			};
			const oid = new mongoose.Types.ObjectId(walkInClientId);
			const limit = Math.min(Math.max(pagination?.limit ?? 500, 1), 1000);
			const offset = Math.max(pagination?.offset ?? 0, 0);

			const totalCount = await WalkInAttendanceLog.countDocuments({
				walkInClientId: oid,
			});

			const rows = await WalkInAttendanceLog.find({ walkInClientId: oid })
				.sort({ timedInAt: -1 })
				.skip(offset)
				.limit(limit)
				.lean();

			const logs = rows.map((row) =>
				mapLog(
					row as IWalkInAttendanceLog & { _id: mongoose.Types.ObjectId },
					clientObj,
				),
			);

			return { logs, totalCount };
		},

		walkInPaymentSettings: async (_: unknown, __: unknown, context: Context) => {
			requireAdmin(context);
			const defaultPaymentPesos = await getWalkInTimeInPaymentPesos();
			return { defaultPaymentPesos };
		},

		walkInAccountsOverview: async (
			_: unknown,
			{
				pagination,
			}: { pagination?: { limit?: number; offset?: number } },
			context: Context,
		) => {
			requireAdmin(context);
			const limit = Math.min(Math.max(pagination?.limit ?? 50, 1), 200);
			const offset = Math.max(pagination?.offset ?? 0, 0);

			const [totalWalkInAccounts, totalTimeInRecords, clients] = await Promise.all([
				WalkInClient.countDocuments(),
				WalkInAttendanceLog.countDocuments(),
				WalkInClient.find({})
					.sort({ updatedAt: -1 })
					.skip(offset)
					.limit(limit)
					.lean(),
			]);

			const ids = clients.map(
				(c) => (c as IWalkInClient & { _id: mongoose.Types.ObjectId })._id,
			);
			const agg =
				ids.length > 0
					? await WalkInAttendanceLog.aggregate<{ _id: mongoose.Types.ObjectId; c: number }>([
							{ $match: { walkInClientId: { $in: ids } } },
							{ $group: { _id: '$walkInClientId', c: { $sum: 1 } } },
						])
					: [];
			const countMap = new Map(
				agg.map((a) => [a._id.toString(), a.c]),
			);

			const rows = clients.map((doc) => {
				const c = doc as IWalkInClient & { _id: mongoose.Types.ObjectId };
				return {
					client: mapClient(c),
					timeInCount: countMap.get(c._id.toString()) ?? 0,
				};
			});

			return {
				totalWalkInAccounts,
				totalTimeInRecords,
				rows,
			};
		},

		myMemberWalkInStatus: async (_: unknown, __: unknown, context: Context) => {
			requireMember(context);
			const uid = new mongoose.Types.ObjectId(context.auth.user!.id);
			let client = await WalkInClient.findOne({ linkedUserId: uid }).lean();
			if (!client) {
				const user = await User.findById(uid).select('email').lean();
				const email = (user as Pick<IUser, 'email'> | null)?.email
					?.trim()
					.toLowerCase();
				if (email) {
					const byEmail = await WalkInClient.findOne({ email }).lean();
					if (byEmail) {
						await WalkInClient.updateOne(
							{ _id: (byEmail as { _id: mongoose.Types.ObjectId })._id },
							{ $set: { linkedUserId: uid } },
						);
						client = await WalkInClient.findById(
							(byEmail as { _id: mongoose.Types.ObjectId })._id,
						).lean();
					}
				}
			}
			if (!client) {
				return {
					registered: false,
					walkInClient: null,
					timeInCount: 0,
					lastTimedInAt: null,
				};
			}
			const c = client as IWalkInClient & { _id: mongoose.Types.ObjectId };
			const cid = c._id;
			const timeInCount = await WalkInAttendanceLog.countDocuments({
				walkInClientId: cid,
			});
			const last = await WalkInAttendanceLog.findOne({ walkInClientId: cid })
				.sort({ timedInAt: -1 })
				.lean();
			const lastLog = last as
				| (IWalkInAttendanceLog & { _id: mongoose.Types.ObjectId })
				| null;
			return {
				registered: true,
				walkInClient: mapClient(c),
				timeInCount,
				lastTimedInAt: lastLog?.timedInAt?.toISOString() ?? null,
			};
		},
	},

	Mutation: {
		createWalkInClient: async (
			_: unknown,
			{
				input,
				timeInNow,
			}: {
				input: {
					firstName: string;
					middleName?: string | null;
					lastName: string;
					phoneNumber?: string | null;
					email?: string | null;
					gender: WalkInGenderValue;
					notes?: string | null;
				};
				timeInNow: boolean;
			},
			context: Context,
		) => {
			requireAdmin(context);
			const adminId = context.auth.user?.id;
			if (!input.firstName?.trim() || !input.lastName?.trim()) {
				throw new Error('First name and last name are required');
			}

			const client = new WalkInClient({
				firstName: input.firstName.trim(),
				middleName: input.middleName?.trim() || undefined,
				lastName: input.lastName.trim(),
				phoneNumber: input.phoneNumber?.trim() || undefined,
				email: input.email?.trim() || undefined,
				gender: input.gender,
				notes: input.notes?.trim() || undefined,
				createdByAdminId: adminId
					? new mongoose.Types.ObjectId(adminId)
					: undefined,
			});
			await client.save();
			const clientObj = client.toObject() as IWalkInClient & {
				_id: mongoose.Types.ObjectId;
			};

			if (!timeInNow) {
				return { client: mapClient(clientObj), log: null };
			}

			const now = new Date();
			const localDate = toManilaDateString(now);
			const paymentPesos = await getWalkInTimeInPaymentPesos();
			const logDoc = new WalkInAttendanceLog({
				walkInClientId: client._id,
				timedInAt: now,
				localDate,
				paymentPesos,
				createdByAdminId: adminId
					? new mongoose.Types.ObjectId(adminId)
					: undefined,
			});
			await logDoc.save();
			await updateTodayAnalytics();
			const logObj = logDoc.toObject() as IWalkInAttendanceLog & {
				_id: mongoose.Types.ObjectId;
			};
			return {
				client: mapClient(clientObj),
				log: mapLog(logObj, clientObj),
			};
		},

		updateWalkInClient: async (
			_: unknown,
			{
				walkInClientId,
				input,
			}: {
				walkInClientId: string;
				input: {
					firstName: string;
					middleName?: string | null;
					lastName: string;
					phoneNumber?: string | null;
					email?: string | null;
					gender: WalkInGenderValue;
					notes?: string | null;
				};
			},
			context: Context,
		) => {
			requireAdmin(context);
			if (!mongoose.Types.ObjectId.isValid(walkInClientId)) {
				throw new Error('Invalid walk-in client id');
			}
			if (!input.firstName?.trim() || !input.lastName?.trim()) {
				throw new Error('First name and last name are required');
			}
			const updated = await WalkInClient.findByIdAndUpdate(
				walkInClientId,
				{
					$set: {
						firstName: input.firstName.trim(),
						middleName: input.middleName?.trim() || undefined,
						lastName: input.lastName.trim(),
						phoneNumber: input.phoneNumber?.trim() || undefined,
						email: input.email?.trim() || undefined,
						gender: input.gender,
						notes: input.notes?.trim() || undefined,
					},
				},
				{ new: true, runValidators: true },
			).lean();
			if (!updated) {
				throw new Error('Walk-in client not found');
			}
			return mapClient(
				updated as IWalkInClient & { _id: mongoose.Types.ObjectId },
			);
		},

		walkInTimeIn: async (
			_: unknown,
			{ walkInClientId, at }: { walkInClientId: string; at?: string | null },
			context: Context,
		) => {
			requireAdmin(context);
			const adminId = context.auth.user?.id;
			const client = await WalkInClient.findById(walkInClientId).lean();
			if (!client) {
				throw new Error('Walk-in client not found');
			}
			const clientObj = client as IWalkInClient & {
				_id: mongoose.Types.ObjectId;
			};
			let timedInAt: Date;
			if (at?.trim()) {
				timedInAt = new Date(at);
				if (Number.isNaN(timedInAt.getTime())) {
					throw new Error('Invalid time for at');
				}
			} else {
				timedInAt = new Date();
			}
			const localDate = toManilaDateString(timedInAt);
			const paymentPesos = await getWalkInTimeInPaymentPesos();
			const logDoc = new WalkInAttendanceLog({
				walkInClientId: new mongoose.Types.ObjectId(walkInClientId),
				timedInAt,
				localDate,
				paymentPesos,
				createdByAdminId: adminId
					? new mongoose.Types.ObjectId(adminId)
					: undefined,
			});
			await logDoc.save();
			await updateTodayAnalytics();
			const logObj = logDoc.toObject() as IWalkInAttendanceLog & {
				_id: mongoose.Types.ObjectId;
			};
			return mapLog(logObj, clientObj);
		},

		updateWalkInPaymentSettings: async (
			_: unknown,
			{ paymentPesos }: { paymentPesos: number },
			context: Context,
		) => {
			requireAdmin(context);
			const next = await setWalkInTimeInPaymentPesos(paymentPesos);
			return { defaultPaymentPesos: next };
		},

		syncMyWalkInProfile: async (_: unknown, __: unknown, context: Context) => {
			requireMember(context);
			const uid = new mongoose.Types.ObjectId(context.auth.user!.id);
			const user = await User.findById(uid).lean();
			if (!user) {
				throw new Error('User not found');
			}
			const u = user as IUser & { _id: mongoose.Types.ObjectId };
			const emailNorm = (u.email || '').trim().toLowerCase();
			let doc = await WalkInClient.findOne({ linkedUserId: uid });
			if (!doc && emailNorm) {
				doc = await WalkInClient.findOne({ email: emailNorm });
			}
			const phone =
				u.phoneNumber !== undefined && u.phoneNumber !== null
					? String(u.phoneNumber)
					: undefined;
			const memberNotes =
				'[Member app] Try-out / no membership — synced for walk-in desk search.';
			const payload: Partial<IWalkInClient> & {
				firstName: string;
				lastName: string;
				gender: WalkInGenderValue;
			} = {
				firstName: u.firstName.trim(),
				middleName: u.middleName?.trim() || undefined,
				lastName: u.lastName.trim(),
				phoneNumber: phone,
				email: emailNorm || undefined,
				gender: mapUserGenderToWalkIn(u.gender),
				linkedUserId: uid,
				notes: memberNotes,
			};
			if (doc) {
				Object.assign(doc, payload);
				await doc.save();
				const o = doc.toObject() as IWalkInClient & {
					_id: mongoose.Types.ObjectId;
				};
				return mapClient(o);
			}
			const created = await WalkInClient.create({
				...payload,
			});
			const createdObj = created.toObject() as IWalkInClient & {
				_id: mongoose.Types.ObjectId;
			};
			return mapClient(createdObj);
		},
	},
};
