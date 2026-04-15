import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/contexts/AuthContext';
import { UPDATE_COACH_REQUEST_MUTATION } from '@/graphql/mutations';
import {
	GET_CLIENT_SESSIONS_QUERY,
	GET_CLIENT_REQUESTS_QUERY,
	GET_COACH_SESSIONS_QUERY,
	GET_PENDING_COACH_REQUESTS_QUERY,
	GET_UPCOMING_SESSIONS_QUERY,
	GET_USER_QUERY,
	GET_USERS_QUERY,
	GET_MY_SUBSCRIPTION_REQUESTS_QUERY,
} from '@/graphql/queries';
import { useAppDispatch } from '@/store/hooks';
import { updateUser } from '@/store/slices/userSlice';
import { addDismissedNotificationIds, getDismissedNotificationIds } from '@/utils/dismissedNotifications';
import {
	addMemberSeenNotificationIds,
	recentMemberRequestStatusNotificationIds,
} from '@/utils/memberSeenNotifications';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import {
	Animated,
	FlatList,
	Modal,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NotificationsDrawerProps {
	visible: boolean;
	onClose: () => void;
	/** After member request-status items are marked seen in storage, refresh TabHeader badge. */
	onMemberNotificationsViewed?: () => void;
}

interface Notification {
	id: string;
	type:
		| 'session'
		| 'membership'
		| 'progress'
		| 'coachRequest'
		| 'requestStatus'
		| 'coachRemoved'
		| 'classJoinRequest'
		| 'classJoinPending'
		| 'classJoinAccepted';
	title: string;
	message: string;
	time: string;
	read: boolean;
	requestId?: string;
	coachRequest?: any;
}

// Swipeable notification item component
const SwipeableNotificationItem = React.memo<{
	notification: Notification;
	onApprove?: (requestId: string) => void;
	onReject?: (requestId: string) => void;
	/** Swipe-to-delete: ask parent to show confirm (do not dismiss yet). */
	onSwipeDeleteRequest: (id: string) => void;
	selectionMode: boolean;
	selected: boolean;
	onToggleSelect: (id: string) => void;
	swipeResetTick: number;
}>(({
	notification,
	onApprove,
	onReject,
	onSwipeDeleteRequest,
	selectionMode,
	selected,
	onToggleSelect,
	swipeResetTick,
}) => {
	const swipeableRef = useRef<Swipeable>(null);

	useEffect(() => {
		swipeableRef.current?.close();
	}, [swipeResetTick]);

	const getNotificationIcon = (type: string) => {
		switch (type) {
			case 'session':
				return 'calendar';
			case 'membership':
				return 'card';
			case 'progress':
				return 'trending-up';
			case 'coachRequest':
				return 'person-add';
			case 'requestStatus':
				return 'checkmark-circle';
			case 'coachRemoved':
				return 'person-remove';
			case 'classJoinRequest':
			case 'classJoinPending':
				return 'people';
			case 'classJoinAccepted':
				return 'checkmark-done';
			default:
				return 'notifications';
		}
	};

	const getNotificationColor = (type: string) => {
		switch (type) {
			case 'session':
				return '#F9C513';
			case 'membership':
				return '#E41E26';
			case 'progress':
				return '#34C759';
			case 'coachRequest':
				return '#007AFF';
			case 'requestStatus':
				return '#34C759';
			case 'coachRemoved':
				return '#FF3B30';
			case 'classJoinRequest':
			case 'classJoinPending':
				return '#FF9F0A';
			case 'classJoinAccepted':
				return '#22C55E';
			default:
				return '#8E8E93';
		}
	};

	const iconColor = getNotificationColor(notification.type);
	const iconName = getNotificationIcon(notification.type);

	// Render left actions (appears when swiping right)
	const renderLeftActions = (
		_progress: Animated.AnimatedInterpolation<string | number>,
		dragX: Animated.AnimatedInterpolation<string | number>
	) => {
		const scale = dragX.interpolate({
			inputRange: [0, 100],
			outputRange: [0, 1],
			extrapolate: 'clamp',
		});

		return (
			<View className='flex-row items-center justify-start bg-red-500 rounded-xl mb-3 px-6'>
				<Animated.View style={{ transform: [{ scale }] }}>
					<Ionicons name='trash-outline' size={28} color='#fff' />
				</Animated.View>
				<Text className='text-white font-semibold ml-2'>Delete</Text>
			</View>
		);
	};

	const handleSwipeableOpen = () => {
		onSwipeDeleteRequest(notification.id);
	};

	const rowInner = (
		<View className='bg-bg-darker rounded-xl p-4 mb-3'>
			<View className='flex-row items-start'>
				{selectionMode ? (
					<View className='mr-3 mt-2'>
						<Ionicons
							name={selected ? 'checkbox' : 'square-outline'}
							size={24}
							color={selected ? '#F9C513' : '#8E8E93'}
						/>
					</View>
				) : null}
				<View
					className='rounded-full mr-3 items-center justify-center'
					style={{
						backgroundColor: `${iconColor}20`,
						width: 48,
						height: 48,
					}}
				>
					<Ionicons name={iconName as any} size={24} color={iconColor} />
				</View>
				<View className='flex-1'>
						<View className='flex-row items-center justify-between mb-1'>
							<Text className='text-text-primary font-semibold text-base'>
								{notification.title}
							</Text>
							{!notification.read && (
								<View className='bg-[#F9C513] rounded-full w-2 h-2' />
							)}
						</View>
						<Text className='text-text-secondary text-sm mb-1'>
							{notification.message}
						</Text>
						<Text className='text-text-secondary text-xs mb-2'>
							{notification.time}
						</Text>
						{notification.type === 'coachRequest' &&
							notification.requestId &&
							onApprove &&
							onReject &&
							!selectionMode && (
								<View className='flex-row gap-2 mt-2'>
									<TouchableOpacity
										onPress={() => onApprove(notification.requestId!)}
										className='flex-1 bg-[#34C759] rounded-lg py-2 px-4 items-center'
									>
										<Text className='text-white font-semibold text-sm'>
											Accept
										</Text>
									</TouchableOpacity>
									<TouchableOpacity
										onPress={() => onReject(notification.requestId!)}
										className='flex-1 bg-[#FF3B30] rounded-lg py-2 px-4 items-center'
									>
										<Text className='text-white font-semibold text-sm'>
											Reject
										</Text>
									</TouchableOpacity>
								</View>
							)}
				</View>
			</View>
		</View>
	);

	if (selectionMode) {
		return (
			<TouchableOpacity
				activeOpacity={0.85}
				onPress={() => onToggleSelect(notification.id)}
			>
				{rowInner}
			</TouchableOpacity>
		);
	}

	return (
		<Swipeable
			ref={swipeableRef}
			renderLeftActions={renderLeftActions}
			onSwipeableOpen={handleSwipeableOpen}
			leftThreshold={40}
			friction={2}
		>
			{rowInner}
		</Swipeable>
	);
});

SwipeableNotificationItem.displayName = 'SwipeableNotificationItem';

const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
	visible,
	onClose,
	onMemberNotificationsViewed,
}) => {
	const insets = useSafeAreaInsets();
	const { user } = useAuth();
	const dispatch = useAppDispatch();
	const translateX = useRef(new Animated.Value(300)).current;
	const [dismissedNotifications, setDismissedNotifications] = useState<
		Set<string>
	>(new Set());
	const [selectionMode, setSelectionMode] = useState(false);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [swipeResetTick, setSwipeResetTick] = useState(0);
	const [deleteConfirm, setDeleteConfirm] = useState<{
		type: 'single' | 'bulk' | 'clear';
		ids: string[];
	} | null>(null);

	useEffect(() => {
		if (!visible || !user?.id) return;
		void getDismissedNotificationIds(user.id).then((s) =>
			setDismissedNotifications(s)
		);
	}, [visible, user?.id]);

	useEffect(() => {
		if (!visible) {
			setSelectionMode(false);
			setSelectedIds(new Set());
		}
	}, [visible]);

	// Animate drawer when visible changes
	useEffect(() => {
		if (visible) {
			Animated.spring(translateX, {
				toValue: 0,
				useNativeDriver: true,
				tension: 50,
				friction: 7,
			}).start();
		} else {
			Animated.spring(translateX, {
				toValue: 300,
				useNativeDriver: true,
				tension: 50,
				friction: 7,
			}).start();
		}
	}, [visible, translateX]);

	// Query for sessions (members) - Real-time polling
	const { data: sessionsData } = useQuery(GET_UPCOMING_SESSIONS_QUERY, {
		skip: !visible || user?.role !== 'member',
		fetchPolicy: 'cache-and-network',
		pollInterval: user?.role === 'member' && visible ? 2000 : 0, // Poll every 2 seconds for real-time updates
		notifyOnNetworkStatusChange: true,
	});

	// Query for pending coach requests (coaches) - Real-time polling
	// Note: Polling should work even when drawer is not visible to update badge
	const { data: coachRequestsData, refetch: refetchCoachRequests } = useQuery(
		GET_PENDING_COACH_REQUESTS_QUERY,
		{
			skip: user?.role !== 'coach', // Only skip if not a coach, not based on visibility
			fetchPolicy: 'network-only', // Always fetch from network for real-time updates
			pollInterval: user?.role === 'coach' ? 2000 : 0, // Poll every 2 seconds for real-time updates (even when drawer closed)
			errorPolicy: 'all', // Allow partial data even if some fields fail
			notifyOnNetworkStatusChange: true,
		}
	);

	// Query for client requests to get accepted/rejected status (members) - Real-time polling
	const { data: clientRequestsData, refetch: refetchClientRequests } = useQuery(
		GET_CLIENT_REQUESTS_QUERY,
		{
			skip: !visible || !user?.id || user?.role !== 'member',
			variables: { clientId: user?.id || '' },
			fetchPolicy: 'cache-and-network',
			pollInterval: user?.role === 'member' && visible ? 2000 : 0, // Poll every 2 seconds for real-time updates
			errorPolicy: 'all', // Allow partial data even if some fields fail
			notifyOnNetworkStatusChange: true,
		}
	);

	// Member opened notifications: mark coach-request status rows as seen when drawer has data (badge clears)
	useEffect(() => {
		if (!visible || user?.role !== 'member' || !user?.id) return;
		const ids = recentMemberRequestStatusNotificationIds(clientRequestsData);
		if (ids.length === 0) return;
		void addMemberSeenNotificationIds(user.id, ids).then((changed) => {
			if (changed) onMemberNotificationsViewed?.();
		});
	}, [
		visible,
		user?.id,
		user?.role,
		clientRequestsData,
		onMemberNotificationsViewed,
	]);

	// Query coaches to detect removals (members) - Real-time polling
	const { data: coachesData } = useQuery(GET_USERS_QUERY, {
		skip: !visible || user?.role !== 'member',
		variables: { role: 'coach' },
		fetchPolicy: 'cache-and-network',
		pollInterval: user?.role === 'member' && visible ? 2000 : 0, // Poll every 2 seconds to detect removals
		notifyOnNetworkStatusChange: true,
	});

	// Query current user in real-time to detect coach removals (members)
	const { data: currentUserData } = useQuery(GET_USER_QUERY, {
		skip: !visible || !user?.id || user?.role !== 'member',
		variables: { id: user?.id || '' },
		fetchPolicy: 'cache-and-network',
		pollInterval: user?.role === 'member' && visible ? 2000 : 0, // Poll every 2 seconds for real-time updates
		notifyOnNetworkStatusChange: true,
	});

	// Subscription request status for members (approved / rejected)
	const { data: subscriptionRequestsData } = useQuery(
		GET_MY_SUBSCRIPTION_REQUESTS_QUERY,
		{
			skip: !visible || user?.role !== 'member',
			fetchPolicy: 'cache-and-network',
			pollInterval: user?.role === 'member' && visible ? 2000 : 0,
			notifyOnNetworkStatusChange: true,
		}
	);

	// Group class join requests (coach) & member enrollment status — poll even when drawer closed so badge + alerts stay fresh
	const { data: coachSessionsDrawerData } = useQuery(GET_COACH_SESSIONS_QUERY, {
		skip: !user?.id || user?.role !== 'coach',
		variables: { coachId: user?.id || '' },
		fetchPolicy: 'cache-and-network',
		pollInterval: user?.role === 'coach' ? 3000 : 0,
		errorPolicy: 'all',
		notifyOnNetworkStatusChange: true,
	});

	const { data: memberSessionsDrawerData } = useQuery(GET_CLIENT_SESSIONS_QUERY, {
		skip: !user?.id || user?.role !== 'member',
		variables: { clientId: user?.id || '' },
		fetchPolicy: 'cache-and-network',
		pollInterval: user?.role === 'member' ? 3000 : 0,
		errorPolicy: 'all',
		notifyOnNetworkStatusChange: true,
	});

	// Lazy query to refetch current user after mutations
	const [refetchCurrentUser] = useLazyQuery(GET_USER_QUERY, {
		fetchPolicy: 'network-only', // Always fetch fresh data
	});

	// Track previous coachesIds to detect removals
	const previousCoachesIdsRef = useRef<string[]>([]);
	const [removedCoaches, setRemovedCoaches] = useState<string[]>([]);
	const [approveRequestId, setApproveRequestId] = useState<string | null>(null);
	const [denyRequestId, setDenyRequestId] = useState<string | null>(null);
	const [alertModal, setAlertModal] = useState<{
		visible: boolean;
		title: string;
		message: string;
		variant: 'danger' | 'neutral' | 'success';
	}>({ visible: false, title: '', message: '', variant: 'neutral' });

	const prevMemberClassEnrollRef = useRef<Map<string, string>>(new Map());
	const [classJoinAcceptedAlerts, setClassJoinAcceptedAlerts] = useState<
		Notification[]
	>([]);

	// Use currentUserData if available, otherwise fall back to user from context
	const userToCheck = (currentUserData as any)?.getUser || user;

	useEffect(() => {
		if (
			userToCheck?.role === 'member' &&
			userToCheck?.membershipDetails?.coachesIds
		) {
			const currentCoachesIds = (userToCheck.membershipDetails.coachesIds || [])
				.filter((id: any) => id != null)
				.map((id: any) => String(id));
			const previous = previousCoachesIdsRef.current;

			// Find coaches that were removed (only if we had previous data)
			if (previous.length > 0) {
				const removed = previous.filter(
					(id) => !currentCoachesIds.includes(id)
				);

				if (removed.length > 0) {
					setRemovedCoaches((prev) => {
						// Avoid duplicates
						const newRemoved = removed.filter((id) => !prev.includes(id));
						return [...prev, ...newRemoved];
					});
					// Update Redux store with latest user data
					const latestUser = (currentUserData as any)?.getUser;
					if (latestUser) {
						dispatch(updateUser(latestUser));
					}
				}
			}

			// Update previous coachesIds
			previousCoachesIdsRef.current = currentCoachesIds;
		}
	}, [
		userToCheck?.membershipDetails?.coachesIds,
		userToCheck?.role,
		currentUserData,
		dispatch,
	]);

	const [updateCoachRequest] = useMutation(UPDATE_COACH_REQUEST_MUTATION, {
		onCompleted: async () => {
			refetchCoachRequests();
			// Refetch client requests to show status updates
			if (user?.role === 'member') {
				refetchClientRequests();
			}
			// Refetch current user to update Redux store with latest data
			if (user?.id) {
				try {
					const result = await refetchCurrentUser({
						variables: { id: user.id },
					});
					const userData = (result.data as any)?.getUser;
					if (userData) {
						dispatch(updateUser(userData));
					}
				} catch (error) {
					console.error('Error refetching user:', error);
				}
			}
		},
		onError: (error) => {
			setAlertModal({ visible: true, title: 'Error', message: error.message, variant: 'danger' });
		},
	});

	const formatTimeAgo = useCallback((dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffInMs = now.getTime() - date.getTime();
		const diffInMins = Math.floor(diffInMs / (1000 * 60));
		const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
		const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

		if (diffInMins < 1) return 'Just now';
		if (diffInMins < 60)
			return `${diffInMins} min${diffInMins !== 1 ? 's' : ''} ago`;
		if (diffInHours < 24)
			return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
		if (diffInDays < 7)
			return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}, []);

	useEffect(() => {
		if (user?.role !== 'member' || !user?.id) return;
		const list = (memberSessionsDrawerData as any)?.getClientSessions;
		if (!Array.isArray(list)) return;
		const myId = user.id;
		const prev = prevMemberClassEnrollRef.current;
		const next = new Map(prev);
		for (const s of list) {
			if (s.sessionKind !== 'group_class') continue;
			const en = s.enrollments?.find((e: any) => e.clientId === myId);
			if (!en) continue;
			const key = s.id;
			const was = prev.get(key);
			if (was === 'pending' && en.status === 'accepted') {
				const nid = `classJoinAccepted-${s.id}`;
				setClassJoinAcceptedAlerts((a) => {
					if (a.some((x) => x.id === nid)) return a;
					const row: Notification = {
						id: nid,
						type: 'classJoinAccepted',
						title: 'Class request approved',
						message: `You're confirmed for "${s.name}".`,
						time: 'Just now',
						read: false,
					};
					return [row, ...a].slice(0, 20);
				});
			}
			next.set(key, en.status);
		}
		prevMemberClassEnrollRef.current = next;
	}, [memberSessionsDrawerData, user?.role, user?.id]);

	// Memoize notifications array for better performance
	const notifications = useMemo(() => {
		const allNotifications: Notification[] = [];

		allNotifications.push(...classJoinAcceptedAlerts);

		// Session notifications for members
		if (
			sessionsData &&
			Array.isArray((sessionsData as any).getUpcomingSessions) &&
			user?.role === 'member'
		) {
			const sessionNotifications: Notification[] = (
				sessionsData as any
			).getUpcomingSessions
				.slice(0, 5)
				.map((session: any) => {
					const sessionDate = new Date(session.date);
					const now = new Date();
					const hoursUntil = Math.floor(
						(sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60)
					);
					return {
						id: `session-${session.id}`,
						type: 'session' as const,
						title: 'Upcoming Session',
						message: `${session.name} with Coach ${session.coach?.firstName || ''} at ${session.startTime}`,
						time: hoursUntil > 0 ? `In ${hoursUntil} hours` : 'Today',
						read: false,
					};
				});
			allNotifications.push(...sessionNotifications);
		}

		// Coach request notifications for coaches (pending requests)
		if (user?.role === 'coach') {
			// Check if coachRequestsData exists and has the expected structure
			const pendingRequests = (coachRequestsData as any)
				?.getPendingCoachRequests;

			if (pendingRequests && Array.isArray(pendingRequests)) {
				const coachRequestNotifications: Notification[] = pendingRequests
					.filter((request: any) => {
						// Filter out requests with invalid client data
						return request && request.id && request.client && request.client.id;
					})
					.map((request: any) => {
						const clientName = request.client
							? `${request.client.firstName || ''} ${request.client.lastName || ''}`.trim() ||
								'A member'
							: 'A member';
						return {
							id: `coachRequest-${request.id}`,
							type: 'coachRequest' as const,
							title: 'New Coach Request',
							message: `${clientName} wants to be your client`,
							time: formatTimeAgo(request.createdAt),
							read: false,
							requestId: request.id,
							coachRequest: request,
						};
					});
				allNotifications.push(...coachRequestNotifications);
			}

			const coachSessionsList = (coachSessionsDrawerData as any)?.getCoachSessions;
			if (Array.isArray(coachSessionsList)) {
				for (const s of coachSessionsList) {
					if (
						s.sessionKind !== 'group_class' ||
						s.isTemplate ||
						s.status === 'cancelled'
					) {
						continue;
					}
					for (const e of s.enrollments || []) {
						if (e.status !== 'pending') continue;
						const name =
							e.client?.firstName || e.client?.lastName
								? `${e.client?.firstName ?? ''} ${e.client?.lastName ?? ''}`.trim()
								: 'A member';
						allNotifications.push({
							id: `classJoinRequest-${s.id}-${e.clientId}`,
							type: 'classJoinRequest' as const,
							title: 'Class join request',
							message: `${name} wants to join "${s.name}".`,
							time: e.createdAt ? formatTimeAgo(e.createdAt) : 'Just now',
							read: false,
						});
					}
				}
			}
		}

		if (user?.role === 'member' && user?.id) {
			const memberSessionsList = (memberSessionsDrawerData as any)?.getClientSessions;
			if (Array.isArray(memberSessionsList)) {
				for (const s of memberSessionsList) {
					if (s.sessionKind !== 'group_class') continue;
					const en = s.enrollments?.find((e: any) => e.clientId === user.id);
					if (en?.status !== 'pending') continue;
					allNotifications.push({
						id: `classJoinPending-${s.id}`,
						type: 'classJoinPending' as const,
						title: 'Join request sent',
						message: `Waiting for coach to approve your request for "${s.name}".`,
						time: en.createdAt ? formatTimeAgo(en.createdAt) : 'Just now',
						read: false,
					});
				}
			}
		}

		// Client request status notifications (accepted/rejected) for members
		if (
			clientRequestsData &&
			Array.isArray((clientRequestsData as any).getClientRequests) &&
			user?.role === 'member'
		) {
			const clientRequests = (clientRequestsData as any).getClientRequests;
			// Filter for recently accepted or rejected requests (within last 24 hours)
			// Also filter out requests with invalid coach data
			const recentStatusUpdates = clientRequests.filter((request: any) => {
				if (!request || !request.id) return false;
				if (request.status !== 'approved' && request.status !== 'denied')
					return false;
				// Check if coach data is valid
				if (!request.coach || !request.coach.id) return false;
				const updatedAt = new Date(request.updatedAt);
				const now = new Date();
				const hoursSinceUpdate =
					(now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
				return hoursSinceUpdate < 24; // Show notifications for requests updated in last 24 hours
			});

			const statusNotifications: Notification[] = recentStatusUpdates.map(
				(request: any) => {
					const coachName = request.coach
						? `${request.coach.firstName || ''} ${request.coach.lastName || ''}`.trim() ||
							'Coach'
						: 'Coach';
					const isApproved = request.status === 'approved';
					return {
						id: `requestStatus-${request.id}`,
						type: 'requestStatus' as const,
						title: isApproved ? 'Request Accepted!' : 'Request Rejected',
						message: isApproved
							? `${coachName} has accepted your coach request. You are now their client!`
							: `${coachName} has rejected your coach request.`,
						time: formatTimeAgo(request.updatedAt),
						read: false,
						requestId: request.id,
						coachRequest: request,
					};
				}
			);
			allNotifications.push(...statusNotifications);
		}

		// Subscription request status notifications for members
		if (
			subscriptionRequestsData &&
			Array.isArray(
				(subscriptionRequestsData as any).getMySubscriptionRequests
			) &&
			user?.role === 'member'
		) {
			const requests = (subscriptionRequestsData as any).getMySubscriptionRequests;
			const recentSubscriptionUpdates = requests.filter((req: any) => {
				if (!req || !req.id) return false;
				if (req.status !== 'APPROVED' && req.status !== 'REJECTED') return false;
				const updatedAt = new Date(req.updatedAt || req.approvedAt || req.rejectedAt);
				if (Number.isNaN(updatedAt.getTime())) return false;
				const now = new Date();
				const hoursSinceUpdate =
					(now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
				return hoursSinceUpdate < 24;
			});

			const subscriptionNotifications: Notification[] =
				recentSubscriptionUpdates.map((req: any) => {
					const membershipName = req.membership?.name || 'Membership';
					const isApproved = req.status === 'APPROVED';
					return {
						id: `subscription-${req.id}`,
						type: 'membership' as const,
						title: isApproved
							? 'Subscription Approved'
							: 'Subscription Rejected',
						message: isApproved
							? `Your subscription request for ${membershipName} has been approved.`
							: `Your subscription request for ${membershipName} was rejected.`,
						time: formatTimeAgo(
							req.updatedAt || req.approvedAt || req.rejectedAt
						),
						read: false,
					};
				});

			allNotifications.push(...subscriptionNotifications);
		}

		// Coach removal notifications for members
		if (user?.role === 'member' && removedCoaches.length > 0 && coachesData) {
			const coaches = (coachesData as any)?.getUsers || [];
			const removalNotifications = removedCoaches
				.map((removedCoachId: string) => {
					const coach = coaches.find((c: any) => c && c.id === removedCoachId);
					if (!coach) return null;
					const coachName =
						`${coach.firstName || ''} ${coach.lastName || ''}`.trim() ||
						'Your coach';
					return {
						id: `coachRemoved-${removedCoachId}`,
						type: 'coachRemoved' as const,
						title: 'Coach Removed',
						message: `${coachName} has removed you as their client.`,
						time: 'Just now',
						read: false,
					} as Notification;
				})
				.filter((n): n is Notification => n !== null);
			allNotifications.push(...removalNotifications);
		}

		// Filter out dismissed notifications
		return allNotifications.filter(
			(notification) => !dismissedNotifications.has(notification.id)
		);
	}, [
		sessionsData,
		coachRequestsData,
		coachSessionsDrawerData,
		memberSessionsDrawerData,
		classJoinAcceptedAlerts,
		clientRequestsData,
		coachesData,
		removedCoaches,
		user?.role,
		user?.id,
		formatTimeAgo,
		dismissedNotifications,
		subscriptionRequestsData,
	]);

	const dismissIds = useCallback(
		async (ids: string[]) => {
			if (ids.length === 0 || !user?.id) return;
			setDismissedNotifications((prev) => new Set([...prev, ...ids]));
			await addDismissedNotificationIds(user.id, ids);
			if (user.role === 'member') {
				const statusIds = ids.filter((id) => id.startsWith('requestStatus-'));
				if (statusIds.length > 0) {
					const changed = await addMemberSeenNotificationIds(
						user.id,
						statusIds
					);
					if (changed) onMemberNotificationsViewed?.();
				}
			}
		},
		[user?.id, user?.role, onMemberNotificationsViewed]
	);

	const handleSwipeDeleteRequest = useCallback((id: string) => {
		setDeleteConfirm({ type: 'single', ids: [id] });
	}, []);

	const toggleSelect = useCallback((id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}, []);

	const cancelDeleteModal = useCallback(() => {
		setDeleteConfirm(null);
		setSwipeResetTick((t) => t + 1);
	}, []);

	const confirmDeleteModal = useCallback(() => {
		if (!deleteConfirm?.ids.length || !user?.id) {
			setDeleteConfirm(null);
			return;
		}
		void dismissIds(deleteConfirm.ids).then(() => {
			setDeleteConfirm(null);
			setSelectedIds(new Set());
			setSelectionMode(false);
			setSwipeResetTick((t) => t + 1);
		});
	}, [deleteConfirm, dismissIds, user?.id]);

	const selectAllVisible = useCallback(() => {
		setSelectedIds(new Set(notifications.map((n) => n.id)));
	}, [notifications]);

	const deselectAll = useCallback(() => {
		setSelectedIds(new Set());
	}, []);

	const handleApproveRequest = useCallback((requestId: string) => {
		setApproveRequestId(requestId);
	}, []);

	const handleRejectRequest = useCallback((requestId: string) => {
		setDenyRequestId(requestId);
	}, []);

	const confirmApprove = useCallback(() => {
		if (approveRequestId) {
			updateCoachRequest({
				variables: { id: approveRequestId, input: { status: 'approved' } },
			});
			setApproveRequestId(null);
		}
	}, [approveRequestId, updateCoachRequest]);

	const confirmDeny = useCallback(() => {
		if (denyRequestId) {
			updateCoachRequest({
				variables: { id: denyRequestId, input: { status: 'denied' } },
			});
			setDenyRequestId(null);
		}
	}, [denyRequestId, updateCoachRequest]);

	const renderItem = useCallback(
		({ item }: { item: Notification }) => (
			<SwipeableNotificationItem
				notification={item}
				onApprove={handleApproveRequest}
				onReject={handleRejectRequest}
				onSwipeDeleteRequest={handleSwipeDeleteRequest}
				selectionMode={selectionMode}
				selected={selectedIds.has(item.id)}
				onToggleSelect={toggleSelect}
				swipeResetTick={swipeResetTick}
			/>
		),
		[
			handleApproveRequest,
			handleRejectRequest,
			handleSwipeDeleteRequest,
			selectionMode,
			selectedIds,
			toggleSelect,
			swipeResetTick,
		]
	);

	const keyExtractor = useCallback((item: Notification) => item.id, []);

	const renderEmpty = useCallback(
		() => (
			<View className='items-center justify-center py-20'>
				<Ionicons name='notifications-off-outline' size={64} color='#8E8E93' />
				<Text className='text-text-secondary mt-4 text-center'>
					No notifications
				</Text>
			</View>
		),
		[]
	);

	if (!visible) return null;

	return (
		<>
		<Modal
			visible={visible}
			transparent
			animationType='none'
			onRequestClose={onClose}
		>
			<TouchableOpacity
				style={styles.overlay}
				activeOpacity={1}
				onPress={onClose}
			>
				<Animated.View
					style={[
						styles.drawer,
						{
							transform: [{ translateX }],
							paddingTop: insets.top + 20,
							paddingBottom: insets.bottom + 20,
						},
					]}
				>
					<TouchableOpacity
						activeOpacity={1}
						onPress={(e) => e.stopPropagation()}
						style={styles.drawerInner}
					>
						<View className='flex-row items-center justify-between px-5 mb-2'>
							<Text className='text-2xl font-bold text-text-primary flex-1 pr-2'>
								Notifications
							</Text>
							{notifications.length > 0 ? (
								<TouchableOpacity
									onPress={() => setSelectionMode((m) => !m)}
									className='mr-3 py-1'
								>
									<Text className='text-[#F9C513] font-semibold text-base'>
										{selectionMode ? 'Done' : 'Select'}
									</Text>
								</TouchableOpacity>
							) : null}
							<TouchableOpacity onPress={onClose} className='py-1'>
								<Ionicons name='close' size={28} color='#8E8E93' />
							</TouchableOpacity>
						</View>

						{notifications.length > 0 && !selectionMode ? (
							<TouchableOpacity
								className='px-5 mb-3 self-start'
								onPress={() =>
									setDeleteConfirm({
										type: 'clear',
										ids: notifications.map((n) => n.id),
									})
								}
							>
								<Text className='text-red-400/90 text-sm font-semibold'>
									Clear all
								</Text>
							</TouchableOpacity>
						) : null}

						{selectionMode && notifications.length > 0 ? (
							<View className='flex-row items-center gap-6 px-5 mb-3'>
								<TouchableOpacity onPress={selectAllVisible}>
									<Text className='text-[#F9C513] text-sm font-semibold'>
										Select all
									</Text>
								</TouchableOpacity>
								<TouchableOpacity onPress={deselectAll}>
									<Text className='text-text-secondary text-sm font-medium'>
										Deselect all
									</Text>
								</TouchableOpacity>
							</View>
						) : null}

						<FlatList
							data={notifications}
							renderItem={renderItem}
							keyExtractor={keyExtractor}
							ListEmptyComponent={renderEmpty}
							showsVerticalScrollIndicator={false}
							contentContainerStyle={styles.listContent}
							style={styles.listFlex}
							removeClippedSubviews={true}
							maxToRenderPerBatch={10}
							updateCellsBatchingPeriod={50}
							initialNumToRender={10}
							windowSize={10}
						/>

						{selectionMode && selectedIds.size > 0 ? (
							<View className='px-5 pt-3 mt-1 border-t border-white/10'>
								<TouchableOpacity
									className='bg-red-500/20 border border-red-500/50 rounded-xl py-3.5 items-center'
									onPress={() =>
										setDeleteConfirm({
											type: 'bulk',
											ids: [...selectedIds],
										})
									}
								>
									<Text className='text-red-400 font-semibold text-base'>
										Delete ({selectedIds.size})
									</Text>
								</TouchableOpacity>
							</View>
						) : null}
					</TouchableOpacity>
				</Animated.View>
			</TouchableOpacity>
		</Modal>

		<ConfirmModal
			visible={!!approveRequestId}
			title="Approve Request"
			message="Approve this client request?"
			variant="neutral"
			confirmLabel="Approve"
			cancelLabel="Cancel"
			onConfirm={confirmApprove}
			onCancel={() => setApproveRequestId(null)}
		/>
		<ConfirmModal
			visible={!!denyRequestId}
			title="Deny Request"
			message="Deny this client request?"
			variant="danger"
			confirmLabel="Deny"
			cancelLabel="Cancel"
			onConfirm={confirmDeny}
			onCancel={() => setDenyRequestId(null)}
		/>
		<ConfirmModal
			visible={alertModal.visible}
			title={alertModal.title}
			message={alertModal.message}
			variant={alertModal.variant}
			confirmLabel="OK"
			onConfirm={() => setAlertModal((p) => ({ ...p, visible: false }))}
			onCancel={() => setAlertModal((p) => ({ ...p, visible: false }))}
			hideCancel
		/>
		<ConfirmModal
			visible={!!deleteConfirm}
			title={
				deleteConfirm?.type === 'clear'
					? 'Clear all notifications?'
					: deleteConfirm && deleteConfirm.ids.length > 1
						? `Delete ${deleteConfirm.ids.length} notifications?`
						: 'Delete this notification?'
			}
			message={
				deleteConfirm?.type === 'clear'
					? 'All items will be removed from your list. New alerts will still show when you receive them.'
					: deleteConfirm && deleteConfirm.ids.length > 1
						? 'These notifications will be removed from your list. This cannot be undone here.'
						: 'This notification will be removed from your list. This cannot be undone here.'
			}
			variant="danger"
			confirmLabel="Delete"
			cancelLabel="Cancel"
			onConfirm={confirmDeleteModal}
			onCancel={cancelDeleteModal}
		/>
		</>
	);
};

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		flexDirection: 'row',
		justifyContent: 'flex-end',
	},
	drawer: {
		width: '85%',
		height: '100%',
		backgroundColor: '#1C1C1E',
		shadowColor: '#000',
		shadowOffset: { width: -2, height: 0 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	listContent: {
		paddingHorizontal: 20,
		paddingBottom: 20,
		flexGrow: 1,
	},
	drawerInner: {
		flex: 1,
	},
	listFlex: {
		flex: 1,
	},
});

export default NotificationsDrawer;
