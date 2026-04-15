/**
 * POST /api/verify/guardian-id-image
 * Automated checks on an uploaded ID-style image. This does NOT cryptographically
 * prove a document is a genuine government ID — integrate a KYC provider for that.
 */
import express from 'express';
import { getAuthUserFromHttpRequest } from '../context/auth-context.js';
import { readImageDimensionsFromBuffer } from '../lib/imageMeta.js';

const router = express.Router();

/** ISO/IEC 7810 ID-1 credit-card size: width / height */
const ID1_ASPECT_WIDTH_OVER_HEIGHT = 85.6 / 53.98;
const ASPECT_TOLERANCE = 0.14;
const MIN_SHORT_EDGE = 320;

function isAllowedImageUrl(urlStr: string): { ok: boolean; reason?: string } {
	try {
		const u = new URL(urlStr);
		if (u.protocol !== 'https:') {
			return { ok: false, reason: 'URL must use HTTPS' };
		}
		const host = u.hostname.toLowerCase();
		if (
			!host.includes('cloudinary.com') &&
			!host.includes('res.cloudinary.com') &&
			!host.includes('localhost') &&
			!host.includes('127.0.0.1')
		) {
			return { ok: false, reason: 'Image URL host is not allowed' };
		}
		if (!u.pathname.includes('guardian-id-verification')) {
			return { ok: false, reason: 'Image must be from the guardian ID verification folder' };
		}
		return { ok: true };
	} catch {
		return { ok: false, reason: 'Invalid URL' };
	}
}

router.post('/guardian-id-image', express.json(), async (req, res) => {
	try {
		const user = await getAuthUserFromHttpRequest(req);
		if (!user) {
			return res.status(401).json({ verified: false, error: 'Unauthorized' });
		}

		const imageUrl = typeof req.body?.imageUrl === 'string' ? req.body.imageUrl.trim() : '';
		if (!imageUrl) {
			return res.status(400).json({ verified: false, error: 'imageUrl is required' });
		}

		const urlCheck = isAllowedImageUrl(imageUrl);
		if (!urlCheck.ok) {
			return res.status(400).json({ verified: false, error: urlCheck.reason });
		}

		const ctrl = new AbortController();
		const timeout = setTimeout(() => ctrl.abort(), 25_000);
		let buf: Buffer;
		try {
			const r = await fetch(imageUrl, { signal: ctrl.signal, redirect: 'follow' });
			if (!r.ok) {
				return res.status(400).json({
					verified: false,
					error: `Could not fetch image (HTTP ${r.status})`,
				});
			}
			const ct = (r.headers.get('content-type') || '').toLowerCase();
			if (ct && !ct.includes('image') && !ct.includes('octet-stream')) {
				return res.status(400).json({
					verified: false,
					error: 'Response is not an image',
				});
			}
			const ab = await r.arrayBuffer();
			buf = Buffer.from(ab);
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : 'Fetch failed';
			return res.status(400).json({ verified: false, error: msg });
		} finally {
			clearTimeout(timeout);
		}

		if (buf.length > 12 * 1024 * 1024) {
			return res.status(400).json({ verified: false, error: 'Image too large' });
		}

		const dims = readImageDimensionsFromBuffer(buf);
		if (!dims) {
			return res.json({
				verified: false,
				checks: {
					urlReachable: true,
					decodableImage: false,
				},
				message:
					'Could not read image dimensions. Use a clear JPEG or PNG of the ID in the frame.',
			});
		}

		const w = dims.width;
		const h = dims.height;
		const short = Math.min(w, h);
		const long = Math.max(w, h);
		const aspectLongOverShort = long / short;

		const ratioOk =
			Math.abs(aspectLongOverShort - ID1_ASPECT_WIDTH_OVER_HEIGHT) <= ASPECT_TOLERANCE ||
			Math.abs(aspectLongOverShort - 1 / ID1_ASPECT_WIDTH_OVER_HEIGHT) <= ASPECT_TOLERANCE;

		const minResOk = short >= MIN_SHORT_EDGE;

		const verified = ratioOk && minResOk;

		return res.json({
			verified,
			checks: {
				urlReachable: true,
				decodableImage: true,
				format: dims.format,
				width: w,
				height: h,
				aspectRatio: Number(aspectLongOverShort.toFixed(3)),
				expectedId1Aspect: Number(ID1_ASPECT_WIDTH_OVER_HEIGHT.toFixed(3)),
				reasonableAspectRatio: ratioOk,
				minResolution: minResOk,
			},
			message: verified
				? 'Automated checks passed (size & ID-like proportions). Staff may still review the image; this is not cryptographic ID proof.'
				: !ratioOk
					? 'Photo proportions do not match a typical ID card. Align the ID inside the on-screen frame and retake.'
					: 'Image resolution is too low. Move closer with good lighting and retake.',
		});
	} catch (error: unknown) {
		const msg = error instanceof Error ? error.message : 'Verification error';
		console.error('[verify-guardian-id]', msg);
		return res.status(500).json({ verified: false, error: msg });
	}
});

export default router;
