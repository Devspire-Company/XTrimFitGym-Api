import { WalkInClient, WalkInAttendanceLog, } from '../../database/models/walkIn/walk-in-schema.js';
import mongoose from 'mongoose';
const MANILA_TZ = 'Asia/Manila';
export function toManilaDateString(d) {
    return d.toLocaleDateString('en-CA', { timeZone: MANILA_TZ });
}
const requireAdmin = (context) => {
    if (context.auth.user?.role !== 'admin') {
        throw new Error('Unauthorized: Admin only');
    }
};
const mapClient = (doc) => ({
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
const mapLog = (log, client) => ({
    id: log._id.toString(),
    walkInClient: mapClient(client),
    timedInAt: log.timedInAt.toISOString(),
    localDate: log.localDate,
    createdAt: log.createdAt?.toISOString() ?? log.timedInAt.toISOString(),
});
export default {
    Query: {
        searchWalkInClients: async (_, { query, limit, offset, }, context) => {
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
                return docs.map((d) => mapClient(d));
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
            return docs.map((d) => mapClient(d));
        },
        walkInStats: async (_, __, context) => {
            requireAdmin(context);
            const [totalWalkInAccounts, totalTimeInRecords] = await Promise.all([
                WalkInClient.countDocuments(),
                WalkInAttendanceLog.countDocuments(),
            ]);
            return { totalWalkInAccounts, totalTimeInRecords };
        },
        walkInAttendanceLogs: async (_, { filter, pagination, }, context) => {
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
            const logs = rows.map((row) => {
                const c = row.walkInClientId;
                if (!c?._id) {
                    throw new Error('Walk-in client missing for log');
                }
                return mapLog(row, c);
            });
            return { logs, totalCount };
        },
        walkInLogsByClient: async (_, { walkInClientId, pagination, }, context) => {
            requireAdmin(context);
            if (!mongoose.Types.ObjectId.isValid(walkInClientId)) {
                throw new Error('Invalid walk-in client id');
            }
            const client = await WalkInClient.findById(walkInClientId).lean();
            if (!client) {
                throw new Error('Walk-in client not found');
            }
            const clientObj = client;
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
            const logs = rows.map((row) => mapLog(row, clientObj));
            return { logs, totalCount };
        },
        walkInAccountsOverview: async (_, { pagination, }, context) => {
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
            const ids = clients.map((c) => c._id);
            const agg = ids.length > 0
                ? await WalkInAttendanceLog.aggregate([
                    { $match: { walkInClientId: { $in: ids } } },
                    { $group: { _id: '$walkInClientId', c: { $sum: 1 } } },
                ])
                : [];
            const countMap = new Map(agg.map((a) => [a._id.toString(), a.c]));
            const rows = clients.map((doc) => {
                const c = doc;
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
    },
    Mutation: {
        createWalkInClient: async (_, { input, timeInNow, }, context) => {
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
            const clientObj = client.toObject();
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
            const logObj = logDoc.toObject();
            return {
                client: mapClient(clientObj),
                log: mapLog(logObj, clientObj),
            };
        },
        updateWalkInClient: async (_, { walkInClientId, input, }, context) => {
            requireAdmin(context);
            if (!mongoose.Types.ObjectId.isValid(walkInClientId)) {
                throw new Error('Invalid walk-in client id');
            }
            if (!input.firstName?.trim() || !input.lastName?.trim()) {
                throw new Error('First name and last name are required');
            }
            const updated = await WalkInClient.findByIdAndUpdate(walkInClientId, {
                $set: {
                    firstName: input.firstName.trim(),
                    middleName: input.middleName?.trim() || undefined,
                    lastName: input.lastName.trim(),
                    phoneNumber: input.phoneNumber?.trim() || undefined,
                    email: input.email?.trim() || undefined,
                    gender: input.gender,
                    notes: input.notes?.trim() || undefined,
                },
            }, { new: true, runValidators: true }).lean();
            if (!updated) {
                throw new Error('Walk-in client not found');
            }
            return mapClient(updated);
        },
        walkInTimeIn: async (_, { walkInClientId, at }, context) => {
            requireAdmin(context);
            const adminId = context.auth.user?.id;
            const client = await WalkInClient.findById(walkInClientId).lean();
            if (!client) {
                throw new Error('Walk-in client not found');
            }
            const clientObj = client;
            let timedInAt;
            if (at?.trim()) {
                timedInAt = new Date(at);
                if (Number.isNaN(timedInAt.getTime())) {
                    throw new Error('Invalid time for at');
                }
            }
            else {
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
            const logObj = logDoc.toObject();
            return mapLog(logObj, clientObj);
        },
    },
};
