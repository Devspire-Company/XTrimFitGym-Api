import { useAuth } from '@/contexts/AuthContext';
import { useAppSelector } from '@/store/hooks';
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useRef } from 'react';

const AuthLayout = () => {
	const { isAuthenticated } = useAuth();
	const user = useAppSelector((state) => state.user.user);
	const router = useRouter();
	const segments = useSegments();
	const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastUserRef = useRef<string | null>(null);

	useEffect(() => {
		if (navigationTimeoutRef.current) {
			clearTimeout(navigationTimeoutRef.current);
			navigationTimeoutRef.current = null;
		}
		if (!isAuthenticated || !user) {
			lastUserRef.current = null;
			return;
		}

		const userKey = `${user.id}-${(user as any).role}-${user.membershipDetails?.hasEnteredDetails ?? false}`;
		if (lastUserRef.current === userKey) return;

		const currentRoute = segments.join('/');
		const isInOnboarding =
			currentRoute.includes('(onboarding)') ||
			segments.includes('(onboarding)') ||
			segments.includes('first') ||
			segments.includes('second') ||
			segments.includes('third') ||
			segments.includes('fourth');

		let targetRoute: string | null = null;

		if (user.role === 'coach') {
			if (!currentRoute.includes('(coach)')) {
				targetRoute = '/(coach)/dashboard';
			}
		} else if (user.role === 'member') {
			const hasEnteredDetails =
				user.membershipDetails?.hasEnteredDetails ?? false;
			if (hasEnteredDetails) {
				if (isInOnboarding || !currentRoute.includes('(member)')) {
					targetRoute = '/(member)/dashboard';
				}
			} else {
				if (!isInOnboarding) {
					targetRoute = '/(auth)/(onboarding)/first';
				}
			}
		}

		if (targetRoute) {
			lastUserRef.current = userKey;
			navigationTimeoutRef.current = setTimeout(() => {
				try {
					router.replace(targetRoute as any);
				} catch (error) {
					console.error('Navigation error:', error);
					lastUserRef.current = null;
				}
			}, 150);
		} else {
			lastUserRef.current = userKey;
		}

		return () => {
			if (navigationTimeoutRef.current) {
				clearTimeout(navigationTimeoutRef.current);
				navigationTimeoutRef.current = null;
			}
		};
	}, [isAuthenticated, user, segments, router]);

	return (
		<Stack
			screenOptions={{
				headerShown: false,
			}}
		>
			<Stack.Screen name='login' options={{ animation: 'slide_from_left' }} />
			<Stack.Screen name='signup' options={{ animation: 'slide_from_right' }} />
			<Stack.Screen name='complete-registration' options={{ animation: 'slide_from_right' }} />
			<Stack.Screen name='(onboarding)' options={{ headerShown: false }} />
		</Stack>
	);
};

export default AuthLayout;
