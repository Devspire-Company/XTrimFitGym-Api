import type { TokenCache } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const clerkTokenCache: TokenCache = {
	async getToken(key: string) {
		try {
			if (Platform.OS === 'web') {
				return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
			}
			return await SecureStore.getItemAsync(key);
		} catch {
			return null;
		}
	},
	async saveToken(key: string, token: string) {
		try {
			if (Platform.OS === 'web') {
				if (typeof localStorage !== 'undefined') localStorage.setItem(key, token);
				return;
			}
			await SecureStore.setItemAsync(key, token);
		} catch {
			// ignore
		}
	},
};
