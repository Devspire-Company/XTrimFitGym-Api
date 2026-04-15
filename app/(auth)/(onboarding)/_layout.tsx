import { Stack } from 'expo-router';
import React from 'react';
import { OnboardingProvider } from '@/contexts/OnboardingContext';

const OnboardingLayout = () => {
	return (
		<OnboardingProvider>
			<Stack
				screenOptions={{
					headerShown: false,
				}}
			>
				<Stack.Screen name='first' />
				<Stack.Screen name='second' />
				<Stack.Screen name='third' />
				<Stack.Screen name='fourth' />
			</Stack>
		</OnboardingProvider>
	);
};

export default OnboardingLayout;

