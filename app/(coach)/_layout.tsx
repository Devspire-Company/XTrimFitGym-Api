import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CoachLayoutContent = () => {
	const insets = useSafeAreaInsets();

	const tabbarHeight =
		Platform.OS === 'android'
			? 75 + Math.max(insets.bottom, 12) - 8
			: 60 + Math.max(insets.bottom, 12) - 8;

	return (
		<View style={{ flex: 1 }}>
			<Tabs
				screenOptions={{
					headerShown: false,
					tabBarHideOnKeyboard: true,
					tabBarShowLabel: false,
					tabBarActiveTintColor: '#F9C513',
					tabBarInactiveTintColor: '#8E8E93',
					tabBarStyle: {
						backgroundColor: '#1C1C1E',
						borderTopColor: '#2C2C2E',
						borderTopWidth: 1,
						paddingTop: 8,
						paddingBottom: Math.max(insets.bottom, 12),
						height: tabbarHeight,
					},
				}}
			>
				<Tabs.Screen
					name='dashboard'
					options={{
						title: 'Dashboard',
						tabBarIcon: ({ color, size }) => (
							<Ionicons name='stats-chart' size={size} color={color} />
						),
					}}
				/>
				<Tabs.Screen
					name='progress'
					options={{
						title: 'Progress',
						tabBarIcon: ({ color, size }) => (
							<Ionicons name='trending-up' size={size} color={color} />
						),
					}}
				/>
				<Tabs.Screen
					name='clients'
					options={{
						title: 'Clients',
						tabBarIcon: ({ color, size }) => (
							<Ionicons name='people' size={size} color={color} />
						),
					}}
				/>
				<Tabs.Screen
					name='schedule'
					options={{
						title: 'Schedule',
						tabBarIcon: ({ color, size }) => (
							<Ionicons name='calendar' size={size} color={color} />
						),
					}}
				/>
				<Tabs.Screen name='equipment' options={{ href: null }} />
				<Tabs.Screen name='subscription' options={{ href: null }} />
				<Tabs.Screen name='profile' options={{ href: null }} />
				<Tabs.Screen name='sessions' options={{ href: null }} />
				<Tabs.Screen name='completed-sessions' options={{ href: null }} />
				<Tabs.Screen name='requests' options={{ href: null }} />
				<Tabs.Screen name='attendance' options={{ href: null }} />
				<Tabs.Screen name='help' options={{ href: null }} />
			</Tabs>
		</View>
	);
};

const CoachLayout = () => {
	return (
		<ProtectedRoute allowedRoles={['coach']}>
			<CoachLayoutContent />
		</ProtectedRoute>
	);
};

export default CoachLayout;
