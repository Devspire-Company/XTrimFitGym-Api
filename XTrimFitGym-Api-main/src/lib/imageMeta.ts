/**
 * Read width/height from JPEG or PNG buffer (minimal parser; no external deps).
 */
export function readImageDimensionsFromBuffer(buf: Buffer): {
	width: number;
	height: number;
	format: 'jpeg' | 'png' | 'unknown';
} | null {
	if (buf.length < 24) return null;

	// PNG
	if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
		const width = buf.readUInt32BE(16);
		const height = buf.readUInt32BE(20);
		if (width > 0 && width < 50000 && height > 0 && height < 50000) {
			return { width, height, format: 'png' };
		}
		return null;
	}

	// JPEG
	if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;

	let offset = 2;
	while (offset + 9 < buf.length) {
		if (buf[offset] !== 0xff) {
			offset++;
			continue;
		}
		const marker = buf[offset + 1];
		// Start of frame markers (baseline / extended / progressive)
		if (marker >= 0xc0 && marker <= 0xc3) {
			const height = buf.readUInt16BE(offset + 5);
			const width = buf.readUInt16BE(offset + 7);
			if (width > 0 && height > 0) {
				return { width, height, format: 'jpeg' };
			}
			return null;
		}
		if (marker === 0xd8 || marker === 0xd9) break;
		const segLen = buf.readUInt16BE(offset + 2);
		if (segLen < 2) break;
		offset += 2 + segLen;
	}
	return null;
}
