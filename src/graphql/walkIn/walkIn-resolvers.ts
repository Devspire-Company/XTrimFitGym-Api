import { IAuthContext } from '../../context/auth-context.js';
import {
	WalkInClient,
	WalkInAttendanceLog,
	type IWalkInClient,
	type IWalkInAttendanceLog,
	type WalkInGenderValue,
} from '../../database/models/walkIn/walk-in-schema.js';
import mongoose from 'mongoose';

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

const mapClient = (doc: IWalkInClient & { _id: mongoose.Types.ObjectId }) => ({
	id: doc._id.toString(),
	firstName: doc.firstName,
	middleName: doc.middleName?.trim() ? doc.middleName : null,
	lastName: doc.lastName,
	phoneNumber: doc.phoneNumber?.trim() ? doc.phoneNumber : null,
	email: doc.email?.trim() ? doc.email : null,
	gender: doc.gender,
	notes: doc.notes?.trim() ? doc.notes : null,
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
	createdAt: log.createdAt?.toISOString() ?? log.timedInAt.toISOString(),
});

export default {
	Query: {
		searchWalkInClients: async (
			_: unknown,
			{ query, limit }: { query: string; limit?: number },
			context: Context,
		) => {
			requireAdmin(context);
			const q = query?.trim() ?? '';
			if (q.length < 1) {
				return [];
			}
			const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const regex = new RegExp(esc, 'i');
			const lim = Math.min(Math.max(limit ?? 25, 1), 50);
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
				.limit(lim)
				.lean();
			return docs.map((d) =>
				mapClient(d as IWalkInClient & { _id: mongoose.Types.ObjectId }),
			);
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
			const logDoc = new WalkInAttendanceLog({
				walkInClientId: client._id,
				timedInAt: now,
				localDate,
				createdByAdminId: adminId
					? new mongoose.Types.ObjectId(adminId)
					: undefined,
			});
			await logDoc.save();
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
			const logDoc = new WalkInAttendanceLog({
				walkInClientId: new mongoose.Types.ObjectId(walkInClientId),
				timedInAt,
				localDate,
				createdByAdminId: adminId
					? new mongoose.Types.ObjectId(adminId)
					: undefined,
			});
			await logDoc.save();
			const logObj = logDoc.toObject() as IWalkInAttendanceLog & {
				_id: mongoose.Types.ObjectId;
			};
			return mapLog(logObj, clientObj);
		},
	},
};
