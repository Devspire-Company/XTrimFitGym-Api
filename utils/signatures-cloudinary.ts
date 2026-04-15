import * as FileSystem from 'expo-file-system';
import { getUploadBaseUrl, uploadImageToCloudinary } from '@/utils/cloudinary-upload';
import { storage } from '@/utils/storage';

async function uploadSignatureUri(
	uri: string,
	folder: string
): Promise<string> {
	const baseUrl = getUploadBaseUrl();
	const headers: Record<string, string> = {};
	const token = await storage.getItem('auth_token');
	if (token) headers.Authorization = `Bearer ${token}`;

	const formData = new FormData();
	formData.append('image', {
		// @ts-ignore React Native FormData file shape
		uri,
		name: `minor-waiver-sig-${Date.now()}.png`,
		type: 'image/png',
	});
	formData.append('folder', folder);

	const res = await fetch(`${baseUrl}/api/upload/image`, {
		method: 'POST',
		headers,
		body: formData as unknown as BodyInit,
	});
	if (!res.ok) {
		let msg = 'Failed to upload signature';
		try {
			const data = await res.json();
			msg = data?.error || data?.message || msg;
		} catch {
			// ignore
		}
		throw new Error(msg);
	}
	const data = await res.json();
	if (!data?.url) throw new Error('Upload succeeded but no URL returned');
	return data.url as string;
}

/**
 * Upload a PNG data URL (e.g. from `WaiverSignaturePad`) to Cloudinary via the existing upload API.
 */
export async function uploadSignatureDataUriToCloudinary(
	dataUri: string,
	folder: string
): Promise<string> {
	const comma = dataUri.indexOf(',');
	if (comma < 0 || !dataUri.startsWith('data:image')) {
		throw new Error('Invalid signature image');
	}

	// Primary path: upload data URI directly (works without local writable FS).
	try {
		return await uploadSignatureUri(dataUri, folder);
	} catch {
		// Fallback path below writes a temp file if directories are available.
	}

	const b64 = dataUri.slice(comma + 1);
	const dir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
	if (!dir) {
		throw new Error(
			'Could not upload signature directly and no writable cache directory is available.'
		);
	}
	const path = `${dir}waiver-sig-${Date.now()}.png`;
	await FileSystem.writeAsStringAsync(path, b64, {
		encoding: FileSystem.EncodingType.Base64,
	});
	try {
		return await uploadImageToCloudinary(path, {
			folder,
			fileName: 'minor-waiver-sig.png',
		});
	} finally {
		await FileSystem.deleteAsync(path, { idempotent: true });
	}
}
