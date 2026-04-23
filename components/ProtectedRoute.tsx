import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Redirect, useSegments } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

interface ProtectedRouteProps {
	children: React.ReactNode;
	allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
	children,
	allowedRoles,
}) => {
	const { isAuthenticated, isLoading, user, onboardingStatus } = useAuth();
	const segments = useSegments();

	if (isLoading) {
		return (
			<View className='flex-1 justify-center items-center'>
				<ActivityIndicator size='large' />
				<Text className='mt-2.5 text-base text-gray-600'>Loading...</Text>
			</View>
		);
	}

	if (!isAuthenticated) {
		return <Redirect href='/(auth)/login' />;
	}

	const isInOnboarding = segments.some(
		(segment) =>
			segment === '(onboarding)' ||
			segment === 'first' ||
			segment === 'second' ||
			segment === 'third' ||
			segment === 'fourth' ||
			segment === 'fifth'
	);

	if (onboardingStatus !== 'completed' && !isInOnboarding) {
		return <Redirect href='/(auth)/(onboarding)/first' />;
	}

	if (allowedRoles && user) {
		const userRole = (user as { role?: string }).role;
		const validAllowedRoles = allowedRoles.filter(
			(r): r is 'coach' | 'member' => r != null
		);
		if (userRole != null && !validAllowedRoles.includes(userRole as any)) {
			if (userRole === 'coach') {
				return <Redirect href={'/(coach)/dashboard' as any} />;
			}
			if (userRole === 'member') {
				return <Redirect href={'/(member)/dashboard' as any} />;
			}
			return <Redirect href='/(auth)/login' />;
		}
	}

	return <>{children}</>;
};
