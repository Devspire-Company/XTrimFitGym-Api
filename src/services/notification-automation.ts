import mongoose from 'mongoose';
import type mysql from 'mysql2/promise';
import MembershipTransaction from '../database/models/membership/membershipTransaction-schema.js';
import User from '../database/models/user/user-schema.js';
import Notification from '../database/models/notification/notification-schema.js';
import { ensureMySQLConnection } from '../database/mysql/connectMysql.js';

const MANILA_TZ = 'Asia/Manila';
const WEEKDAY_INDEX: Record<string, number> = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };
const LONG_TO_SHORT: Record<string, string> = {
	SUNDAY: 'SUN', MONDAY: 'MON', TUESDAY: 'TUE', WEDNESDAY: 'WED',
	THURSDAY: 'THU', FRIDAY: 'FRI', SATURDAY: 'SAT',
};

function toManilaYmd(date: Date): string {
	return date.toLocaleDateString('en-CA', { timeZone: MANILA_TZ });
}

function weekdayInManila(date: Date): number {
	const short = date.toLocaleDateString('en-US', { timeZone: MANILA_TZ, weekday: 'short' }).toUpperCase().slice(0, 3);
	return WEEKDAY_INDEX[short] ?? -1;
}

function parseScheduleDays(values: string[] | undefined | null): Set<number> {
	const out = new Set<number>();
	for (const raw of values || []) {
		const normalized = String(raw || '').toUpperCase().replace(/\s+/g, '');
		if (!normalized) continue;
		if (/^[MTWHFSU]{2,7}$/.test(normalized)) {
			for (const ch of normalized) {
				if (ch === 'M') out.add(1);
				if (ch === 'T') out.add(2);
				if (ch === 'W') out.add(3);
				if (ch === 'H') out.add(4);
				if (ch === 'F') out.add(5);
				if (ch === 'S') out.add(6);
				if (ch === 'U') out.add(0);
			}
			continue;
		}
		const tokens = normalized.split(/[^A-Z]/).filter(Boolean);
		for (const tokenRaw of tokens) {
			const token = LONG_TO_SHORT[tokenRaw] || tokenRaw.slice(0, 3);
			if (WEEKDAY_INDEX[token] != null) out.add(WEEKDAY_INDEX[token]);
		}
	}
	return out;
}

function toIsoAtNoon(ymd: string): Date {
	return new Date(`${ymd}T12:00:00.000Z`);
}

async function getAttendanceYmdSet(
	connection: mysql.Connection,
	cardNo: string,
	startYmd: string,
	endYmd: string
): Promise<Set<string>> {
	const [rows] = await connection.execute<mysql.RowDataPacket[]>(
		`SELECT DISTINCT DATE(authDateTime) as ymd
		 FROM attendance
		 WHERE (
			CAST(cardNo AS CHAR) = CAST(? AS CHAR)
			OR (cardNo REGEXP '^[0-9]+$' AND CAST(? AS UNSIGNED) = CAST(cardNo AS UNSIGNED))
		 )
		 AND authDateTime >= CONCAT(?, ' 00:00:00')
		 AND authDateTime < CONCAT(DATE_ADD(?, INTERVAL 1 DAY), ' 00:00:00')`,
		[cardNo, cardNo, startYmd, endYmd]
	);
	const set = new Set<string>();
	for (const r of rows) if (r.ymd) set.add(String(r.ymd));
	return set;
}

async function createDedupedNotification(args: {
	recipientId: string;
	recipientRole: 'admin' | 'coach' | 'member';
	type: 'INACTIVITY' | 'MEMBERSHIP_EXPIRING';
	title: string;
	message: string;
	dedupeKey: string;
	metadata: Record<string, unknown>;
}) {
	await Notification.findOneAndUpdate(
		{ dedupeKey: args.dedupeKey },
		{
			$setOnInsert: {
				recipientId: new mongoose.Types.ObjectId(args.recipientId),
				recipientRole: args.recipientRole,
				type: args.type,
				title: args.title,
				message: args.message,
				dedupeKey: args.dedupeKey,
				metadataJson: JSON.stringify(args.metadata),
				isRead: false,
			},
		},
		{ upsert: true, new: true }
	);
}

async function runMembershipExpiringSoonCheck() {
	const thresholdDays = Number(process.env.MEMBERSHIP_EXPIRING_DAYS || 7);
	const now = new Date();
	const threshold = new Date();
	threshold.setDate(threshold.getDate() + thresholdDays);
	const admins = await User.find({ role: 'admin', isDisabled: { $ne: true } }).select('_id').lean();
	const txs = await MembershipTransaction.find({
		status: 'Active',
		expiresAt: { $gt: now, $lte: threshold },
	})
		.populate('membership_id', 'name')
		.populate('client_id', 'firstName lastName isDisabled')
		.lean();

	for (const tx of txs) {
		const txAny: any = tx;
		const member: any = txAny.client_id;
		const plan: any = txAny.membership_id;
		if (!member?._id || member.isDisabled) continue;
		const expiryLabel = new Date(txAny.expiresAt).toLocaleDateString('en-PH', { timeZone: MANILA_TZ });
		const title = 'Membership expiring soon';
		const message = `${member.firstName} ${member.lastName} membership (${plan?.name || 'Plan'}) expires on ${expiryLabel}.`;
		const baseMeta = { transactionId: txAny._id.toString(), memberId: member._id.toString(), expiry: txAny.expiresAt, thresholdDays };

		await createDedupedNotification({
			recipientId: member._id.toString(),
			recipientRole: 'member',
			type: 'MEMBERSHIP_EXPIRING',
			title, message,
			dedupeKey: `exp:${txAny._id.toString()}:d${thresholdDays}:member:${member._id.toString()}`,
			metadata: baseMeta,
		});

		for (const admin of admins) {
			await createDedupedNotification({
				recipientId: admin._id.toString(),
				recipientRole: 'admin',
				type: 'MEMBERSHIP_EXPIRING',
				title, message,
				dedupeKey: `exp:${txAny._id.toString()}:d${thresholdDays}:admin:${admin._id.toString()}`,
				metadata: baseMeta,
			});
		}
	}
}

async function runMonthlyInactivityCheck() {
	let connection: mysql.Connection;
	try {
		connection = await ensureMySQLConnection();
	} catch {
		return;
	}

	const now = new Date();
	const admins = await User.find({ role: 'admin', isDisabled: { $ne: true } }).select('_id').lean();
	const txs = await MembershipTransaction.find({ status: 'Active' })
		.populate('membership_id', 'name durationType')
		.populate('client_id', 'firstName lastName attendanceId isDisabled membershipDetails')
		.lean();

	for (const tx of txs) {
		const txAny: any = tx;
		const plan: any = txAny.membership_id;
		const member: any = txAny.client_id;
		if (!plan || !member || member.isDisabled) continue;
		if (String(plan.durationType || '').toLowerCase() !== 'monthly') continue;
		if (!member.attendanceId) continue;
		const scheduleDays = parseScheduleDays(member.membershipDetails?.workOutTime);
		if (scheduleDays.size === 0) continue;

		const startYmd = toManilaYmd(new Date(txAny.startedAt));
		const endYmd = toManilaYmd(new Date(Math.min(new Date(txAny.expiresAt).getTime(), now.getTime())));
		const attendance = await getAttendanceYmdSet(connection, String(member.attendanceId), startYmd, endYmd);

		let streak = 0;
		let triggerYmd: string | null = null;
		let lastAttendedYmd: string | null = null;
		for (let cursor = toIsoAtNoon(startYmd); toManilaYmd(cursor) <= endYmd; ) {
			const ymd = toManilaYmd(cursor);
			if (scheduleDays.has(weekdayInManila(cursor))) {
				if (attendance.has(ymd)) {
					streak = 0;
					lastAttendedYmd = ymd;
				} else if (++streak === 5) {
					triggerYmd = ymd;
					break;
				}
			}
			cursor.setUTCDate(cursor.getUTCDate() + 1);
		}
		if (!triggerYmd) continue;

		const coachIds: string[] = (member.membershipDetails?.coaches_ids || []).map((id: any) => id.toString());
		const coaches = coachIds.length
			? await User.find({
					_id: { $in: coachIds.map((id) => new mongoose.Types.ObjectId(id)) },
					role: 'coach',
					isDisabled: { $ne: true },
			  }).select('_id').lean()
			: [];

		const scheduleLabel = (member.membershipDetails?.workOutTime || []).join(', ');
		const title = 'Client inactivity alert';
		const message = `${member.firstName} ${member.lastName} missed 5 consecutive scheduled days (${scheduleLabel || 'No schedule'}).`;
		const baseMeta = {
			memberId: member._id.toString(),
			transactionId: txAny._id.toString(),
			streak: 5,
			schedule: member.membershipDetails?.workOutTime || [],
			lastAttendedDate: lastAttendedYmd,
			triggerDate: triggerYmd,
		};

		await createDedupedNotification({
			recipientId: member._id.toString(),
			recipientRole: 'member',
			type: 'INACTIVITY',
			title, message,
			dedupeKey: `inact:${txAny._id.toString()}:${triggerYmd}:member:${member._id.toString()}`,
			metadata: baseMeta,
		});
		for (const admin of admins) {
			await createDedupedNotification({
				recipientId: admin._id.toString(),
				recipientRole: 'admin',
				type: 'INACTIVITY',
				title, message,
				dedupeKey: `inact:${txAny._id.toString()}:${triggerYmd}:admin:${admin._id.toString()}`,
				metadata: baseMeta,
			});
		}
		for (const coach of coaches) {
			await createDedupedNotification({
				recipientId: coach._id.toString(),
				recipientRole: 'coach',
				type: 'INACTIVITY',
				title, message,
				dedupeKey: `inact:${txAny._id.toString()}:${triggerYmd}:coach:${coach._id.toString()}`,
				metadata: baseMeta,
			});
		}
	}
}

class NotificationAutomationService {
	private timer: NodeJS.Timeout | null = null;
	private running = false;

	start() {
		if (this.timer) return;
		void this.runCycle();
		const mins = Math.max(5, Number(process.env.NOTIFICATION_CHECK_INTERVAL_MINUTES || 60));
		this.timer = setInterval(() => void this.runCycle(), mins * 60 * 1000);
	}

	stop() {
		if (this.timer) clearInterval(this.timer);
		this.timer = null;
	}

	private async runCycle() {
		if (this.running) return;
		this.running = true;
		try {
			await runMembershipExpiringSoonCheck();
			await runMonthlyInactivityCheck();
		} catch (error) {
			console.error('[notification-automation] cycle failed:', error);
		} finally {
			this.running = false;
		}
	}
}

export const notificationAutomationService = new NotificationAutomationService();
