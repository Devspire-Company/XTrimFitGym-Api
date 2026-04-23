import { PremiumLoadingContent } from '@/components/AuthProcessingScreen';
import ConfirmModal from '@/components/ConfirmModal';
import FixedView from '@/components/FixedView';
import GradientButton from '@/components/GradientButton';
import Input from '@/components/Input';
import TabHeader from '@/components/TabHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useMemberMembershipModal } from '@/contexts/MemberMembershipModalContext';
import {
	GetUsersQuery,
	GetUsersQueryVariables,
} from '@/graphql/generated/types';
import {
	CANCEL_COACH_REQUEST_MUTATION,
	CREATE_COACH_REQUEST_MUTATION,
} from '@/graphql/mutations';
import { GET_CLIENT_REQUESTS_QUERY, GET_USERS_QUERY, GET_USER_QUERY } from '@/graphql/queries';
import { useAppDispatch } from '@/store/hooks';
import { updateUser } from '@/store/slices/userSlice';
import { memberHasActiveGymMembership } from '@/utils/memberMembership';
import { formatTimeRangeTo12Hour } from '@/utils/time-utils';
import { useMutation, useQuery, useLazyQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
	FlatList,
	Modal,
	RefreshControl,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

const MemberCoaches = () => {
	const { user } = useAuth();
	const dispatch = useAppDispatch();
	const router = useRouter();
	const { openMembershipRequired } = useMemberMembershipModal();
	const hasMembership = memberHasActiveGymMembership(user);
	const [refreshing, setRefreshing] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCoach, setSelectedCoach] = useState<any>(null);
	const [showProfileModal, setShowProfileModal] = useState(false);
	const [showMyCoachesModal, setShowMyCoachesModal] = useState(false);
	const [coachToRequest, setCoachToRequest] = useState<any>(null);
	const [requestToCancel, setRequestToCancel] = useState<any>(null);
	const [showMembershipConfirm, setShowMembershipConfirm] = useState(false);
	const [successModal, setSuccessModal] = useState<{ title: string; message: string } | null>(null);
	const [alertModal, setAlertModal] = useState<{
		visible: boolean;
		title: string;
		message: string;
		variant: 'danger' | 'neutral' | 'success';
	}>({ visible: false, title: '', message: '', variant: 'neutral' });
	const [requestSentCoachIds, setRequestSentCoachIds] = useState<Set<string>>(new Set());
	const lastRequestedCoachIdRef = useRef<string | null>(null);
	const cancelCoachIdRef = useRef<string | null>(null);
	const scrollViewRef = useRef<any>(null);

	const { data: coachesData, loading, refetch: refetchCoaches } = useQuery<
		GetUsersQuery,
		GetUsersQueryVariables
	>(GET_USERS_QUERY, {
		variables: { role: 'coach' },
		fetchPolicy: 'cache-and-network',
		pollInterval: 10000,
		notifyOnNetworkStatusChange: false,
	});

	const { data: requestsData, refetch: refetchRequests } = useQuery(
		GET_CLIENT_REQUESTS_QUERY,
		{
			variables: { clientId: user?.id || '', status: 'pending' },
			skip: !user?.id,
			fetchPolicy: 'cache-and-network',
			pollInterval: user?.id ? 10000 : 0,
			errorPolicy: 'all',
			notifyOnNetworkStatusChange: false,
		}
	);

	const [refetchCurrentUser] = useLazyQuery(GET_USER_QUERY, {
		fetchPolicy: 'network-only',
	});

	const refetchAllData = useCallback(async () => {
		if (refreshing) return;
		try {
			await Promise.all([
				refetchCoaches(),
				user?.id ? refetchRequests() : Promise.resolve(),
			]);
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
		} catch (error) {
			console.error('Error refetching data:', error);
		}
	}, [refetchCoaches, refetchRequests, refetchCurrentUser, user?.id, dispatch, refreshing]);

	useFocusEffect(
		useCallback(() => {
			if (!hasMembership) {
				openMembershipRequired();
				router.navigate('/(member)/workouts');
				return;
			}
			refetchAllData();
		}, [hasMembership, openMembershipRequired, router, refetchAllData])
	);

	// Handle pull-to-refresh
	const onRefresh = async () => {
		setRefreshing(true);
		try {
			await refetchAllData();
		} finally {
			setRefreshing(false);
		}
	};

	const [createCoachRequest, { loading: requesting }] = useMutation(
		CREATE_COACH_REQUEST_MUTATION,
		{
			onCompleted: async () => {
				await refetchRequests();
				lastRequestedCoachIdRef.current = null;
				setSuccessModal({ title: 'Success', message: 'Coach request sent successfully!' });
			},
			onError: async (error) => {
				const msg = (error?.message || '').toLowerCase();
				if (msg.includes('pending') || msg.includes('already')) {
					await refetchRequests();
					lastRequestedCoachIdRef.current = null;
					return;
				}
				if (lastRequestedCoachIdRef.current) {
					setRequestSentCoachIds((prev) => {
						const next = new Set(prev);
						next.delete(lastRequestedCoachIdRef.current!);
						return next;
					});
					lastRequestedCoachIdRef.current = null;
				}
				setAlertModal({ visible: true, title: 'Error', message: error.message, variant: 'danger' });
			},
		}
	);

	const [cancelCoachRequest] = useMutation(CANCEL_COACH_REQUEST_MUTATION, {
		onCompleted: () => {
			if (cancelCoachIdRef.current) {
				setRequestSentCoachIds((prev) => {
					const next = new Set(prev);
					next.delete(cancelCoachIdRef.current!);
					return next;
				});
				cancelCoachIdRef.current = null;
			}
			refetchRequests();
			setSuccessModal({ title: 'Success', message: 'Request cancelled.' });
		},
		onError: (error) => {
			setAlertModal({ visible: true, title: 'Error', message: error.message, variant: 'danger' });
		},
	});

	const coaches = useMemo(() => coachesData?.getUsers || [], [coachesData]);
	const pendingRequests = useMemo(() => {
		const allRequests = (requestsData as any)?.getClientRequests || [];
		return allRequests.filter(
			(request: any) => request && request.id && request.coach && request.coach.id
		);
	}, [requestsData]);
	const currentCoachIds = useMemo(() => {
		return new Set(user?.membershipDetails?.coachesIds || []);
	}, [user?.membershipDetails?.coachesIds]);

	const { currentCoaches, availableCoaches } = useMemo(() => {
		const current: any[] = [];
		const available: any[] = [];

		coaches.forEach((coach: any) => {
			if (currentCoachIds.has(coach.id)) {
				current.push(coach);
			} else {
				available.push(coach);
			}
		});

		return { currentCoaches: current, availableCoaches: available };
	}, [coaches, currentCoachIds]);

	const { recommendedCoaches, otherCoaches } = useMemo(() => {
		if (!availableCoaches.length || !user?.membershipDetails?.fitnessGoal) {
			return {
				recommendedCoaches: [],
				otherCoaches: availableCoaches,
			};
		}

		const userGoals = user.membershipDetails.fitnessGoal || [];
		const recommended: any[] = [];
		const other: any[] = [];

		availableCoaches.forEach((coach: any) => {
			const coachSpecializations = coach.coachDetails?.specialization || [];
			const hasMatchingSpecialization = userGoals.some((goal: string) =>
				coachSpecializations.includes(goal)
			);

			const currentClients = coach.coachDetails?.clientsIds?.length || 0;
			const clientLimit = coach.coachDetails?.clientLimit || 999;
			const isAtLimit = currentClients >= clientLimit;

			const coachWithStatus = {
				...coach,
				isAtLimit,
				matchScore: hasMatchingSpecialization ? 1 : 0,
			};

			if (hasMatchingSpecialization) {
				recommended.push(coachWithStatus);
			} else {
				other.push(coachWithStatus);
			}
		});

		recommended.sort((a, b) => {
			if (a.matchScore !== b.matchScore) {
				return b.matchScore - a.matchScore;
			}
			return (b.coachDetails?.ratings || 0) - (a.coachDetails?.ratings || 0);
		});

		return { recommendedCoaches: recommended, otherCoaches: other };
	}, [availableCoaches, user]);

	// Filter coaches by search query
	const filteredRecommended = useMemo(() => {
		if (!searchQuery.trim()) return recommendedCoaches;
		const query = searchQuery.toLowerCase();
		return recommendedCoaches.filter(
			(coach: any) =>
				coach.firstName.toLowerCase().includes(query) ||
				coach.lastName.toLowerCase().includes(query) ||
				coach.coachDetails?.specialization?.some((spec: string) =>
					spec.toLowerCase().includes(query)
				)
		);
	}, [recommendedCoaches, searchQuery]);

	const filteredOther = useMemo(() => {
		if (!searchQuery.trim()) return otherCoaches;
		const query = searchQuery.toLowerCase();
		return otherCoaches.filter(
			(coach: any) =>
				coach.firstName.toLowerCase().includes(query) ||
				coach.lastName.toLowerCase().includes(query) ||
				coach.coachDetails?.specialization?.some((spec: string) =>
					spec.toLowerCase().includes(query)
				)
		);
	}, [otherCoaches, searchQuery]);

	const handleCoachPress = (coach: any) => {
		setSelectedCoach(coach);
		setShowProfileModal(true);
	};

	const handleRequestCoach = (coach: any) => {
		if (!hasMembership) {
			setShowMembershipConfirm(true);
			return;
		}
		const hasCoach = user?.membershipDetails?.coachesIds?.includes(coach.id);
		if (hasCoach) {
			setAlertModal({
				visible: true,
				title: 'Already Connected',
				message: 'You already have this coach',
				variant: 'neutral',
			});
			return;
		}
		if (hasPendingForCoach.has(coach.id)) return;
		const pendingReq = pendingRequests.find((req: any) => req.coachId === coach.id);
		if (pendingReq) {
			setRequestToCancel(pendingReq);
			return;
		}
		setCoachToRequest(coach);
	};

	const confirmRequestCoach = () => {
		if (!coachToRequest) return;
		const coachId = coachToRequest.id;
		lastRequestedCoachIdRef.current = coachId;
		setRequestSentCoachIds((prev) => new Set([...prev, coachId]));
		createCoachRequest({
			variables: { input: { coachId } },
		});
		setCoachToRequest(null);
	};

	const confirmCancelRequest = () => {
		if (!requestToCancel) return;
		cancelCoachIdRef.current = requestToCancel.coachId;
		cancelCoachRequest({ variables: { id: requestToCancel.id } });
		setRequestToCancel(null);
		setShowProfileModal(false);
		setSelectedCoach(null);
	};

	const confirmMembershipRedirect = () => {
		setShowMembershipConfirm(false);
		router.push('/(member)/subscription');
	};

	const hasPendingForCoach = useMemo(() => {
		const set = new Set<string>();
		pendingRequests.forEach((req: any) => {
			if (req?.coachId) set.add(req.coachId);
		});
		requestSentCoachIds.forEach((id) => set.add(id));
		return set;
	}, [pendingRequests, requestSentCoachIds]);

	const renderCoachCard = ({ item }: { item: any }) => {
		const isCurrentCoach = currentCoachIds.has(item.id);
		const requestSent = hasPendingForCoach.has(item.id);
		return (
			<TouchableOpacity
				onPress={() => handleCoachPress(item)}
				className={`bg-bg-primary rounded-xl p-4 mb-3 border ${
					isCurrentCoach
						? 'border-green-500/40 bg-green-500/5'
						: requestSent
							? 'border-[#F9C513]/40 bg-[#F9C513]/5'
							: 'border-[#F9C513]/20'
				}`}
				disabled={item.isAtLimit}
			>
				<View className='flex-row'>
					<View
						className={`rounded-full w-16 h-16 items-center justify-center mr-4 border-2 ${
							isCurrentCoach
								? 'bg-green-500 border-green-500/50'
								: 'bg-[#F9C513] border-bg-darker/30'
						}`}
					>
						<Text
							className={`font-bold text-xl ${
								isCurrentCoach ? 'text-white' : 'text-bg-darker'
							}`}
						>
							{item.firstName.charAt(0)}
							{item.lastName.charAt(0)}
						</Text>
					</View>
					<View className='flex-1'>
						<View className='flex-row items-start justify-between mb-1'>
							<Text 
								className='text-text-primary font-semibold text-lg flex-1 mr-2'
								numberOfLines={1}
								ellipsizeMode='tail'
							>
								Coach {item.firstName} {item.lastName}
							</Text>
							<View className='flex-row items-center gap-2 flex-shrink-0'>
								{isCurrentCoach && (
									<View className='bg-green-500/20 px-2 py-1 rounded border border-green-500/40'>
										<Text className='text-green-500 text-xs font-semibold'>
											My Coach
										</Text>
									</View>
								)}
								{requestSent && !isCurrentCoach && (
									<View className='bg-[#F9C513]/20 px-2 py-1 rounded border border-[#F9C513]/40'>
										<Text className='text-[#F9C513] text-xs font-semibold'>
											Request Sent
										</Text>
									</View>
								)}
								{item.isAtLimit && (
									<View className='bg-red-500/20 px-2 py-1 rounded border border-red-500/40'>
										<Text className='text-red-500 text-xs font-semibold'>Full</Text>
									</View>
								)}
							</View>
						</View>
					{item.coachDetails?.specialization && (
						<View className='flex-row flex-wrap mb-2'>
							{item.coachDetails.specialization
								.slice(0, 3)
								.map((spec: string, index: number) => (
									<View
										key={index}
										className='bg-bg-darker px-2 py-1 rounded mr-2 mb-1 border border-[#F9C513]/30'
									>
										<Text className='text-text-secondary text-xs'>{spec}</Text>
									</View>
								))}
						</View>
					)}
					<View className='flex-row items-center'>
						<Ionicons name='star' size={16} color='#F9C513' />
						<Text className='text-text-secondary text-sm ml-1'>
							{item.coachDetails?.ratings?.toFixed(1) || 'N/A'}
						</Text>
						{item.coachDetails?.yearsOfExperience && (
							<>
								<Text className='text-text-secondary text-sm mx-2'>•</Text>
								<Text className='text-text-secondary text-sm'>
									{item.coachDetails.yearsOfExperience} years exp.
								</Text>
							</>
						)}
					</View>
				</View>
			</View>
		</TouchableOpacity>
		);
	};

	return (
		<FixedView className='flex-1 bg-bg-darker'>
			<TabHeader showCoachIcon={false} />
			<ScrollView
				ref={scrollViewRef}
				className='flex-1'
				contentContainerClassName='p-5'
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor='#F9C513' />
				}
			>
				<View className='flex-row items-center justify-between mb-6'>
					<View>
						<Text className='text-3xl font-bold text-text-primary'>
							Find a Coach
						</Text>
						<Text className='text-text-secondary mt-1'>
							Choose the perfect coach for you
						</Text>
					</View>
				</View>

				{/* Search Bar */}
				<View className='mb-6'>
					<Input
						placeholder='Search coaches by name or specialization...'
						value={searchQuery}
						onChangeText={setSearchQuery}
						className='bg-bg-primary border border-[#F9C513]/20'
					/>
				</View>

				{/* My Coaches Button */}
				{currentCoaches.length > 0 && (
					<View className='mb-6'>
						<TouchableOpacity
							onPress={() => setShowMyCoachesModal(true)}
							className='bg-green-500/20 rounded-xl p-4 border border-green-500/40 flex-row items-center justify-between'
						>
							<View className='flex-row items-center'>
								<View className='bg-green-500 rounded-full w-12 h-12 items-center justify-center mr-3'>
									<Ionicons name='people' size={24} color='#fff' />
								</View>
								<View>
									<Text className='text-text-primary font-semibold text-lg'>
										My Coaches
									</Text>
									<Text className='text-text-secondary text-sm'>
										{currentCoaches.length} active coach
										{currentCoaches.length !== 1 ? 'es' : ''}
									</Text>
								</View>
							</View>
							<Ionicons name='chevron-forward' size={24} color='#34C759' />
						</TouchableOpacity>
					</View>
				)}

				{loading ? (
					<View className='bg-bg-primary rounded-xl border border-[#F9C513]/20 overflow-hidden'>
						<PremiumLoadingContent embedded message='Please wait..' />
					</View>
				) : (
					<>
						{/* Recommended Coaches */}
						{filteredRecommended.length > 0 && (
							<View className='mb-6'>
								<Text className='text-xl font-semibold text-text-primary mb-4'>
									Recommended for You
								</Text>
								<FlatList
									data={filteredRecommended}
									keyExtractor={(item) => item.id}
									renderItem={renderCoachCard}
									scrollEnabled={false}
								/>
							</View>
						)}

						{/* All Coaches */}
						<View>
							<Text className='text-xl font-semibold text-text-primary mb-4'>
								All Coaches
							</Text>
							{filteredOther.length === 0 ? (
								<View className='bg-bg-primary rounded-xl p-6 items-center border border-[#F9C513]/20'>
									<Ionicons name='people-outline' size={48} color='#8E8E93' />
									<Text className='text-text-secondary mt-4 text-center'>
										No coaches found
									</Text>
								</View>
							) : (
								<FlatList
									data={filteredOther}
									keyExtractor={(item) => item.id}
									renderItem={renderCoachCard}
									scrollEnabled={false}
								/>
							)}
						</View>
					</>
				)}
			</ScrollView>

			{/* Coach Profile Modal */}
			<Modal
				visible={showProfileModal}
				animationType='slide'
				transparent={false}
				onRequestClose={() => {
					setShowProfileModal(false);
					setSelectedCoach(null);
				}}
			>
				<View className='flex-1 bg-bg-darker justify-end'>
					<View className='bg-bg-primary rounded-t-3xl p-6 max-h-[90%] border-t-2 border-[#F9C513]/30'>
						<ScrollView showsVerticalScrollIndicator={false}>
							<View className='flex-row justify-between items-center mb-6 pb-4 border-b border-bg-darker/30'>
								<Text className='text-2xl font-bold text-text-primary'>
									Coach Profile
								</Text>
								<TouchableOpacity
									onPress={() => {
										setShowProfileModal(false);
										setSelectedCoach(null);
									}}
									className='p-2 rounded-full border border-bg-darker/30'
								>
									<Ionicons name='close' size={28} color='#8E8E93' />
								</TouchableOpacity>
							</View>

							{selectedCoach && (
								<>
									<View className='items-center mb-6 pb-6 border-b border-bg-darker/30'>
										<View className='bg-[#F9C513] rounded-full w-24 h-24 items-center justify-center mb-4 border-2 border-bg-darker/30'>
											<Text className='text-bg-darker font-bold text-3xl'>
												{selectedCoach.firstName.charAt(0)}
												{selectedCoach.lastName.charAt(0)}
											</Text>
										</View>
										<Text className='text-2xl font-bold text-text-primary mb-1'>
											Coach {selectedCoach.firstName} {selectedCoach.lastName}
										</Text>
										<View className='flex-row items-center'>
											<Ionicons name='star' size={20} color='#F9C513' />
											<Text className='text-text-primary font-semibold ml-1 text-lg'>
												{selectedCoach.coachDetails?.ratings?.toFixed(1) ||
													'N/A'}
											</Text>
										</View>
									</View>

									{selectedCoach.coachDetails?.specialization && (
										<View className='mb-6 pb-6 border-b border-bg-darker/30'>
											<Text className='text-text-primary font-semibold mb-3 text-lg'>
												Specializations
											</Text>
											<View className='flex-row flex-wrap'>
												{selectedCoach.coachDetails.specialization.map(
													(spec: string, index: number) => (
														<View
															key={index}
															className='bg-bg-darker px-3 py-2 rounded-lg mr-2 mb-2 border border-[#F9C513]/30'
														>
															<Text className='text-text-primary'>{spec}</Text>
														</View>
													)
												)}
											</View>
										</View>
									)}

									{selectedCoach.coachDetails?.yearsOfExperience && (
										<View className='mb-6 pb-6 border-b border-bg-darker/30'>
											<Text className='text-text-primary font-semibold mb-2 text-lg'>
												Experience
											</Text>
											<Text className='text-text-secondary'>
												{selectedCoach.coachDetails.yearsOfExperience} years of
												experience
											</Text>
										</View>
									)}

									{selectedCoach.coachDetails?.moreDetails && (
										<View className='mb-6 pb-6 border-b border-bg-darker/30'>
											<Text className='text-text-primary font-semibold mb-2 text-lg'>
												About
											</Text>
											<Text className='text-text-secondary'>
												{selectedCoach.coachDetails.moreDetails}
											</Text>
										</View>
									)}

									<View className='mb-6 pb-6 border-b border-bg-darker/30'>
										<Text className='text-text-primary font-semibold mb-2 text-lg'>
											Availability
										</Text>
										{selectedCoach.coachDetails?.teachingDate && (
											<Text className='text-text-secondary mb-1'>
												Days:{' '}
												{selectedCoach.coachDetails.teachingDate.join(', ')}
											</Text>
										)}
										{selectedCoach.coachDetails?.teachingTime &&
											selectedCoach.coachDetails.teachingTime.length > 0 && (
												<Text className='text-text-secondary'>
													Times:{' '}
													{selectedCoach.coachDetails.teachingTime
														.map((time: any) => formatTimeRangeTo12Hour(time))
														.join(', ')}
												</Text>
											)}
									</View>

									<View className='mb-6 pb-6 border-b border-bg-darker/30'>
										<Text className='text-text-primary font-semibold mb-2 text-lg'>
											Client Capacity
										</Text>
										<Text className='text-text-secondary'>
											{selectedCoach.coachDetails?.clientsIds?.length || 0} /{' '}
											{selectedCoach.coachDetails?.clientLimit || 'Unlimited'}{' '}
											clients
										</Text>
										{selectedCoach.isAtLimit && (
											<Text className='text-red-500 mt-2'>
												This coach is currently at full capacity
											</Text>
										)}
									</View>

									{/* Request Coach Button */}
									<View className='mt-4'>
										{!hasMembership ? (
											<GradientButton
												onPress={() => {
													setShowProfileModal(false);
													setShowMembershipConfirm(true);
												}}
												disabled={selectedCoach.isAtLimit}
											>
												Subscribe to Request Coach
											</GradientButton>
										) : (
											<>
												{user?.membershipDetails?.coachesIds?.includes(
													selectedCoach.id
												) ? (
													<View className='bg-green-500/20 px-4 py-3 rounded-lg items-center border border-green-500/40'>
														<Ionicons
															name='checkmark-circle'
															size={24}
															color='#4CAF50'
														/>
														<Text className='text-green-500 font-semibold mt-2'>
															You already have this coach
														</Text>
													</View>
												) : hasPendingForCoach.has(selectedCoach.id) ? (
													<View className='bg-[#F9C513]/20 px-4 py-3 rounded-lg items-center border border-[#F9C513]/40'>
														<Ionicons
															name='checkmark-circle-outline'
															size={24}
															color='#F9C513'
														/>
														<Text className='text-[#F9C513] font-semibold mt-2'>
															Request Sent
														</Text>
														{pendingRequests.some(
															(req: any) => req.coachId === selectedCoach.id
														) && (
															<TouchableOpacity
																onPress={() => {
																	const request = pendingRequests.find(
																		(req: any) => req.coachId === selectedCoach.id
																	);
																	if (request) setRequestToCancel(request);
																}}
																className='mt-2'
																activeOpacity={0.7}
															>
																<Text className='text-[#F9C513] text-sm underline'>
																	Cancel Request
																</Text>
															</TouchableOpacity>
														)}
													</View>
												) : (
													<GradientButton
														onPress={() => handleRequestCoach(selectedCoach)}
														disabled={selectedCoach.isAtLimit || requesting}
														loading={requesting}
													>
														{requesting
															? 'Sending Request...'
															: selectedCoach.isAtLimit
																? 'Coach is Full'
																: 'Request Coach'}
													</GradientButton>
												)}
											</>
										)}
									</View>
								</>
							)}
						</ScrollView>
					</View>
				</View>
			</Modal>

			{/* My Coaches Modal */}
			<Modal
				visible={showMyCoachesModal}
				animationType='slide'
				transparent={false}
				onRequestClose={() => {
					setShowMyCoachesModal(false);
				}}
			>
				<View className='flex-1 bg-bg-darker'>
					<View className='bg-bg-primary border-b border-[#F9C513]/20 pt-12 pb-4 px-5'>
						<View className='flex-row items-center justify-between'>
							<View>
								<Text className='text-2xl font-bold text-text-primary'>
									My Coaches
								</Text>
								<Text className='text-text-secondary text-sm mt-1'>
									{currentCoaches.length} active coach
									{currentCoaches.length !== 1 ? 'es' : ''}
								</Text>
							</View>
							<TouchableOpacity
								onPress={() => setShowMyCoachesModal(false)}
								className='p-2 rounded-full border border-bg-darker/30'
							>
								<Ionicons name='close' size={28} color='#8E8E93' />
							</TouchableOpacity>
						</View>
					</View>

					<ScrollView
						className='flex-1'
						contentContainerClassName='p-5'
						showsVerticalScrollIndicator={false}
					>
						{currentCoaches.length === 0 ? (
							<View className='bg-bg-primary rounded-xl p-6 items-center border border-[#F9C513]/20 mt-10'>
								<Ionicons name='people-outline' size={48} color='#8E8E93' />
								<Text className='text-text-secondary mt-4 text-center'>
									You don&apos;t have any coaches yet
								</Text>
							</View>
						) : (
							<FlatList
								data={currentCoaches}
								keyExtractor={(item) => item.id}
								renderItem={renderCoachCard}
								scrollEnabled={false}
							/>
						)}
					</ScrollView>
				</View>
			</Modal>

			<ConfirmModal
				visible={!!coachToRequest}
				title="Request Coach"
				message={
					coachToRequest
						? `Send a request to Coach ${coachToRequest.firstName} ${coachToRequest.lastName}?`
						: ''
				}
				variant="neutral"
				confirmLabel="Send Request"
				cancelLabel="Cancel"
				onConfirm={confirmRequestCoach}
				onCancel={() => setCoachToRequest(null)}
				loading={requesting}
			/>
			<ConfirmModal
				visible={!!requestToCancel}
				title="Cancel Request"
				message="Are you sure you want to cancel this request?"
				variant="danger"
				confirmLabel="Yes, Cancel"
				cancelLabel="No"
				onConfirm={confirmCancelRequest}
				onCancel={() => setRequestToCancel(null)}
			/>
			<ConfirmModal
				visible={showMembershipConfirm}
				title="Membership Required"
				message="You need an active gym membership to request a coach. Would you like to subscribe now?"
				variant="neutral"
				confirmLabel="Subscribe"
				cancelLabel="Cancel"
				onConfirm={confirmMembershipRedirect}
				onCancel={() => setShowMembershipConfirm(false)}
			/>
			<ConfirmModal
				visible={!!successModal}
				title={successModal?.title ?? ''}
				message={successModal?.message ?? ''}
				variant="success"
				confirmLabel="OK"
				onConfirm={() => setSuccessModal(null)}
				onCancel={() => setSuccessModal(null)}
				hideCancel
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
		</FixedView>
	);
};

export default MemberCoaches;
