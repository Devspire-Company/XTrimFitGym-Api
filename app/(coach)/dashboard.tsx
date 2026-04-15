import { PremiumLoadingContent } from '@/components/AuthProcessingScreen';
import FixedView from '@/components/FixedView';
import TabHeader from '@/components/TabHeader';
import { useAuth } from '@/contexts/AuthContext';
import {
	GET_COACH_SESSIONS_QUERY,
	GET_PENDING_COACH_REQUESTS_QUERY,
	GET_USERS_QUERY,
	GET_ALL_CLIENT_GOALS_QUERY,
} from '@/graphql/queries';
import { formatTimeTo12Hour } from '@/utils/time-utils';
import { useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
	FlatList,
	RefreshControl,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
	useWindowDimensions,
} from 'react-native';

const CoachDashboard = () => {
	const { user } = useAuth();
	const router = useRouter();
	const [refreshing, setRefreshing] = useState(false);
	const { width } = useWindowDimensions();
	const {
		data: sessionsData,
		loading: sessionsLoading,
		refetch: refetchSessions,
	} = useQuery(GET_COACH_SESSIONS_QUERY, {
		variables: { coachId: user?.id || '' },
		skip: !user?.id,
		fetchPolicy: 'cache-and-network',
	});

	const { data: clientsData, refetch: refetchClients } = useQuery(
		GET_USERS_QUERY,
		{
			variables: { role: 'member' },
			fetchPolicy: 'cache-and-network',
		},
	);

	const { data: goalsData, refetch: refetchGoals } = useQuery(
		GET_ALL_CLIENT_GOALS_QUERY,
		{
			variables: { coachId: user?.id || '', status: 'active' },
			fetchPolicy: 'cache-and-network',
			skip: !user?.id,
		},
	);

	const { data: requestsData, refetch: refetchRequests } = useQuery(
		GET_PENDING_COACH_REQUESTS_QUERY,
		{
			fetchPolicy: 'network-only', // Always fetch from network for real-time updates
			pollInterval: 2000, // Poll every 2 seconds for real-time updates
			errorPolicy: 'all', // Allow partial data even if some fields fail
			notifyOnNetworkStatusChange: true,
		},
	);

	// Refetch data when screen is mounted
	useEffect(() => {
		if (user?.id) {
			refetchSessions();
			refetchGoals();
		}
		refetchClients();
		refetchRequests();
	}, [user?.id, refetchSessions, refetchClients, refetchRequests, refetchGoals]);

	// Handle pull-to-refresh
	const onRefresh = async () => {
		setRefreshing(true);
		try {
			const promises = [];
			if (user?.id) {
				promises.push(refetchSessions());
			}
			promises.push(refetchClients());
			promises.push(refetchRequests());
			await Promise.all(promises);
		} finally {
			setRefreshing(false);
		}
	};

	// Memoize sessions to prevent creating new array on every render
	const sessions = useMemo(
		() => (sessionsData as any)?.getCoachSessions || [],
		[sessionsData],
	);

	// Filter to only show coach's own clients
	const allClients = (clientsData as any)?.getUsers || [];
	const clients = allClients.filter((client: any) =>
		user?.coachDetails?.clientsIds?.includes(client.id),
	);

	const goals = (goalsData as any)?.getAllClientGoals || [];
	const myGoals = goals.filter((goal: any) => goal.coachId === user?.id);
	const upcomingSessions = useMemo(() => {
		const now = new Date();
		// Set to start of today for accurate date comparison
		now.setHours(0, 0, 0, 0);

		return sessions.filter((s: any) => {
			// Exclude templates
			if (s.isTemplate) return false;

			// Exclude cancelled sessions
			if (s.status === 'cancelled') return false;

			// Only include scheduled sessions
			if (s.status !== 'scheduled') return false;

			// Only include future sessions (including today)
			const sessionDate = new Date(s.date);
			sessionDate.setHours(0, 0, 0, 0);
			return sessionDate >= now;
		});
	}, [sessions]);

	const pendingRequests = useMemo(() => {
		const allRequests = (requestsData as any)?.getPendingCoachRequests || [];
		// Filter out requests with invalid client data
		return allRequests.filter(
			(request: any) =>
				request && request.id && request.client && request.client.id,
		);
	}, [requestsData]);

	// Calculate sessions this month
	const sessionsThisMonth = useMemo(() => {
		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		return sessions.filter((s: any) => {
			const sessionDate = new Date(s.date);
			return sessionDate >= startOfMonth && sessionDate <= now;
		}).length;
	}, [sessions]);

	// Calculate completed sessions this month
	const completedThisMonth = useMemo(() => {
		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		return sessions.filter((s: any) => {
			const sessionDate = new Date(s.date);
			return (
				sessionDate >= startOfMonth &&
				sessionDate <= now &&
				s.status === 'completed'
			);
		}).length;
	}, [sessions]);

	// Client capacity
	const clientCapacity = useMemo(() => {
		const currentClients = clients.length;
		const limit = user?.coachDetails?.clientLimit || 0;
		return {
			current: currentClients,
			limit,
			percentage: limit > 0 ? (currentClients / limit) * 100 : 0,
		};
	}, [clients.length, user?.coachDetails?.clientLimit]);

	// Calculate sessions data for last 7 days
	const sessionsLast7Days = useMemo(() => {
		const days = [];
		const today = new Date();
		for (let i = 6; i >= 0; i--) {
			const date = new Date(today);
			date.setDate(date.getDate() - i);
			date.setHours(0, 0, 0, 0);

			const daySessions = sessions.filter((s: any) => {
				const sessionDate = new Date(s.date);
				sessionDate.setHours(0, 0, 0, 0);
				return sessionDate.getTime() === date.getTime();
			});

			days.push({
				date: date.toLocaleDateString('en-US', {
					month: 'short',
					day: 'numeric',
				}),
				total: daySessions.length,
				completed: daySessions.filter((s: any) => s.status === 'completed')
					.length,
			});
		}
		return days;
	}, [sessions]);

	// Calculate sessions data for last 4 weeks
	const sessionsLast4Weeks = useMemo(() => {
		const weeks = [];
		const today = new Date();
		for (let i = 3; i >= 0; i--) {
			const weekStart = new Date(today);
			weekStart.setDate(weekStart.getDate() - i * 7 - 6);
			weekStart.setHours(0, 0, 0, 0);

			const weekEnd = new Date(weekStart);
			weekEnd.setDate(weekEnd.getDate() + 6);
			weekEnd.setHours(23, 59, 59, 999);

			const weekSessions = sessions.filter((s: any) => {
				const sessionDate = new Date(s.date);
				return sessionDate >= weekStart && sessionDate <= weekEnd;
			});

			weeks.push({
				label: `Week ${4 - i}`,
				total: weekSessions.length,
				completed: weekSessions.filter((s: any) => s.status === 'completed')
					.length,
			});
		}
		return weeks;
	}, [sessions]);

	// Render sessions chart (last 7 days)
	const renderSessionsChart = () => {
		if (sessionsLast7Days.length === 0) {
			return (
				<View className='items-center justify-center py-8'>
					<Text className='text-text-secondary text-sm'>
						No session data available
					</Text>
				</View>
			);
		}

		const maxSessions = Math.max(...sessionsLast7Days.map((d) => d.total), 1);
		const chartHeight = 150;
		const chartWidth = width - 80;
		const barWidth = chartWidth / sessionsLast7Days.length - 8;

		return (
			<View className='mt-4'>
				<Text className='text-text-primary font-semibold mb-3 text-sm'>
					Sessions (Last 7 Days)
				</Text>
				<View
					className='border-l-2 border-b-2 border-text-secondary/30'
					style={{ height: chartHeight, width: chartWidth }}
				>
					{sessionsLast7Days.map((day, index) => {
						const barHeight =
							maxSessions > 0
								? (day.total / maxSessions) * (chartHeight - 20)
								: 0;
						const completedHeight =
							maxSessions > 0
								? (day.completed / maxSessions) * (chartHeight - 20)
								: 0;
						const x = index * (chartWidth / sessionsLast7Days.length) + 4;

						return (
							<View
								key={index}
								className='absolute'
								style={{ left: x, bottom: 0 }}
							>
								{/* Completed sessions bar (green) */}
								{completedHeight > 0 && (
									<View
										className='bg-green-500 rounded-t'
										style={{
											width: barWidth,
											height: completedHeight,
											marginBottom: barHeight - completedHeight,
										}}
									/>
								)}
								{/* Total sessions bar (yellow) */}
								{barHeight > completedHeight && (
									<View
										className='bg-[#F9C513] rounded-t'
										style={{
											width: barWidth,
											height: barHeight - completedHeight,
										}}
									/>
								)}
							</View>
						);
					})}
				</View>
				<View className='flex-row justify-between mt-2'>
					{sessionsLast7Days.map((day, index) => (
						<Text
							key={index}
							className='text-text-secondary text-xs'
							style={{ width: barWidth }}
						>
							{day.date.split(' ')[1]}
						</Text>
					))}
				</View>
				{/* Legend */}
				<View className='flex-row gap-4 mt-3'>
					<View className='flex-row items-center'>
						<View className='w-3 h-3 bg-[#F9C513] rounded mr-2' />
						<Text className='text-text-secondary text-xs'>Scheduled</Text>
					</View>
					<View className='flex-row items-center'>
						<View className='w-3 h-3 bg-green-500 rounded mr-2' />
						<Text className='text-text-secondary text-xs'>Completed</Text>
					</View>
				</View>
			</View>
		);
	};

	// Render completion rate chart (last 4 weeks)
	const renderCompletionRateChart = () => {
		if (sessionsLast4Weeks.length === 0) {
			return (
				<View className='items-center justify-center py-8'>
					<Text className='text-text-secondary text-sm'>
						No session data available
					</Text>
				</View>
			);
		}

		const chartHeight = 150;
		const chartWidth = width - 80;
		const barWidth = chartWidth / sessionsLast4Weeks.length - 8;

		return (
			<View className='mt-4'>
				<Text className='text-text-primary font-semibold mb-3 text-sm'>
					Completion Rate (Last 4 Weeks)
				</Text>
				<View
					className='border-l-2 border-b-2 border-text-secondary/30'
					style={{ height: chartHeight, width: chartWidth }}
				>
					{sessionsLast4Weeks.map((week, index) => {
						const completionRate =
							week.total > 0 ? (week.completed / week.total) * 100 : 0;
						const barHeight = (completionRate / 100) * (chartHeight - 20);
						const x = index * (chartWidth / sessionsLast4Weeks.length) + 4;

						return (
							<View
								key={index}
								className='absolute'
								style={{ left: x, bottom: 0 }}
							>
								<View
									className={`rounded-t ${
										completionRate >= 80
											? 'bg-green-500'
											: completionRate >= 60
												? 'bg-yellow-500'
												: 'bg-red-500'
									}`}
									style={{
										width: barWidth,
										height: barHeight || 2,
									}}
								/>
								{/* Percentage label */}
								{week.total > 0 && (
									<Text
										className='text-text-primary text-xs font-semibold text-center'
										style={{
											width: barWidth,
											bottom: barHeight + 4,
											position: 'absolute',
										}}
									>
										{completionRate.toFixed(0)}%
									</Text>
								)}
							</View>
						);
					})}
				</View>
				<View className='flex-row justify-between mt-2'>
					{sessionsLast4Weeks.map((week, index) => (
						<Text
							key={index}
							className='text-text-secondary text-xs'
							style={{ width: barWidth }}
						>
							{week.label}
						</Text>
					))}
				</View>
			</View>
		);
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		if (date.toDateString() === today.toDateString()) return 'Today';
		if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
		});
	};

	return (
		<FixedView className='flex-1 bg-bg-darker'>
			<TabHeader showCoachIcon={false} />
			<ScrollView
				className='flex-1'
				contentContainerClassName='p-5'
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor='#F9C513'
					/>
				}
			>
				<View className='mb-6'>
					<Text className='text-3xl font-bold text-text-primary'>
						Dashboard
					</Text>
					<Text className='text-text-secondary mt-1'>
						Welcome back, Coach {user?.firstName}!
					</Text>
				</View>

				{/* Quick Stats (top overview) */}
				<View className='flex-row gap-3 mb-6'>
					<View className='flex-1 bg-bg-primary rounded-xl p-4 border border-bg-darker/60'>
						<View className='flex-row items-center mb-2'>
							<Ionicons name='calendar' size={18} color='#F9C513' />
							<Text className='text-text-secondary text-xs ml-2'>
								Scheduled Sessions
							</Text>
						</View>
						<Text className='text-3xl font-bold text-[#F9C513]'>
							{upcomingSessions.length}
						</Text>
					</View>
					<View className='flex-1 bg-bg-primary rounded-xl p-4 border border-bg-darker/60'>
						<View className='flex-row items-center mb-2'>
							<Ionicons name='people' size={18} color='#F9C513' />
							<Text className='text-text-secondary text-xs ml-2'>Clients</Text>
						</View>
						<Text className='text-3xl font-bold text-[#F9C513]'>
							{clients.length}
						</Text>
					</View>
				</View>

				{/* Upcoming Sessions */}
				<View className='mb-6'>
					<View className='flex-row justify-between items-center mb-4'>
						<View className='flex-row items-center'>
							<View className='bg-[#F9C513]/20 rounded-lg p-2 mr-2'>
								<Ionicons name='calendar' size={24} color='#F9C513' />
							</View>
							<Text className='text-xl font-semibold text-text-primary'>
								Upcoming Sessions
							</Text>
						</View>
						<TouchableOpacity onPress={() => router.push('/(coach)/schedule')}>
							<Text className='text-[#F9C513] font-semibold'>View All</Text>
						</TouchableOpacity>
					</View>

					{sessionsLoading ? (
						<View className='bg-bg-primary rounded-xl border border-bg-darker/60 overflow-hidden'>
							<PremiumLoadingContent embedded message='Please wait..' />
						</View>
					) : upcomingSessions.length === 0 ? (
						<View className='bg-bg-primary rounded-xl p-6 items-center border border-bg-darker/60'>
							<Ionicons name='calendar-outline' size={48} color='#8E8E93' />
							<Text className='text-text-secondary mt-4 text-center'>
								No upcoming sessions
							</Text>
						</View>
					) : (
						<FlatList
							data={upcomingSessions.slice(0, 3)}
							keyExtractor={(item) => item.id}
							scrollEnabled={false}
							renderItem={({ item }) => (
								<View className='bg-bg-primary rounded-xl p-4 mb-3 flex-row border border-bg-darker/60'>
									<View className='bg-bg-darker rounded-lg p-3 mr-3 items-center justify-center min-w-[80] border border-[#F9C513]/10'>
										<Text className='text-[#F9C513] font-bold text-lg'>
											{formatTimeTo12Hour(item.startTime)}
										</Text>
										<Text className='text-text-secondary text-xs mt-1'>
											{formatDate(item.date)}
										</Text>
									</View>
									<View className='flex-1'>
										<Text className='text-text-primary font-semibold text-base mb-1'>
											{item.name}
										</Text>
										<View className='flex-row items-center mb-1'>
											<Ionicons name='location' size={14} color='#8E8E93' />
											<Text className='text-text-secondary text-sm ml-1'>
												{item.gymArea}
											</Text>
										</View>
										<View className='flex-row items-center'>
											<Ionicons name='people' size={14} color='#8E8E93' />
											<Text className='text-text-secondary text-sm ml-1'>
												{String(item.clients?.length || 0)} client
												{item.clients?.length !== 1 ? 's' : ''}
											</Text>
										</View>
									</View>
								</View>
							)}
						/>
					)}
				</View>

				{/* My Goals Preview */}
				{myGoals.length > 0 && (
					<View className='mb-6'>
						<View className='flex-row justify-between items-center mb-3'>
							<View className='flex-row items-center'>
								<View className='bg-[#F9C513]/20 rounded-lg p-2 mr-2'>
									<Ionicons name='flag' size={20} color='#F9C513' />
								</View>
								<Text className='text-xl font-semibold text-text-primary'>
									My Goals
								</Text>
							</View>
							<Text className='text-text-secondary text-xs'>
								{myGoals.length} active
							</Text>
						</View>
						{myGoals.slice(0, 3).map((goal: any) => (
							<View
								key={goal.id}
								className='bg-bg-primary rounded-xl p-4 mb-3 border border-bg-darker/60'
								style={{ borderWidth: 0.5 }}
							>
								<Text className='text-text-primary font-semibold text-base mb-1'>
									{goal.title}
								</Text>
								<Text className='text-text-secondary text-sm'>
									Client: {goal.client?.firstName} {goal.client?.lastName}
								</Text>
								<Text className='text-text-secondary text-sm'>
									Type: {goal.goalType}
								</Text>
							</View>
						))}
					</View>
				)}

				{/* Coach Performance Insights */}
				<View className='bg-bg-primary rounded-xl p-5 mb-6 border border-[#F9C513]/20'>
					<View className='flex-row items-center mb-4'>
						<View className='bg-[#F9C513]/20 rounded-lg p-2 mr-3'>
							<Ionicons name='stats-chart' size={24} color='#F9C513' />
						</View>
						<Text className='text-xl font-semibold text-text-primary'>
							Performance Insights
						</Text>
					</View>

					<View className='gap-4'>
						<View className='pb-3 border-b border-bg-darker/50'>
							<View className='flex-row items-center justify-between'>
								<View className='flex-row items-center flex-1'>
									<Ionicons
										name='checkmark-circle'
										size={18}
										color='#8E8E93'
										style={{ marginRight: 8 }}
									/>
									<Text className='text-text-secondary text-sm'>
										Sessions This Month
									</Text>
								</View>
								<Text className='text-text-primary font-semibold text-base'>
									{sessionsThisMonth}
								</Text>
							</View>
						</View>

						<View className='pb-3 border-b border-bg-darker/50'>
							<View className='flex-row items-center justify-between'>
								<View className='flex-row items-center flex-1'>
									<Ionicons
										name='trophy'
										size={18}
										color='#8E8E93'
										style={{ marginRight: 8 }}
									/>
									<Text className='text-text-secondary text-sm'>
										Completed This Month
									</Text>
								</View>
								<Text className='text-text-primary font-semibold text-base'>
									{completedThisMonth}
								</Text>
							</View>
						</View>

						{user?.coachDetails?.ratings != null && (
							<View className='pb-3 border-b border-bg-darker/50'>
								<View className='flex-row items-center justify-between'>
									<View className='flex-row items-center flex-1'>
										<Ionicons
											name='star'
											size={18}
											color='#8E8E93'
											style={{ marginRight: 8 }}
										/>
										<Text className='text-text-secondary text-sm'>
											Average Rating
										</Text>
									</View>
									<View className='flex-row items-center'>
										<Text className='text-text-primary font-semibold mr-2 text-base'>
											{Number(user.coachDetails.ratings).toFixed(1)}
										</Text>
										<Ionicons name='star' size={16} color='#F9C513' />
									</View>
								</View>
							</View>
						)}

						<View className='pb-3 border-b border-bg-darker/50'>
							<View className='flex-row items-center justify-between mb-2'>
								<View className='flex-row items-center flex-1'>
									<Ionicons
										name='people-circle'
										size={18}
										color='#8E8E93'
										style={{ marginRight: 8 }}
									/>
									<Text className='text-text-secondary text-sm'>
										Client Capacity
									</Text>
								</View>
								<Text className='text-text-primary font-semibold text-base'>
									{clientCapacity.current}
									{clientCapacity.limit > 0 ? ` / ${clientCapacity.limit}` : ''}
								</Text>
							</View>
							{clientCapacity.limit > 0 && (
								<View className='w-full bg-bg-darker rounded-full h-2 overflow-hidden'>
									<View
										className={`h-2 rounded-full ${
											clientCapacity.percentage >= 90
												? 'bg-red-500'
												: clientCapacity.percentage >= 70
													? 'bg-yellow-500'
													: 'bg-green-500'
										}`}
										style={{
											width: `${Math.min(100, clientCapacity.percentage)}%`,
										}}
									/>
								</View>
							)}
						</View>
					</View>

					{/* Charts Section */}
					<View className='mt-6 pt-4 border-t border-bg-darker/50'>
						{renderSessionsChart()}
						<View className='mt-6'>{renderCompletionRateChart()}</View>
					</View>
				</View>

				{/* Specializations */}
				{user?.coachDetails?.specialization &&
					user.coachDetails.specialization.length > 0 && (
						<View className='bg-bg-primary rounded-xl p-5 mb-6 border border-[#F9C513]/20'>
							<View className='flex-row items-center mb-4'>
								<View className='bg-[#F9C513]/20 rounded-lg p-2 mr-3'>
									<Ionicons name='fitness' size={24} color='#F9C513' />
								</View>
								<Text className='text-xl font-semibold text-text-primary'>
									Specializations
								</Text>
							</View>
							<View className='flex-row flex-wrap gap-2'>
								{user.coachDetails.specialization.map(
									(spec: string, index: number) => (
										<View
											key={index}
											className='bg-[#F9C513]/10 px-3 py-2 rounded-full border border-[#F9C513]/30'
										>
											<Text className='text-[#F9C513] text-sm font-medium'>
												{spec}
											</Text>
										</View>
									),
								)}
							</View>
						</View>
					)}

				{/* Pending Requests */}
				{pendingRequests.length > 0 && (
					<View className='mb-6'>
						<View className='flex-row justify-between items-center mb-4'>
							<View className='flex-row items-center'>
								<View className='bg-[#F9C513]/20 rounded-lg p-2 mr-2'>
									<Ionicons name='mail' size={24} color='#F9C513' />
								</View>
								<Text className='text-xl font-semibold text-text-primary'>
									Pending Requests
								</Text>
							</View>
							<View className='bg-red-500/20 px-3 py-1 rounded-full border border-red-500/30'>
								<Text className='text-red-400 text-xs font-semibold'>
									{pendingRequests.length} NEW
								</Text>
							</View>
						</View>
						<TouchableOpacity
							onPress={() => router.push('/(coach)/requests')}
							className='bg-bg-primary rounded-xl p-4 border border-[#F9C513]/20'
						>
							<Text className='text-text-primary font-semibold mb-1'>
								You have {pendingRequests.length} pending client request
								{pendingRequests.length !== 1 ? 's' : ''}
							</Text>
							<Text className='text-[#F9C513] text-sm font-medium'>
								Tap to review →
							</Text>
						</TouchableOpacity>
					</View>
				)}

				{/* Quick Actions */}
				<View className='mb-6'>
					<Text className='text-xl font-semibold text-text-primary mb-4'>
						Quick Actions
					</Text>
					<View className='flex-row gap-3 flex-wrap'>
						<TouchableOpacity
							onPress={() => router.push('/(coach)/schedule')}
							className='flex-1 min-w-[45%] bg-bg-primary rounded-xl p-4 items-center border border-[#F9C513]/20'
						>
							<Ionicons name='calendar' size={32} color='#F9C513' />
							<Text className='text-text-primary font-semibold mt-2'>
								Schedule
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => router.push('/(coach)/progress')}
							className='flex-1 min-w-[45%] bg-bg-primary rounded-xl p-4 items-center border border-[#F9C513]/20'
						>
							<Ionicons name='trending-up' size={32} color='#F9C513' />
							<Text className='text-text-primary font-semibold mt-2'>
								Progress
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</ScrollView>
		</FixedView>
	);
};

export default CoachDashboard;
