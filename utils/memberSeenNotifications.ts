import { storage } from '@/utils/storage';

function storageKey(userId: string): string {
	return `member_seen_notification_ids:${userId}`;
}

export async function getMemberSeenNotificationIds(
	userId: string
): Promise<Set<string>> {
	try {
		const raw = await storage.getItem(storageKey(userId));
		if (!raw) return new Set();
		const arr = JSON.parse(raw) as unknown;
		if (!Array.isArray(arr)) return new Set();
		return new Set(arr.filter((x): x is string => typeof x === 'string'));
	} catch {
		return new Set();
	}
}

export async function addMemberSeenNotificationIds(
	userId: string,
	ids: string[]
): Promise<boolean> {
	if (ids.length === 0) return false;
	const prev = await getMemberSeenNotificationIds(userId);
	let changed = false;
	for (const id of ids) {
		if (!prev.has(id)) {
			prev.add(id);
			changed = true;
		}
	}
	if (changed) {
		await storage.setItem(storageKey(userId), JSON.stringify([...prev]));
	}
	return changed;
}

/** Same filter as NotificationsDrawer / TabHeader for coach-request status (24h). */
export function recentMemberRequestStatusNotificationIds(
	clientRequestsData: unknown
): string[] {
	const clientRequests = (clientRequestsData as { getClientRequests?: unknown[] })
		?.getClientRequests;
	if (!Array.isArray(clientRequests)) return [];
	const now = new Date();
	return clientRequests
		.filter((request: any) => {
			if (!request?.id) return false;
			if (request.status !== 'approved' && request.status !== 'denied') return false;
			if (!request.coach?.id) return false;
			const updatedAt = new Date(request.updatedAt);
			const hoursSinceUpdate =
				(now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
			return hoursSinceUpdate < 24;
		})
		.map((r: any) => `requestStatus-${r.id}`);
}
