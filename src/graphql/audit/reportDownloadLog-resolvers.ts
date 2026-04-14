import mongoose from 'mongoose';
import ReportDownloadLog from '../../database/models/audit/reportDownloadLog-schema.js';
import User from '../../database/models/user/user-schema.js';
import type { IAuthContext } from '../../context/auth-context.js';

type Context = IAuthContext;

const requireAdmin = (context: Context) => {
	if (context.auth.user?.role !== 'admin') {
		throw new Error('Unauthorized: Admin only');
	}
};

const toDateOrNull = (value?: string | null) => {
	if (!value) return null;
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return null;
	return d;
};

const toObjectIdString = (value: unknown): string | null => {
	if (!value) return null;
	if (typeof value === 'string') {
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : null;
	}
	if (value instanceof mongoose.Types.ObjectId) {
		return value.toString();
	}
	if (typeof value === 'object') {
		const obj = value as Record<string, unknown>;
		const nestedCandidate =
			obj.id ??
			obj._id ??
			obj.value ??
			(obj.$oid as unknown) ??
			((obj._id as Record<string, unknown> | undefined)?.$oid as unknown);
		if (typeof nestedCandidate === 'string' && nestedCandidate.trim().length > 0) {
			return nestedCandidate.trim();
		}
		if (nestedCandidate instanceof mongoose.Types.ObjectId) {
			return nestedCandidate.toString();
		}
	}
	return null;
};

const mapDownloadedByUser = (value: unknown) => {
	if (!value || typeof value !== 'object') return null;
	if (value instanceof mongoose.Types.ObjectId) return null;
	const obj = value as Record<string, unknown>;
	const id = toObjectIdString(obj.id ?? obj._id);
	const firstName = typeof obj.firstName === 'string' ? obj.firstName : null;
	const lastName = typeof obj.lastName === 'string' ? obj.lastName : null;
	const email = typeof obj.email === 'string' ? obj.email : null;
	const role = typeof obj.role === 'string' ? obj.role : null;
	if (!id && !firstName && !lastName && !email && !role) return null;
	return {
		id: id ?? '',
		firstName,
		lastName,
		email,
		role,
	};
};

const mapLog = (doc: any) => ({
	id: doc._id.toString(),
	reportType: doc.reportType,
	format: doc.format,
	downloadedById: toObjectIdString(doc.downloadedBy) ?? '',
	downloadedByRole: doc.downloadedByRole,
	downloadedBy: mapDownloadedByUser(doc.downloadedBy),
	fileName: doc.fileName ?? null,
	dateRange: doc.dateRange
		? {
				startDate: doc.dateRange.startDate?.toISOString?.() ?? null,
				endDate: doc.dateRange.endDate?.toISOString?.() ?? null,
		  }
		: null,
	filterSummary: doc.filterSummary ?? null,
	metadataJson: doc.metadataJson ?? null,
	createdAt: doc.createdAt?.toISOString?.() ?? null,
	updatedAt: doc.updatedAt?.toISOString?.() ?? null,
});

export default {
	Query: {
		getReportDownloadLogs: async (
			_: unknown,
			{
				limit,
				offset,
				reportType,
			}: { limit?: number; offset?: number; reportType?: string },
			context: Context
		) => {
			requireAdmin(context);
			const lim = Math.min(Math.max(limit ?? 50, 1), 500);
			const off = Math.max(offset ?? 0, 0);
			const query: Record<string, unknown> = {};
			if (reportType) query.reportType = reportType;
			const rows = await ReportDownloadLog.find(query)
				.sort({ createdAt: -1 })
				.skip(off)
				.limit(lim)
				.populate('downloadedBy', 'firstName lastName email role')
				.lean();
			return rows.map(mapLog);
		},
	},
	Mutation: {
		logReportDownload: async (
			_: unknown,
			{
				input,
			}: {
				input: {
					reportType: string;
					fileName?: string;
					dateRange?: { startDate?: string; endDate?: string };
					filterSummary?: string;
					metadataJson?: string;
				};
			},
			context: Context
		) => {
			const authUser = context.auth.user;
			if (!authUser?.id) {
				throw new Error('Unauthorized: Please log in');
			}

			const user = await User.findById(authUser.id).select('role').lean();
			if (!user) {
				throw new Error('User not found');
			}

			const startDate = toDateOrNull(input.dateRange?.startDate);
			const endDate = toDateOrNull(input.dateRange?.endDate);

			const created = await ReportDownloadLog.create({
				reportType: input.reportType,
				format: 'PDF',
				downloadedBy: new mongoose.Types.ObjectId(authUser.id),
				downloadedByRole: user.role,
				fileName: input.fileName?.trim() || undefined,
				dateRange:
					startDate || endDate
						? {
								...(startDate ? { startDate } : {}),
								...(endDate ? { endDate } : {}),
						  }
						: undefined,
				filterSummary: input.filterSummary?.trim() || undefined,
				metadataJson: input.metadataJson?.trim() || undefined,
			});

			const populated = await ReportDownloadLog.findById(created._id)
				.populate('downloadedBy', 'firstName lastName email role')
				.lean();

			return mapLog(populated ?? created.toObject());
		},
	},
	ReportDownloadLog: {
		downloadedBy: async (parent: any) => {
			const mapped = mapDownloadedByUser(parent.downloadedBy);
			if (mapped) {
				return mapped;
			}
			const id = toObjectIdString(parent.downloadedById) || toObjectIdString(parent.downloadedBy);
			if (!id) return null;
			const user = await User.findById(id).select('firstName lastName email role').lean();
			if (!user) return null;
			return {
				id: user._id.toString(),
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
				role: user.role,
			};
		},
	},
};
