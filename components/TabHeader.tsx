import { useAuth } from '@/contexts/AuthContext';
import {
	GET_CLIENT_SESSIONS_QUERY,
	GET_CLIENT_REQUESTS_QUERY,
	GET_COACH_SESSIONS_QUERY,
	GET_PENDING_COACH_REQUESTS_QUERY,
} from '@/graphql/queries';
import {
	addMemberSeenNotificationIds,
	getMemberSeenNotificationIds,
	recentMemberRequestStatusNotificationIds,
} from '@/utils/memberSeenNotifications';
import { useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import NotificationsDrawer from './NotificationsDrawer';
import ProfileDropdown from './ProfileDropdown';

interface TabHeaderProps {
	showCoachIcon?: boolean;
}

const TabHeader: React.FC<TabHeaderProps> = ({ showCoachIcon = false }) => {
	const { user } = useAuth();
	const router = useRouter();
	const [showNotifications, setShowNotifications] = useState(false);
	const [showProfileDropdown, setShowProfileDropdown] = useState(false);
	const shakeAnim = useRef(new Animated.Value(0)).current;
	const previousRequestCountRef = useRef(0);
	const [memberSeenIds, setMemberSeenIds] = useState<Set<string>>(new Set());

	const { data: coachRequestsData } = useQuery(GET_PENDING_COACH_REQUESTS_QUERY, {
		skip: user?.role !== 'coach',
		fetchPolicy: 'network-only',
		pollInterval: user?.role === 'coach' ? 2000 : 0,
		errorPolicy: 'all',
		notifyOnNetworkStatusChange: true,
	});

	const { data: clientRequestsData } = useQuery(GET_CLIENT_REQUESTS_QUERY, {
		skip: !user?.id || user?.role !== 'member',
		variables: { clientId: user?.id || '' },
		fetchPolicy: 'cache-and-network',
		pollInterval: user?.role === 'member' ? 2000 : 0,
		errorPolicy: 'all',
		notifyOnNetworkStatusChange: true,
	});

	const { data: coachSessionsForBadge } = useQuery(GET_COACH_SESSIONS_QUERY, {
		skip: !user?.id || user?.role !== 'coach',
		variables: { coachId: user?.id || '' },
		fetchPolicy: 'cache-and-network',
		pollInterval: user?.role === 'coach' ? 3000 : 0,
		errorPolicy: 'all',
		notifyOnNetworkStatusChange: true,
	});

	const { data: memberSessionsForBadge } = useQuery(GET_CLIENT_SESSIONS_QUERY, {
		skip: !user?.id || user?.role !== 'member',
		variables: { clientId: user?.id || '' },
		fetchPolicy: 'cache-and-network',
		pollInterval: user?.role === 'member' ? 3000 : 0,
		errorPolicy: 'all',
		notifyOnNetworkStatusChange: true,
	});

	const reloadMemberSeenIds = useCallback(async () => {
		if (!user?.id || user?.role !== 'member') return;
		const next = await getMemberSeenNotificationIds(user.id);
		setMemberSeenIds(next);
	}, [user?.id, user?.role]);

	useEffect(() => {
		void reloadMemberSeenIds();
	}, [reloadMemberSeenIds]);

	const pendingRequests = (coachRequestsData as any)?.getPendingCoachRequests;
	const validPendingRequests = Array.isArray(pendingRequests)
		? pendingRequests.filter(
				(request: any) => request && request.id && request.client && request.client.id
		  )
		: [];
	const pendingRequestCount = validPendingRequests.length;

	const pendingClassJoinRequestsForCoach = useMemo(() => {
		if (user?.role !== 'coach') return 0;
		const list = (coachSessionsForBadge as any)?.getCoachSessions || [];
		let n = 0;
		for (const s of list) {
			if (s.sessionKind !== 'group_class' || s.isTemplate || s.status === 'cancelled') continue;
			for (const e of s.enrollments || []) {
				if (e.status === 'pending') n++;
			}
		}
		return n;
	}, [coachSessionsForBadge, user?.role]);

	const pendingClassJoinAsMember = useMemo(() => {
		if (user?.role !== 'member' || !user?.id) return 0;
		const list = (memberSessionsForBadge as any)?.getClientSessions || [];
		let n = 0;
		for (const s of list) {
			if (s.sessionKind !== 'group_class') continue;
			const en = (s.enrollments || []).find((e: any) => e.clientId === user.id);
			if (en?.status === 'pending') n++;
		}
		return n;
	}, [memberSessionsForBadge, user?.role, user?.id]);

	const newStatusUpdatesCount = useMemo(() => {
		if (user?.role !== 'member' || !clientRequestsData) return 0;
		const ids = recentMemberRequestStatusNotificationIds(clientRequestsData);
		return ids.filter((id) => !memberSeenIds.has(id)).length;
	}, [clientRequestsData, user?.role, memberSeenIds]);

	const totalNotificationCount =
		user?.role === 'coach'
			? pendingRequestCount + pendingClassJoinRequestsForCoach
			: newStatusUpdatesCount + pendingClassJoinAsMember;

	useEffect(() => {
		if (totalNotificationCount > previousRequestCountRef.current) {
			// Shake animation sequence
			Animated.sequence([
				Animated.timing(shakeAnim, {
					toValue: 10,
					duration: 50,
					useNativeDriver: true,
				}),
				Animated.timing(shakeAnim, {
					toValue: -10,
					duration: 50,
					useNativeDriver: true,
				}),
				Animated.timing(shakeAnim, {
					toValue: 10,
					duration: 50,
					useNativeDriver: true,
				}),
				Animated.timing(shakeAnim, {
					toValue: 0,
					duration: 50,
					useNativeDriver: true,
				}),
			]).start();
		}
		previousRequestCountRef.current = totalNotificationCount;
	}, [totalNotificationCount, shakeAnim]);

	const handleCoachPress = () => {
		if (showCoachIcon) {
			router.push('/(member)/coaches');
		}
	};

	const openNotifications = () => {
		setShowNotifications(true);
		if (user?.role === 'member' && user?.id) {
			const ids = recentMemberRequestStatusNotificationIds(clientRequestsData);
			void addMemberSeenNotificationIds(user.id, ids).then((changed) => {
				if (changed) void reloadMemberSeenIds();
			});
		}
	};

	return (
		<>
			<View
				style={[
					styles.header,
					{
						paddingTop: 20,
						paddingBottom: 25,
					},
				]}
				className='bg-bg-darker border-b border-bg-primary'
			>
				<View className='flex-row items-center justify-between px-5'>
					{/* Left side - Coaches button (only for members) */}
					<View className='flex-1'>
						{showCoachIcon ? (
							<TouchableOpacity
								onPress={handleCoachPress}
								activeOpacity={0.7}
								className='flex-row items-center bg-[#F9C513]/10 border border-[#F9C513]/40 rounded-xl px-3 py-2.5 min-h-[44px] self-start'
							>
								<Ionicons name='people' size={20} color='#F9C513' />
								<Text className='text-text-primary font-semibold ml-2'>
									Coaches
								</Text>
							</TouchableOpacity>
						) : (
							<View />
						)}
					</View>

					{/* Center - App Logo */}
					<View className='flex-1 items-center'>
						<Image
							source={require('@/assets/logos/XTFG_icon_1024.png')}
							style={{ width: 120, height: 40 }}
							contentFit='contain'
						/>
					</View>

					{/* Right side - Notifications and Profile */}
					<View className='flex-1 flex-row items-center justify-end gap-3'>
						<TouchableOpacity onPress={openNotifications} className='relative'>
							<Animated.View
								style={{
									transform: [{ translateX: shakeAnim }],
								}}
							>
								<Ionicons name='notifications-outline' size={24} color='#F9C513' />
							</Animated.View>
							{totalNotificationCount > 0 && (
								<View className='absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1'>
									<Text className='text-white text-xs font-bold'>
										{totalNotificationCount > 9 ? '9+' : totalNotificationCount}
									</Text>
								</View>
							)}
						</TouchableOpacity>

						<TouchableOpacity
							onPress={() => setShowProfileDropdown(!showProfileDropdown)}
							className='relative'
						>
							{user?.firstName ? (
								<View className='bg-[#F9C513] rounded-full w-8 h-8 items-center justify-center'>
									<Text className='text-bg-darker font-bold text-sm'>
										{((user?.firstName || '').charAt(0) + (user?.lastName || '').charAt(0)).toUpperCase() || '?'}
									</Text>
								</View>
							) : (
								<Ionicons
									name='person-circle-outline'
									size={32}
									color='#F9C513'
								/>
							)}
						</TouchableOpacity>
					</View>
				</View>
			</View>

			{/* Notifications Drawer */}
			<NotificationsDrawer
				visible={showNotifications}
				onClose={() => setShowNotifications(false)}
				onMemberNotificationsViewed={reloadMemberSeenIds}
			/>

			{/* Profile Dropdown */}
			<ProfileDropdown
				visible={showProfileDropdown}
				onClose={() => setShowProfileDropdown(false)}
			/>
		</>
	);
};

const styles = StyleSheet.create({
	header: {
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 3.84,
		elevation: 5,
	},
});

export default TabHeader;
