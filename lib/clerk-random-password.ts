import * as Crypto from 'expo-crypto';

const ALPHABET =
	'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@$%^&*-_';

/** Satisfies Clerk “password required” without showing a password field (session-based app auth). */
export async function randomClerkPassword(): Promise<string> {
	const bytes = await Crypto.getRandomBytesAsync(28);
	return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}
