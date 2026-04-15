import { API_URL } from '@/lib/apollo-client';
import { storage } from '@/utils/storage';

const stripGraphql = (url: string) => url.replace(/\/graphql\/?$/, '') || url;

export function getUploadBaseUrl(): string {
	return stripGraphql(API_URL);
}

const UPLOAD_MAX_RETRIES = 1;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type UploadImageOptions = {
	/** Cloudinary folder path */
	folder: string;
	/** Multipart filename hint */
	fileName?: string;
};

/**
 * POST image to API `/api/upload/image` (same as session progress photos).
 */
export async function uploadImageToCloudinary(
	imageUri: string,
	options: UploadImageOptions
): Promise<string> {
	if (!imageUri?.trim()) throw new Error('No image to upload');

	const baseUrl = getUploadBaseUrl();
	const headers: Record<string, string> = {};
	const token = await storage.getItem('auth_token');
	if (token) headers.Authorization = `Bearer ${token}`;

	const fileName = options.fileName || 'upload.jpg';

	for (let attempt = 0; attempt <= UPLOAD_MAX_RETRIES; attempt++) {
		try {
			const formData = new FormData();
			formData.append('image', {
				// @ts-ignore React Native FormData file shape
				uri: imageUri,
				name: fileName,
				type: 'image/jpeg',
			});
			formData.append('folder', options.folder);

			const res = await fetch(`${baseUrl}/api/upload/image`, {
				method: 'POST',
				headers,
				body: formData as unknown as BodyInit,
			});

			if (res.status < 200 || res.status >= 300) {
				let msg = 'Failed to upload image';
				try {
					const parsed = await res.json();
					msg = parsed?.error || parsed?.message || msg;
				} catch {
					// ignore
				}
				throw new Error(msg);
			}

			const data = await res.json();
			if (!data?.url) throw new Error('Upload succeeded but no URL returned');
			return data.url as string;
		} catch (err: unknown) {
			const msg = String((err as Error)?.message || '');
			const isRetryable = /network|failed to fetch|connection|timeout|timed out|aborted|socket|econn|eai_again|ehostunreach/i.test(
				msg
			);

			if (attempt < UPLOAD_MAX_RETRIES && isRetryable) {
				await sleep(800 * Math.pow(2, attempt));
				continue;
			}

			if (/timeout|timed out/i.test(msg)) {
				throw new Error('Upload timed out. Check your connection and try again.');
			}
			if (isRetryable) {
				throw new Error(
					`Connection problem. Check your network and try again.\n\nDetails: ${msg}`
				);
			}
			throw err;
		}
	}

	throw new Error('Upload failed');
}
