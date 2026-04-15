import { storage } from '@/utils/storage';

function storageKey(userId: string): string {
	return `dismissed_notification_ids:${userId}`;
}

const MAX_STORED = 400;

export async function getDismissedNotificationIds(
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

export async function addDismissedNotificationIds(
	userId: string,
	ids: string[]
): Promise<void> {
	if (ids.length === 0) return;
	const prev = await getDismissedNotificationIds(userId);
	for (const id of ids) prev.add(id);
	const arr = [...prev];
	const trimmed =
		arr.length > MAX_STORED ? arr.slice(arr.length - MAX_STORED) : arr;
	await storage.setItem(storageKey(userId), JSON.stringify(trimmed));
}
