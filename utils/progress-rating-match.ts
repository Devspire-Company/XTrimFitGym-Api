/**
 * Match a session log to progress rating `sessionLogIds` from the API.
 * Handles string IDs and populated/ref-shaped entries from older responses.
 */
export function progressRatingIncludesSessionLog(
	rating: { sessionLogIds?: unknown[] },
	sessionLogId: string | undefined
): boolean {
	if (!sessionLogId) return false;
	const target = String(sessionLogId);
	for (const entry of rating.sessionLogIds || []) {
		if (entry == null) continue;
		if (typeof entry === 'string' && entry === target) return true;
		if (typeof entry === 'object') {
			const id = (entry as { id?: unknown; _id?: unknown }).id ?? (entry as { _id?: unknown })._id;
			if (id != null && String(id) === target) return true;
		}
	}
	return false;
}
