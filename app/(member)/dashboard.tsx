import { PremiumLoadingContent } from '@/components/AuthProcessingScreen';
import FixedView from '@/components/FixedView';
import GradientButton from '@/components/GradientButton';
import { PostOnboardingWelcomeModal } from '@/components/PostOnboardingWelcomeModal';
import TabHeader from '@/components/TabHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useMemberMembershipModal } from '@/contexts/MemberMembershipModalContext';
import { memberHasActiveGymMembership } from '@/utils/memberMembership';
import { storage } from '@/utils/storage';
import {
	GetClientSessionsQuery,
	GetCurrentMembershipQuery,
	GetGoalsQuery,
	GetUpcomingSessionsQuery,
} from '@/graphql/generated/types';
import {
	GET_CLIENT_SESSIONS_QUERY,
	GET_CURRENT_MEMBERSHIP_QUERY,
	GET_GOALS_QUERY,
	GET_UPCOMING_SESSIONS_QUERY,
} from '@/graphql/queries';
import {
	formatTimeRangeTo12Hour,
	formatTimeTo12Hour,
} from '@/utils/time-utils';
import { useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	FlatList,
	RefreshControl,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

type OnboardingWelcomeKind = 'active' | 'counter' | 'limited';

const MemberDashboard = () => {
	const { user } = useAuth();
	const router = useRouter();
	const { openMembershipRequired } = useMemberMembershipModal();
	const hasMembership = memberHasActiveGymMembership(user);
	const params = useLocalSearchParams<{ onboardingWelcome?: string | string[] }>();
	const welcomeParam = Array.isArray(params.onboardingWelcome)
		? params.onboardingWelcome[0]
		: params.onboardingWelcome;
	const welcomeKind: OnboardingWelcomeKind | undefined =
		welcomeParam === 'limited' || welcomeParam === 'counter' || welcomeParam === 'active'
			? welcomeParam
			: undefined;

	const [postOnboardingWelcomeVisible, setPostOnboardingWelcomeVisible] =
		useState(() => !!welcomeKind);
	const [postOnboardingWelcomeKind, setPostOnboardingWelcomeKind] = useState<
		OnboardingWelcomeKind | undefined
	>(() => welcomeKind);

	useEffect(() => {
		if (welcomeKind) {
			setPostOnboardingWelcomeKind(welcomeKind);
			setPostOnboardingWelcomeVisible(true);
			return;
		}
		let cancelled = false;
		void (async () => {
			try {
				const v = await storage.getItem('onboarding_welcome');
				if (cancelled || !v) return;
				if (v === 'limited' || v === 'counter' || v === 'active') {
					setPostOnboardingWelcomeKind(v);
					setPostOnboardingWelcomeVisible(true);
				}
				await storage.removeItem('onboarding_welcome');
			} catch {
				/* noop */
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [welcomeKind]);

	const dismissPostOnboardingWelcome = () => {
		setPostOnboardingWelcomeVisible(false);
		router.replace('/(member)/dashboard');
	};

	useFocusEffect(
		useCallback(() => {
			if (!hasMembership) {
				openMembershipRequired();
				router.replace('/(member)/workouts');
			}
		}, [hasMembership, openMembershipRequired, router])
	);

	const [refreshing, setRefreshing] = useState(false);
	const [dismissedExpiryCard, setDismissedExpiryCard] = useState(false);
	const {
		data: sessionsData,
		loading,
		refetch: refetchSessions,
	} = useQuery<GetUpcomingSessionsQuery>(GET_UPCOMING_SESSIONS_QUERY, {
		fetchPolicy: 'cache-and-network',
	});

	const { data: goalsData, refetch: refetchGoals } = useQuery<GetGoalsQuery>(
		GET_GOALS_QUERY,
		{
			variables: { clientId: user?.id || '', status: 'active' },
			skip: !user?.id,
			fetchPolicy: 'cache-and-network',
		},
	);

	const { data: allSessionsData, refetch: refetchAllSessions } =
		useQuery<GetClientSessionsQuery>(GET_CLIENT_SESSIONS_QUERY, {
			variables: { clientId: user?.id || '' },
			skip: !user?.id,
			fetchPolicy: 'cache-and-network',
		});

	const { data: membershipData, refetch: refetchMembership } =
		useQuery<GetCurrentMembershipQuery>(GET_CURRENT_MEMBERSHIP_QUERY, {
			fetchPolicy: 'cache-and-network',
		});

	// Refetch data when screen is mounted
	useEffect(() => {
		refetchSessions();
		if (user?.id) {
			refetchGoals();
			refetchAllSessions();
		}
		refetchMembership();
	}, [
		user?.id,
		refetchSessions,
		refetchGoals,
		refetchAllSessions,
		refetchMembership,
	]);

	// Handle pull-to-refresh
	const onRefresh = async () => {
		setRefreshing(true);
		try {
			const promises = [refetchSessions(), refetchMembership()];
			if (user?.id) {
				promises.push(refetchGoals());
				promises.push(refetchAllSessions());
			}
			await Promise.all(promises);
		} finally {
			setRefreshing(false);
		}
	};

	const sessions = sessionsData?.getUpcomingSessions || [];
	const activeGoals = goalsData?.getGoals || [];
	const currentMembership = membershipData?.getCurrentMembership;

	// Calculate completed sessions this month
	const completedThisMonth = useMemo(() => {
		const allSessionsList = allSessionsData?.getClientSessions || [];
		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		return allSessionsList.filter((s: any) => {
			const sessionDate = new Date(s.date);
			return (
				sessionDate >= startOfMonth &&
				sessionDate <= now &&
				s.status === 'completed'
			);
		}).length;
	}, [allSessionsData]);

	// Parse workout time
	const workoutTime = useMemo(() => {
		return formatTimeRangeTo12Hour(user?.membershipDetails?.workOutTime?.[0]);
	}, [user?.membershipDetails?.workOutTime]);

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

	const daysUntilExpiry = useMemo(() => {
		if (!currentMembership?.expiresAt) return null;
		const exp = new Date(currentMembership.expiresAt);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		exp.setHours(0, 0, 0, 0);
		return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
	}, [currentMembership?.expiresAt]);

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
						Welcome back, {user?.firstName}!
					</Text>
				</View>

				{/* Membership expiry reminder (within 7 days) */}
				{currentMembership &&
					daysUntilExpiry !== null &&
					daysUntilExpiry > 0 &&
					daysUntilExpiry <= 7 &&
					!dismissedExpiryCard && (
						<View className='bg-amber-500/20 border border-amber-500/40 rounded-xl p-4 mb-6'>
							<View className='flex-row justify-between items-start'>
								<TouchableOpacity
									onPress={() => router.push('/(member)/subscription')}
									activeOpacity={0.7}
									className='flex-1'
								>
									<Text className='text-amber-400 font-semibold text-base'>
										Membership expires in {daysUntilExpiry} day
										{daysUntilExpiry !== 1 ? 's' : ''}
									</Text>
									<Text className='text-text-secondary text-sm mt-1'>
										Your access will pause when this membership ends.
									</Text>
								</TouchableOpacity>
								<TouchableOpacity
									onPress={() => setDismissedExpiryCard(true)}
									className='ml-3 p-1'
									activeOpacity={0.7}
								>
									<Ionicons name='close' size={18} color='#F5F5F7' />
								</TouchableOpacity>
							</View>
						</View>
					)}

				{/* No membership CTA */}
				{!currentMembership && (
					<TouchableOpacity
						onPress={() => router.push('/(member)/subscription')}
						activeOpacity={0.7}
						className='bg-bg-primary rounded-xl p-5 mb-6 border border-[#F9C513]/30 items-center'
					>
						<Ionicons name='card-outline' size={40} color='#F9C513' />
						<Text className='text-text-primary font-semibold mt-3 text-center'>
							Get a membership to access coaches and sessions
						</Text>
						<Text className='text-[#F9C513] font-semibold mt-2'>
							View plans
						</Text>
					</TouchableOpacity>
				)}

				{/* Membership Status (after welcome) */}
				{currentMembership && (
					<View className='bg-bg-primary rounded-xl p-5 mb-6 border border-[#F9C513]/20'>
						<View className='flex-row items-center justify-between mb-3'>
							<View className='flex-row items-center'>
								<View className='bg-[#F9C513]/20 rounded-lg p-2 mr-3'>
									<Ionicons name='card' size={24} color='#F9C513' />
								</View>
								<Text className='text-xl font-semibold text-text-primary'>
									Membership
								</Text>
							</View>
							<View
								className={`px-3 py-1 rounded-full ${
									currentMembership.status === 'ACTIVE'
										? 'bg-green-500/20 border border-green-500/30'
										: 'bg-red-500/20 border border-red-500/30'
								}`}
							>
								<Text
									className={`text-xs font-semibold ${
										currentMembership.status === 'ACTIVE'
											? 'text-green-400'
											: 'text-red-400'
									}`}
								>
									{currentMembership.status}
								</Text>
							</View>
						</View>
						<Text className='text-text-primary font-semibold mb-1'>
							{currentMembership.membership?.name}
						</Text>
						{currentMembership.expiresAt && (
							<Text className='text-text-secondary text-sm'>
								Expires:{' '}
								{new Date(currentMembership.expiresAt).toLocaleDateString()}
							</Text>
						)}
						{currentMembership.monthDuration >= 1 ? (
							<Text className='text-text-secondary text-sm mt-1'>
								Length: {currentMembership.monthDuration} month
								{currentMembership.monthDuration !== 1 ? 's' : ''}
							</Text>
						) : null}
					</View>
				)}

				{/* Quick Stats */}
				<View className='flex-row gap-3 mb-6'>
					<View className='flex-1 bg-bg-primary rounded-xl p-4 border border-[#F9C513]/20'>
						<View className='flex-row items-center mb-2'>
							<Ionicons name='calendar' size={18} color='#F9C513' />
							<Text className='text-text-secondary text-xs ml-2'>
								Upcoming Sessions
							</Text>
						</View>
						<Text className='text-3xl font-bold text-[#F9C513]'>
							{sessions.length}
						</Text>
					</View>
					<View className='flex-1 bg-bg-primary rounded-xl p-4 border border-[#F9C513]/20'>
						<View className='flex-row items-center mb-2'>
							<Ionicons name='checkmark-circle' size={18} color='#F9C513' />
							<Text className='text-text-secondary text-xs ml-2'>
								This Month
							</Text>
						</View>
						<Text className='text-3xl font-bold text-[#F9C513]'>
							{completedThisMonth}
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
						<TouchableOpacity onPress={() => router.push('/(member)/schedule')}>
							<Text className='text-[#F9C513] font-semibold'>View All</Text>
						</TouchableOpacity>
					</View>

					{loading ? (
						<View className='bg-bg-primary rounded-xl border border-[#F9C513]/20 overflow-hidden'>
							<PremiumLoadingContent embedded message='Please wait..' />
						</View>
					) : sessions.length === 0 ? (
						<View className='bg-bg-primary rounded-xl p-6 items-center border border-[#F9C513]/20'>
							<Ionicons name='calendar-outline' size={48} color='#8E8E93' />
							<Text className='text-text-secondary mt-4 text-center'>
								No upcoming sessions
							</Text>
						</View>
					) : (
						<FlatList
							data={sessions.slice(0, 3)}
							keyExtractor={(item) => item.id}
							scrollEnabled={false}
							removeClippedSubviews={false}
							renderItem={({ item }) => (
								<View className='bg-bg-primary rounded-xl p-4 mb-3 flex-row border border-[#F9C513]/20'>
									{/* Time only here — date lives in flex-1 column so “Today” never clips */}
									<View
										className='bg-bg-darker rounded-lg py-3 px-3 mr-3 items-center justify-center border border-[#F9C513]/10'
										style={{ flexShrink: 0, alignSelf: 'stretch', minWidth: 88 }}
									>
										<Text className='text-[#F9C513] font-bold text-lg text-center'>
											{formatTimeTo12Hour(item.startTime)}
										</Text>
									</View>
									<View className='flex-1' style={{ minWidth: 0 }}>
										<Text className='text-text-secondary text-xs font-medium mb-1'>
											{formatDate(item.date)}
										</Text>
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
											<Ionicons name='person' size={14} color='#8E8E93' />
											<Text className='text-text-secondary text-sm ml-1'>
												With Coach {item.coach?.firstName || ''}{' '}
												{item.coach?.lastName || ''}
											</Text>
										</View>
									</View>
								</View>
							)}
						/>
					)}
				</View>

				{/* Active Goals */}
				{activeGoals.length > 0 && (
					<View className='mb-6'>
						<View className='flex-row justify-between items-center mb-4'>
							<View className='flex-row items-center'>
								<View className='bg-[#F9C513]/20 rounded-lg p-2 mr-2'>
									<Ionicons name='trophy' size={24} color='#F9C513' />
								</View>
								<Text className='text-xl font-semibold text-text-primary'>
									Active Goals
								</Text>
							</View>
							<TouchableOpacity
								onPress={() => router.push('/(member)/progress')}
							>
								<Text className='text-[#F9C513] font-semibold'>View All</Text>
							</TouchableOpacity>
						</View>

						<View className='bg-bg-primary rounded-xl p-4 border border-[#F9C513]/20'>
							<FlatList
								data={activeGoals.slice(0, 2)}
								keyExtractor={(item) => item.id}
								scrollEnabled={false}
								renderItem={({ item }) => (
									<View className='mb-3 pb-3 border-b border-bg-darker/50 last:border-0 last:pb-0 last:mb-0'>
										<Text className='text-text-primary font-semibold mb-1'>
											{item.title}
										</Text>
										{item.targetWeight && item.currentWeight && (
											<View className='flex-row items-center mt-2'>
												<View className='flex-1 bg-bg-darker rounded-full h-2 mr-2'>
													<View
														className='bg-[#F9C513] h-2 rounded-full'
														style={{
															width: `${Math.min(
																100,
																Math.max(
																	0,
																	(item.currentWeight /
																		item.targetWeight) *
																		100
																)
															)}%`,
														}}
													/>
												</View>
												<Text className='text-text-secondary text-xs'>
													{item.currentWeight} / {item.targetWeight} kg
												</Text>
											</View>
										)}
									</View>
								)}
							/>
						</View>
					</View>
				)}

				{/* Fitness Insights */}
				<View className='bg-bg-primary rounded-xl p-5 mb-6 border border-[#F9C513]/20'>
					<View className='flex-row items-center mb-4'>
						<View className='bg-[#F9C513]/20 rounded-lg p-2 mr-3'>
							<Ionicons name='fitness' size={24} color='#F9C513' />
						</View>
						<Text className='text-xl font-semibold text-text-primary'>
							Your Fitness Profile
						</Text>
					</View>

					<View className='gap-4'>
						{user?.membershipDetails?.physiqueGoalType && (
							<View className='flex-row items-center justify-between pb-3 border-b border-bg-darker/50'>
								<View className='flex-row items-center flex-1'>
									<Ionicons
										name='body'
										size={18}
										color='#8E8E93'
										style={{ marginRight: 8 }}
									/>
									<Text className='text-text-secondary text-sm'>
										Body Type
									</Text>
								</View>
								<Text className='text-text-primary font-semibold'>
									{user.membershipDetails.physiqueGoalType}
								</Text>
							</View>
						)}

						{user?.membershipDetails?.fitnessGoal &&
							user.membershipDetails.fitnessGoal.length > 0 && (
								<View className='pb-3 border-b border-bg-darker/50'>
									<View className='flex-row items-center mb-2'>
										<Ionicons
											name='flag'
											size={18}
											color='#8E8E93'
											style={{ marginRight: 8 }}
										/>
										<Text className='text-text-secondary text-sm'>
											Fitness Goals
										</Text>
									</View>
									<View className='flex-row flex-wrap gap-2 mt-2'>
										{user.membershipDetails.fitnessGoal.map(
											(goal: string, index: number) => (
												<View
													key={index}
													className='bg-[#F9C513]/10 px-3 py-1 rounded-full border border-[#F9C513]/30'
												>
													<Text className='text-[#F9C513] text-xs font-medium'>
														{goal}
													</Text>
												</View>
											),
										)}
									</View>
								</View>
							)}

						<View className='pb-3 border-b border-bg-darker/50'>
							<View className='flex-row items-center mb-1'>
								<Ionicons
									name='time'
									size={18}
									color='#8E8E93'
									style={{ marginRight: 8 }}
								/>
								<Text className='text-text-secondary text-sm'>
									Preferred Workout Time
								</Text>
							</View>
							<Text className='text-text-primary font-semibold text-base'>
								{workoutTime}
							</Text>
						</View>
					</View>
				</View>

				{/* Quick Actions */}
				<View className='mb-6'>
					<Text className='text-xl font-semibold text-text-primary mb-4'>
						Quick Actions
					</Text>
					<View className='flex-row flex-wrap gap-3'>
						<TouchableOpacity
							onPress={() => router.push('/(member)/progress')}
							activeOpacity={0.7}
							className='flex-1 min-w-[45%] bg-bg-primary rounded-xl p-4 items-center border border-[#F9C513]/20'
						>
							<Ionicons name='trending-up' size={32} color='#F9C513' />
							<Text className='text-text-primary font-semibold mt-2'>
								Progress
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => router.push('/(member)/subscription')}
							activeOpacity={0.7}
							className='flex-1 min-w-[45%] bg-bg-primary rounded-xl p-4 items-center border border-[#F9C513]/20'
						>
							<Ionicons name='card' size={32} color='#F9C513' />
							<Text className='text-text-primary font-semibold mt-2'>
								Subscription
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => router.push('/(member)/coaches')}
							activeOpacity={0.7}
							className='flex-1 min-w-[45%] bg-bg-primary rounded-xl p-4 items-center border border-[#F9C513]/20'
						>
							<Ionicons name='people' size={32} color='#F9C513' />
							<Text className='text-text-primary font-semibold mt-2'>
								Find Coach
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => router.push('/(member)/attendance')}
							activeOpacity={0.7}
							className='flex-1 min-w-[45%] bg-bg-primary rounded-xl p-4 items-center border border-[#F9C513]/20'
						>
							<Ionicons name='finger-print-outline' size={32} color='#F9C513' />
							<Text className='text-text-primary font-semibold mt-2'>
								Log Attendance
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</ScrollView>

			{postOnboardingWelcomeKind ? (
				<PostOnboardingWelcomeModal
					visible={postOnboardingWelcomeVisible}
					onDismiss={dismissPostOnboardingWelcome}
				/>
			) : null}
		</FixedView>
	);
};

export default MemberDashboard;
