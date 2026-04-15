import { MemberMeSyncAndWelcome } from '@/components/MemberMeSyncAndWelcome';
import { MemberWalkInBanner } from '@/components/MemberWalkInBanner';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import {
	MemberMembershipModalProvider,
	useMemberMembershipModal,
} from '@/contexts/MemberMembershipModalContext';
import {
	memberHasActiveGymMembership,
	memberNeedsFacilityBiometric,
} from '@/utils/memberMembership';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MemberLayoutContent = () => {
	const insets = useSafeAreaInsets();
	const { user } = useAuth();
	const hasMembership = memberHasActiveGymMembership(user);
	const needsFacilityBiometric = memberNeedsFacilityBiometric(user);
	const { openMembershipRequired } = useMemberMembershipModal();

	const tabbarHeight =
		Platform.OS === 'android'
			? 75 + Math.max(insets.bottom, 12) - 8
			: 60 + Math.max(insets.bottom, 12) - 8;

	const blockTabIfNoMembership = {
		tabPress: (e: { preventDefault: () => void }) => {
			if (!hasMembership) {
				e.preventDefault();
				openMembershipRequired();
			} else if (needsFacilityBiometric) {
				e.preventDefault();
			}
		},
	};

	return (
		<View style={{ flex: 1 }}>
			{!hasMembership ? <MemberWalkInBanner /> : null}
			<View style={{ flex: 1 }}>
				<Tabs
				initialRouteName={hasMembership ? 'dashboard' : 'workouts'}
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
					listeners={blockTabIfNoMembership}
					options={{
						title: 'Dashboard',
						tabBarIcon: ({ color, size, focused }) => (
							<Ionicons
								name={focused ? 'stats-chart' : 'stats-chart-outline'}
								size={size}
								color={color}
							/>
						),
					}}
				/>
				<Tabs.Screen
					name='workouts'
					options={{
						title: 'Workouts',
						tabBarIcon: ({ color, size, focused }) => (
							<Ionicons
								name={focused ? 'barbell' : 'barbell-outline'}
								size={size}
								color={color}
							/>
						),
					}}
				/>
				<Tabs.Screen
					name='schedule'
					listeners={blockTabIfNoMembership}
					options={{
						title: 'Schedule',
						tabBarIcon: ({ color, size, focused }) => (
							<Ionicons
								name={focused ? 'calendar' : 'calendar-outline'}
								size={size}
								color={color}
							/>
						),
					}}
				/>
				<Tabs.Screen
					name='progress'
					listeners={blockTabIfNoMembership}
					options={{
						title: 'Progress',
						tabBarIcon: ({ color, size, focused }) => (
							<Ionicons
								name={focused ? 'trending-up' : 'trending-up-outline'}
								size={size}
								color={color}
							/>
						),
					}}
				/>
				<Tabs.Screen name='equipment' options={{ href: null }} />
				<Tabs.Screen name='subscription' options={{ href: null }} />
				<Tabs.Screen name='coaches' options={{ href: null }} />
				<Tabs.Screen name='profile' options={{ href: null }} />
				<Tabs.Screen name='session-logs' options={{ href: null }} />
				<Tabs.Screen name='attendance' options={{ href: null }} />
				<Tabs.Screen name='help' options={{ href: null }} />
				</Tabs>
			</View>
		</View>
	);
};

const MemberLayout = () => {
	return (
		<ProtectedRoute allowedRoles={['member']}>
			<MemberMembershipModalProvider>
				<MemberMeSyncAndWelcome />
				<MemberLayoutContent />
			</MemberMembershipModalProvider>
		</ProtectedRoute>
	);
};

export default MemberLayout;
