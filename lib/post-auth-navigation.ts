import type { User } from '@/graphql/generated/types';
import { router, type Href } from 'expo-router';
import { InteractionManager } from 'react-native';

/**
 * After OAuth / sign-in from `(auth)`, a bare `replace('/')` can flash “Unmatched route”.
 * `dismissAll` pops to the root stack first; defer `replace` until after transitions
 * so Android release builds don’t navigate mid–auth-session handoff.
 */
export function replaceToAppRoot() {
	try {
		router.dismissAll();
	} catch {
		/* noop */
	}
	InteractionManager.runAfterInteractions(() => {
		requestAnimationFrame(() => {
			try {
				router.replace('/' as Href);
			} catch {
				/* noop */
			}
		});
	});
}

export function getPostRegistrationHref(user: User): Href {
	if (user.role === 'coach') return '/(coach)/dashboard';
	if (user.role === 'member') {
		return user.membershipDetails?.hasEnteredDetails
			? '/(member)/dashboard'
			: '/(auth)/(onboarding)/first';
	}
	if (user.role === 'admin') return '/';
	return '/(auth)/login';
}
