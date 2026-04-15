import { setClerkTokenGetter } from '@/lib/clerk-token';
import { useAuth } from '@clerk/clerk-expo';
import { useEffect } from 'react';

/** Wires Clerk session token into Apollo auth link. */
export function ClerkTokenBridge() {
	const { getToken, isLoaded } = useAuth();

	useEffect(() => {
		if (!isLoaded) {
			setClerkTokenGetter(null);
			return;
		}
		setClerkTokenGetter(() => getToken());
		return () => setClerkTokenGetter(null);
	}, [isLoaded, getToken]);

	return null;
}
