import { getUploadBaseUrl } from '@/utils/cloudinary-upload';
import { storage } from '@/utils/storage';

export type GuardianIdVerificationResponse = {
	verified: boolean;
	checks?: Record<string, unknown>;
	message?: string;
	error?: string;
	/** True when backend verification is unavailable and app falls back to manual review. */
	softVerified?: boolean;
};

/**
 * Calls the API to run automated checks on the uploaded guardian ID image
 * (proportions similar to ISO ID-1, minimum resolution). Not a government ID authenticity check.
 */
export async function verifyGuardianIdImage(
	imageUrl: string
): Promise<GuardianIdVerificationResponse> {
	const baseUrl = getUploadBaseUrl();
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	const token = await storage.getItem('auth_token');
	if (token) headers.Authorization = `Bearer ${token}`;

	let res: Response;
	try {
		res = await fetch(`${baseUrl}/api/verify/guardian-id-image`, {
			method: 'POST',
			headers,
			body: JSON.stringify({ imageUrl }),
		});
	} catch (e: unknown) {
		// If verify API is down/unreachable, do not block onboarding.
		return {
			verified: true,
			softVerified: true,
			message:
				'ID verify service is temporarily unavailable. We saved your photo and will rely on manual review.',
			error: (e as Error)?.message,
		};
	}

	let body: GuardianIdVerificationResponse = {};
	try {
		body = await res.json();
	} catch {
		// Often indicates old backend without `/api/verify` route (e.g. HTML 404).
		return {
			verified: true,
			softVerified: true,
			message:
				'ID verify endpoint is not available on the current server. We saved your photo and will use manual review.',
			error: `Invalid server response (HTTP ${res.status})`,
		};
	}

	if (!res.ok) {
		return {
			verified: false,
			error: body.error || `Request failed (${res.status})`,
			message: body.message,
		};
	}
	return body;
}
