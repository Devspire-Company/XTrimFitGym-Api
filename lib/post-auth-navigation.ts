import type { User } from '@/graphql/generated/types';
import { router, type Href } from 'expo-router';
import { InteractionManager } from 'react-native';

/**
 * After OAuth / sign-in from `(auth)`, a bare `replace('/')` can flash “Unmatched route”.
 * Optionally `dismissAll` first to clear modal stacks — only when the router can dismiss,
 * otherwise `dismissAll` dispatches POP_TO_TOP and React Navigation logs a dev warning
 * (“not handled by any navigator”) on single-screen stacks.
 */
export function replaceToAppRoot() {
	const r = router as typeof router & { canDismiss?: () => boolean; dismissAll?: () => void };
	if (typeof r.canDismiss === 'function' && r.canDismiss()) {
		try {
			r.dismissAll?.();
		} catch {
			/* noop */
		}
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
