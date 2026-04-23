import DatePicker from '@/components/DatePicker';
import FixedView from '@/components/FixedView';
import GradientButton from '@/components/GradientButton';
import Select from '@/components/Select';
import TabHeader from '@/components/TabHeader';
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/contexts/AuthContext';
import {
	GetUsersQuery,
	GetUsersQueryVariables,
} from '@/graphql/generated/types';
import { CREATE_PROGRESS_RATING_MUTATION } from '@/graphql/mutations';
import {
	GET_ALL_CLIENT_GOALS_QUERY,
	GET_PROGRESS_RATINGS_QUERY,
	GET_SESSION_LOGS_FOR_RATING_QUERY,
	GET_USERS_QUERY,
} from '@/graphql/queries';
import { formatTimeTo12Hour } from '@/utils/time-utils';
import { useMutation, useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
	Dimensions,
	FlatList,
	Image,
	Modal,
	RefreshControl,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';

const { width } = Dimensions.get('window');

function formatKgDisplay(value: number | null | undefined): string | null {
	if (value == null) return null;
	const n = Number(value);
	if (Number.isNaN(n)) return null;
	const rounded = Math.round(n * 10) / 10;
	return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

const verdictOptions = [
	{ label: 'Progressive', value: 'progressive' },
	{ label: 'Close to Achievement', value: 'close_to_achievement' },
	{ label: 'Achieved', value: 'achieved' },
	{ label: 'Regressing', value: 'regressing' },
];

const CoachProgress = () => {
	const { user } = useAuth();
	const [refreshing, setRefreshing] = useState(false);
	const [selectedClient, setSelectedClient] = useState<any>(null);
	const [selectedGoal, setSelectedGoal] = useState<any>(null);
	const [showClientGoals, setShowClientGoals] = useState(false);
	const [showRatingModal, setShowRatingModal] = useState(false);
	const [startDate, setStartDate] = useState<Date | undefined>();
	const [endDate, setEndDate] = useState<Date | undefined>();
	const [rating, setRating] = useState(0);
	const [comment, setComment] = useState('');
	const [verdict, setVerdict] = useState('');
	const [selectedSessionLogs, setSelectedSessionLogs] = useState<string[]>([]);
	const [showImageModal, setShowImageModal] = useState(false);
	const [selectedImages, setSelectedImages] = useState<any>(null);
	const [lockedExistingRating, setLockedExistingRating] = useState<any>(null);
	const [showRatingSuccess, setShowRatingSuccess] = useState(false);
	const [alertModal, setAlertModal] = useState<{
		visible: boolean;
		title: string;
		message: string;
		variant: 'danger' | 'neutral' | 'success' | 'warning';
	}>({ visible: false, title: '', message: '', variant: 'neutral' });

	const { data: clientsData, refetch: refetchClients } = useQuery<
		GetUsersQuery,
		GetUsersQueryVariables
	>(GET_USERS_QUERY, {
		variables: { role: 'member' },
		fetchPolicy: 'cache-and-network',
	});

	const { data: goalsData, refetch: refetchGoals } = useQuery(
		GET_ALL_CLIENT_GOALS_QUERY,
		{
			variables: { coachId: user?.id || '', status: 'active' },
			fetchPolicy: 'cache-and-network',
			skip: !user?.id,
		}
	);

	const { data: sessionLogsData, loading: loadingSessionLogsForRating } = useQuery(
		GET_SESSION_LOGS_FOR_RATING_QUERY,
		{
			variables: {
				clientId: selectedClient?.id || '',
				goalId: selectedGoal?.id || '',
				startDate: startDate?.toISOString() || '',
				endDate: endDate?.toISOString() || '',
			},
			skip:
				!selectedClient ||
				!selectedGoal ||
				!startDate ||
				!endDate ||
				!showRatingModal,
			fetchPolicy: 'cache-and-network',
		}
	);

	const {
		data: progressRatingsData,
		refetch: refetchProgressRatings,
		loading: loadingProgressRatings,
	} = useQuery(
		GET_PROGRESS_RATINGS_QUERY,
		{
			variables: {
				clientId: selectedClient?.id || '',
				goalId: selectedGoal?.id || '',
			},
			skip: !selectedClient?.id || !selectedGoal?.id || !showRatingModal,
			fetchPolicy: 'network-only',
		}
	);

	const [createRating, { loading: creatingRating }] = useMutation(
		CREATE_PROGRESS_RATING_MUTATION,
		{
			onCompleted: () => {
				setShowRatingSuccess(true);
				closeRatingModal();
			},
			onError: async (error) => {
				const msg = error.message || '';
				if (msg.toLowerCase().includes('overlapping date range')) {
					setLockedExistingRating({ id: `locked-${selectedGoal?.id || 'rating'}` });
					await refetchProgressRatings();
					setAlertModal({
						visible: true,
						title: 'Existing rating found',
						message:
							'A rating already exists in this date range. It is now view-only.',
						variant: 'warning',
					});
					return;
				}
				setAlertModal({ visible: true, title: 'Error', message: error.message, variant: 'danger' });
			},
		}
	);

	useEffect(() => {
		refetchClients();
		refetchGoals();
	}, [refetchClients, refetchGoals]);

	useEffect(() => {
		if (showRatingModal) {
			const today = new Date();
			const start = new Date();
			start.setDate(today.getDate() - 30);
			setEndDate(today);
			setStartDate(start);
		}
	}, [showRatingModal]);

	const onRefresh = async () => {
		setRefreshing(true);
		try {
			await Promise.all([refetchClients(), refetchGoals()]);
		} finally {
			setRefreshing(false);
		}
	};

	const clients = useMemo(() => {
		if (!clientsData?.getUsers || !user?.coachDetails?.clientsIds) {
			return [];
		}
		const coachClientIds = user.coachDetails.clientsIds;
		return clientsData.getUsers.filter((client: any) =>
			coachClientIds.includes(client.id)
		);
	}, [clientsData, user]);

	const clientGoals = useMemo(() => {
		if (!selectedClient || !(goalsData as any)?.getAllClientGoals) {
			return [];
		}
		return (goalsData as any).getAllClientGoals.filter(
			(goal: any) =>
				goal.clientId === selectedClient.id && goal.coachId === user?.id
		);
	}, [selectedClient, goalsData, user]);

	const sessionLogs = (sessionLogsData as any)?.getSessionLogsForRating || [];
	const allProgressRatings = (progressRatingsData as any)?.getProgressRatings || [];

	const existingOverlappingRating = useMemo(() => {
		if (!startDate || !endDate) return null;
		const startMs = startDate.getTime();
		const endMs = endDate.getTime();
		const overlaps = allProgressRatings
			.filter((r: any) => {
				const rs = new Date(r.startDate).getTime();
				const re = new Date(r.endDate).getTime();
				if (!Number.isFinite(rs) || !Number.isFinite(re)) return false;
				return startMs <= re && endMs >= rs;
			})
			.sort((a: any, b: any) => {
				const ams = new Date(a.updatedAt || a.createdAt || 0).getTime();
				const bms = new Date(b.updatedAt || b.createdAt || 0).getTime();
				return bms - ams;
			});
		return overlaps[0] || null;
	}, [allProgressRatings, endDate, startDate]);

	const resetRatingForm = () => {
		setStartDate(undefined);
		setEndDate(undefined);
		setRating(0);
		setComment('');
		setVerdict('');
		setSelectedSessionLogs([]);
		setLockedExistingRating(null);
	};

	const closeRatingModal = () => {
		setShowRatingModal(false);
		resetRatingForm();
		setSelectedGoal(null); // Clear goal when modal closes
	};

	const handleStartRating = (goal: any) => {
		// Reset form fields first
		resetRatingForm();
		setSelectedGoal(goal);
		setShowClientGoals(false);
		setShowRatingModal(true);
	};

	const showAlert = (title: string, message: string, variant: 'danger' | 'warning' = 'warning') => {
		setAlertModal({ visible: true, title, message, variant });
	};

	const handleSubmitRating = () => {
		if (!selectedClient || !selectedClient.id) {
			showAlert('Error', 'Client information is missing. Please try again.');
			return;
		}

		if (!selectedGoal || !selectedGoal.id) {
			showAlert('Error', 'Goal information is missing. Please try again.');
			return;
		}

		if (!startDate || !endDate) {
			showAlert('Error', 'Please select both start and end dates');
			return;
		}

		if (startDate > endDate) {
			showAlert('Error', 'Start date must be before end date');
			return;
		}

		if (rating < 1 || rating > 5) {
			showAlert('Error', 'Please choose a valid rating between 1 and 5');
			return;
		}

		if (!comment.trim()) {
			showAlert('Error', 'Please enter a comment');
			return;
		}

		if (!verdict) {
			showAlert('Error', 'Please select a verdict');
			return;
		}

		if (isExistingRatingViewOnly) {
			showAlert(
				'Already rated',
				'A progress rating already exists for this range. It is view-only.',
				'warning'
			);
			return;
		}

		if (loadingSessionLogsForRating) {
			showAlert('Please wait', 'Loading completed sessions for this range…');
			return;
		}

		if (sessionLogs.length === 0) {
			showAlert(
				'No completed sessions',
				'There are no completed sessions with this member for this goal in this date range. Finish at least one session together, then rate progress.',
				'warning'
			);
			return;
		}

		if (selectedSessionLogs.length === 0) {
			showAlert(
				'Session required',
				'Select at least one completed session log. Ratings must be tied to real sessions you completed with this member.',
				'warning'
			);
			return;
		}

		createRating({
			variables: {
				input: {
					clientId: selectedClient.id,
					goalId: selectedGoal.id,
					startDate: startDate.toISOString(),
					endDate: endDate.toISOString(),
					rating,
					comment: comment.trim(),
					verdict: verdict,
					sessionLogIds: selectedSessionLogs,
				},
			},
		});
	};

	useEffect(() => {
		if (!showRatingModal || !existingOverlappingRating) return;
		const existingRatingValue = Number(existingOverlappingRating.rating) || 0;
		setRating(Math.min(5, Math.max(0, existingRatingValue)));
		setComment(existingOverlappingRating.comment || '');
		setVerdict(existingOverlappingRating.verdict || '');
		setSelectedSessionLogs(existingOverlappingRating.sessionLogIds || []);
	}, [showRatingModal, existingOverlappingRating?.id]);

	const effectiveExistingRating = existingOverlappingRating || lockedExistingRating;
	const isExistingRatingViewOnly = Boolean(effectiveExistingRating?.id);

	/** Rating / comment / verdict only apply when there are sessions (or we're showing a saved rating). */
	const showRatingVerdictSections =
		sessionLogs.length > 0 || isExistingRatingViewOnly;

	const verdictLabel = useMemo(() => {
		const hit = verdictOptions.find((v) => v.value === verdict);
		return hit?.label || verdict || '—';
	}, [verdict]);

	const toggleSessionLogSelection = (logId: string) => {
		setSelectedSessionLogs((prev) => {
			if (prev.includes(logId)) {
				return prev.filter((id) => id !== logId);
			} else {
				return [...prev, logId];
			}
		});
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
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
				<View className='flex-row justify-between items-center mb-6'>
					<View>
						<Text className='text-3xl font-bold text-text-primary'>
							Client Progress
						</Text>
						<Text className='text-text-secondary mt-1'>
							Track and rate your clients&apos; progress
						</Text>
					</View>
					<Ionicons name='trending-up' size={32} color='#F9C513' />
				</View>

				{clients.length === 0 ? (
					<View
						className='bg-bg-primary rounded-xl p-6 items-center border border-[#F9C513]'
						style={{ borderWidth: 0.5 }}
					>
						<Ionicons name='people-outline' size={48} color='#8E8E93' />
						<Text className='text-text-secondary mt-4 text-center text-base'>
							No clients yet
						</Text>
						<Text className='text-text-secondary mt-2 text-center text-sm'>
							Client progress will appear here
						</Text>
					</View>
				) : (
					<FlatList
						data={clients}
						keyExtractor={(item) => item?.id || ''}
						scrollEnabled={false}
						renderItem={({ item }) => {
							if (!item) return null;
							return (
								<TouchableOpacity
									onPress={() => {
										setSelectedClient(item);
										setShowClientGoals(true);
									}}
									className='bg-bg-primary rounded-xl p-4 mb-3 border border-[#F9C513]'
									style={{ borderWidth: 0.5 }}
								>
									<View className='flex-row items-center justify-between'>
										<View className='flex-1'>
											<Text className='text-text-primary font-semibold text-lg mb-1'>
												{item.firstName} {item.lastName}
											</Text>
											<Text className='text-text-secondary text-sm'>
												{item.email}
											</Text>
										</View>
										<Ionicons
											name='chevron-forward'
											size={24}
											color='#8E8E93'
										/>
									</View>
								</TouchableOpacity>
							);
						}}
					/>
				)}
			</ScrollView>

			{/* Client Goals Modal */}
			<Modal
				visible={showClientGoals}
				animationType='slide'
				transparent
				onRequestClose={() => {
					setShowClientGoals(false);
					setSelectedClient(null);
				}}
			>
				<View className='flex-1 bg-bg-darker justify-end'>
					<View
						className='bg-bg-primary rounded-t-3xl p-6 max-h-[90%] border-t border-[#F9C513]'
						style={{ borderTopWidth: 0.5 }}
					>
						<View className='flex-row justify-between items-center mb-4'>
							<View className='flex-1'>
								<Text className='text-2xl font-bold text-text-primary'>
									{selectedClient?.firstName} {selectedClient?.lastName}
								</Text>
								<Text className='text-text-secondary text-sm mt-1'>
									Select a goal to rate progress
								</Text>
							</View>
							<TouchableOpacity
								onPress={() => {
									setShowClientGoals(false);
									setSelectedClient(null);
								}}
							>
								<Ionicons name='close' size={28} color='#8E8E93' />
							</TouchableOpacity>
						</View>
						<ScrollView showsVerticalScrollIndicator={false}>
							{clientGoals.length === 0 ? (
								<View className='items-center py-10'>
									<Ionicons name='flag-outline' size={48} color='#8E8E93' />
									<Text className='text-text-secondary mt-4 text-center'>
										No active goals assigned to you
									</Text>
								</View>
							) : (
								<FlatList
									data={clientGoals}
									keyExtractor={(item) => item.id}
									scrollEnabled={false}
									renderItem={({ item }) => (
										<TouchableOpacity
											onPress={() => handleStartRating(item)}
											className='bg-bg-darker rounded-xl p-4 mb-3 border border-[#F9C513]'
											style={{ borderWidth: 0.5 }}
										>
											<View className='flex-row items-center justify-between'>
												<View className='flex-1'>
													<Text className='text-text-primary font-semibold text-lg mb-1'>
														{item.title}
													</Text>
													<Text className='text-text-secondary text-sm'>
														{item.goalType}
													</Text>
													{item.description && (
														<Text className='text-text-secondary text-xs mt-1'>
															{item.description}
														</Text>
													)}
												</View>
												<Ionicons
													name='chevron-forward'
													size={24}
													color='#8E8E93'
												/>
											</View>
										</TouchableOpacity>
									)}
								/>
							)}
						</ScrollView>
					</View>
				</View>
			</Modal>

			{/* Rating Modal */}
			<Modal
				visible={showRatingModal}
				animationType='slide'
				transparent
				onRequestClose={closeRatingModal}
			>
				<View className='flex-1 bg-bg-darker justify-end'>
					<View
						className='bg-bg-primary rounded-t-3xl p-6 max-h-[90%] border-t border-[#F9C513]'
						style={{ borderTopWidth: 0.5 }}
					>
						<ScrollView showsVerticalScrollIndicator={false}>
							<View className='flex-row justify-between items-center mb-6'>
								<View className='flex-1'>
									<Text className='text-2xl font-bold text-text-primary'>
										Rate Progress
									</Text>
									<Text className='text-text-secondary text-sm mt-1'>
										{selectedGoal?.title}
									</Text>
								</View>
								<TouchableOpacity onPress={closeRatingModal}>
									<Ionicons name='close' size={28} color='#8E8E93' />
								</TouchableOpacity>
							</View>

							{selectedGoal ? (
								<View
									className='mb-6 rounded-lg border border-[#F9C513]/40 bg-bg-darker p-4'
									style={{ borderWidth: 0.5 }}
								>
									<Text className='text-text-primary font-semibold mb-1'>Goal reference</Text>
									<Text className='text-text-secondary text-xs mb-3'>
										What your client sees on their session recap for this goal — use it to
										contextualize your rating.
									</Text>
									{selectedGoal.title ? (
										<Text className='text-text-secondary text-sm mb-2'>
											Goal:{' '}
											<Text className='text-text-primary font-medium'>{selectedGoal.title}</Text>
											{selectedGoal.goalType ? (
												<Text className='text-text-secondary'>
													{' '}
													· {selectedGoal.goalType}
												</Text>
											) : null}
										</Text>
									) : null}
									{formatKgDisplay(selectedGoal.currentWeight) ? (
										<Text className='text-text-primary text-sm mb-1'>
											Starting weight (goal):{' '}
											<Text className='font-bold text-[#F9C513]'>
												{formatKgDisplay(selectedGoal.currentWeight)} kg
											</Text>
										</Text>
									) : null}
									{formatKgDisplay(selectedGoal.targetWeight) ? (
										<Text className='text-text-primary text-sm mb-1'>
											Target:{' '}
											<Text className='font-semibold text-text-primary'>
												{formatKgDisplay(selectedGoal.targetWeight)} kg
											</Text>
										</Text>
									) : null}
									{!formatKgDisplay(selectedGoal.currentWeight) &&
									!formatKgDisplay(selectedGoal.targetWeight) ? (
										<Text className='text-text-secondary text-sm'>
											No weight baseline is set on this goal yet. Non-weight goals may only show
											the title above.
										</Text>
									) : null}
								</View>
							) : null}

							{/* Date Range Summary (fixed, not editable) */}
							<View className='mb-6'>
								<Text className='text-text-primary font-semibold mb-1'>
									Date Range
								</Text>
								<Text className='text-text-secondary text-xs mb-3'>
									Based on this goal&apos;s recent work. This range is fixed so you can focus on the rating.
								</Text>
								<View className='flex-row gap-3'>
									<View className='flex-1'>
										<Text className='text-text-secondary text-sm mb-2'>
											Start Date
										</Text>
										<View
											className='bg-bg-darker rounded-lg px-4 py-3 border border-[#F9C513]/40 justify-center'
											style={{ borderWidth: 0.5, minHeight: 48 }}
										>
											<Text className='text-text-primary text-base' numberOfLines={1}>
												{startDate
													? new Date(startDate).toLocaleDateString('en-US', {
															year: 'numeric',
															month: 'long',
															day: 'numeric',
													  })
													: '—'}
											</Text>
										</View>
									</View>
									<View className='flex-1'>
										<Text className='text-text-secondary text-sm mb-2'>
											End Date
										</Text>
										<View
											className='bg-bg-darker rounded-lg px-4 py-3 border border-[#F9C513]/40 justify-center'
											style={{ borderWidth: 0.5, minHeight: 48 }}
										>
											<Text className='text-text-primary text-base' numberOfLines={1}>
												{endDate
													? new Date(endDate).toLocaleDateString('en-US', {
															year: 'numeric',
															month: 'long',
															day: 'numeric',
													  })
													: '—'}
											</Text>
										</View>
									</View>
								</View>
							</View>

							{isExistingRatingViewOnly ? (
								<View
									className='mb-6 rounded-lg border border-[#F9C513]/40 bg-bg-darker p-3'
									style={{ borderWidth: 0.5 }}
								>
									<Text className='text-[#F9C513] text-xs'>
										This date range already has a saved progress rating. You can view it
										here, but you cannot edit or submit again.
									</Text>
								</View>
							) : null}

							{!isExistingRatingViewOnly && loadingSessionLogsForRating ? (
								<View className='mb-6'>
									<Text className='text-text-secondary text-sm'>
										Loading completed sessions in this date range…
									</Text>
								</View>
							) : null}

							{!isExistingRatingViewOnly &&
							!loadingSessionLogsForRating &&
							sessionLogs.length === 0 ? (
								<View
									className='mb-6 rounded-lg border border-[#F9C513]/40 bg-bg-darker p-3'
									style={{ borderWidth: 0.5 }}
								>
									<Text className='text-text-secondary text-sm'>
										No completed sessions appear in this range for this goal. You can only
										submit a rating after at least one session with this member is completed.
									</Text>
								</View>
							) : null}

							{/* Session Logs with Images */}
							{sessionLogs.length > 0 && (
								<View className='mb-6'>
									<Text className='text-text-primary font-semibold mb-3'>
										Session logs ({sessionLogs.length}){' '}
										{!isExistingRatingViewOnly ? (
											<Text className='text-red-500 text-xs font-normal'>*</Text>
										) : null}
									</Text>
									<Text className='text-text-secondary text-sm mb-3'>
										Select one or more completed sessions this rating is based on. Review
										progress images if available.
									</Text>
									<FlatList
										data={sessionLogs}
										keyExtractor={(item) => item.id}
										scrollEnabled={false}
										renderItem={({ item }) => {
											const isSelected = selectedSessionLogs.includes(item.id);
											return (
												<View
													className={`bg-bg-darker rounded-xl p-4 mb-3 border ${
														isSelected ? 'border-[#F9C513]' : 'border-[#2C2C2E]'
													}`}
													style={{ borderWidth: 0.5 }}
												>
													<TouchableOpacity
														activeOpacity={isExistingRatingViewOnly ? 1 : 0.7}
														onPress={() => {
															if (!isExistingRatingViewOnly) {
																toggleSessionLogSelection(item.id);
															}
														}}
													>
														<View className='flex-row items-start justify-between mb-2'>
															<View className='flex-1 mr-2'>
																<Text className='text-text-primary font-semibold mb-1'>
																	{item.session?.name || 'Session'}
																</Text>
																<View className='flex-row items-center mb-1'>
																	<Ionicons
																		name='calendar-outline'
																		size={12}
																		color='#8E8E93'
																	/>
																	<Text className='text-text-secondary text-xs ml-1'>
																		{formatDate(
																			item.completedAt || item.session?.date
																		)}
																	</Text>
																</View>
																{item.session?.startTime && (
																	<View className='flex-row items-center mb-1'>
																		<Ionicons
																			name='time-outline'
																			size={12}
																			color='#8E8E93'
																		/>
																		<Text className='text-text-secondary text-xs ml-1'>
																			{formatTimeTo12Hour(item.session.startTime)}
																			{item.session?.endTime &&
																				` - ${formatTimeTo12Hour(item.session.endTime)}`}
																		</Text>
																	</View>
																)}
																{item.session?.gymArea && (
																	<View className='flex-row items-center'>
																		<Ionicons
																			name='location-outline'
																			size={12}
																			color='#8E8E93'
																		/>
																		<Text className='text-text-secondary text-xs ml-1'>
																			{item.session.gymArea}
																		</Text>
																	</View>
																)}
															</View>
															<View
																className={`w-6 h-6 rounded-full border-2 items-center justify-center flex-shrink-0 ${
																	isSelected
																		? 'bg-[#F9C513] border-[#F9C513]'
																		: 'border-[#8E8E93]'
																}`}
															>
																{isSelected && (
																	<Ionicons
																		name='checkmark'
																		size={16}
																		color='#1C1C1E'
																	/>
																)}
															</View>
														</View>
													</TouchableOpacity>
													{item.progressImages ? (
														<TouchableOpacity
															onPress={() => {
																setSelectedImages(item.progressImages);
																setShowImageModal(true);
															}}
															className='flex-row items-center mt-2'
															hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
															accessibilityRole='button'
															accessibilityLabel='View progress photos'
														>
															<Ionicons
																name='images'
																size={16}
																color='#F9C513'
															/>
															<Text className='text-[#F9C513] text-xs ml-2'>
																View Progress Photos
															</Text>
														</TouchableOpacity>
													) : null}
												</View>
											);
										}}
									/>
								</View>
							)}

							{showRatingVerdictSections ? (
								<>
									{/* Rating Input */}
									<View className='mb-6'>
										<Text className='text-text-primary font-semibold mb-2'>
											Rating (1-5) <Text className='text-red-500'>*</Text>
										</Text>
										<Text className='text-text-secondary text-sm mb-3'>
											Tap stars to rate progress.
										</Text>
										<View className='flex-row flex-wrap justify-center mb-2'>
											{Array.from({ length: 5 }).map((_, index) => {
												const star = index + 1;
												return (
													<TouchableOpacity
														key={star}
														onPress={() => {
															if (!isExistingRatingViewOnly) {
																setRating(star);
															}
														}}
														className='p-1'
														accessibilityLabel={`${star} out of 5`}
														disabled={isExistingRatingViewOnly}
													>
														<Ionicons
															name={star <= rating ? 'star' : 'star-outline'}
															size={30}
															color='#F9C513'
														/>
													</TouchableOpacity>
												);
											})}
										</View>
										<Text className='text-text-secondary text-center text-xs'>
											1 = Lowest, 5 = Highest progress
										</Text>
										{rating > 0 ? (
											<Text className='text-text-primary text-center mt-2 font-semibold'>
												{rating} out of 5
											</Text>
										) : null}
									</View>

									{/* Comment Input */}
									<View className='mb-6'>
										<Text className='text-text-primary font-semibold mb-2'>
											Comment <Text className='text-red-500'>*</Text>
										</Text>
										<TextInput
											className='bg-bg-darker rounded-lg px-4 py-3 text-text-primary border border-[#F9C513]'
											style={{
												borderWidth: 0.5,
												minHeight: 100,
												textAlignVertical: 'top',
												paddingRight: 14,
											}}
											placeholder='Enter your assessment and feedback...'
											placeholderTextColor='#8E8E93'
											value={comment}
											onChangeText={setComment}
											editable={!isExistingRatingViewOnly}
											selectTextOnFocus={!isExistingRatingViewOnly}
											multiline
											numberOfLines={4}
										/>
									</View>

									{/* Verdict Selection */}
									<View className='mb-6'>
										<Text className='text-text-primary font-semibold mb-2'>
											Final Verdict <Text className='text-red-500'>*</Text>
										</Text>
										{isExistingRatingViewOnly ? (
											<View
												className='bg-bg-darker rounded-lg px-4 py-3 border border-[#F9C513]/40'
												style={{
													borderWidth: 0.5,
													minHeight: 48,
													justifyContent: 'center',
												}}
											>
												<Text className='text-text-primary'>{verdictLabel}</Text>
											</View>
										) : (
											<Select
												options={verdictOptions}
												value={verdict}
												onChange={(v) => {
													if (!isExistingRatingViewOnly) {
														setVerdict(v);
													}
												}}
												placeholder='Select verdict'
											/>
										)}
									</View>
								</>
							) : null}

							{/* Submit: no sessions in range → no create button (rating UI is hidden too). */}
							{isExistingRatingViewOnly ? (
								<GradientButton onPress={closeRatingModal} className='mt-4'>
									Done
								</GradientButton>
							) : sessionLogs.length > 0 ? (
								<GradientButton
									onPress={handleSubmitRating}
									loading={creatingRating || loadingProgressRatings}
									disabled={
										creatingRating ||
										loadingProgressRatings ||
										loadingSessionLogsForRating ||
										selectedSessionLogs.length === 0
									}
									className='mt-4'
								>
									{creatingRating ? 'Creating Rating...' : 'Create Progress Rating'}
								</GradientButton>
							) : null}
						</ScrollView>
					</View>
				</View>
			</Modal>

			{/* Progress Images Modal */}
			<Modal
				visible={showImageModal}
				animationType='slide'
				transparent
				onRequestClose={() => setShowImageModal(false)}
			>
				<View className='flex-1 bg-bg-darker justify-end'>
					<View
						className='bg-bg-primary rounded-t-3xl p-6 max-h-[90%] border-t border-[#F9C513]'
						style={{ borderTopWidth: 0.5 }}
					>
						<ScrollView showsVerticalScrollIndicator={false}>
							<View className='flex-row justify-between items-center mb-6'>
								<Text className='text-2xl font-bold text-text-primary'>
									Progress Photos
								</Text>
								<TouchableOpacity onPress={() => setShowImageModal(false)}>
									<Ionicons name='close' size={28} color='#8E8E93' />
								</TouchableOpacity>
							</View>

							{selectedImages && (
								<View>
									{selectedImages.front && (
										<View className='mb-4'>
											<Text className='text-text-primary font-semibold mb-2'>
												Front
											</Text>
											<Image
												source={{ uri: selectedImages.front }}
												style={{
													width: '100%',
													height: width * 0.8,
													borderRadius: 12,
													borderWidth: 0.5,
													borderColor: '#F9C513',
												}}
												resizeMode='cover'
											/>
										</View>
									)}
									{selectedImages.rightSide && (
										<View className='mb-4'>
											<Text className='text-text-primary font-semibold mb-2'>
												Right Side
											</Text>
											<Image
												source={{ uri: selectedImages.rightSide }}
												style={{
													width: '100%',
													height: width * 0.8,
													borderRadius: 12,
													borderWidth: 0.5,
													borderColor: '#F9C513',
												}}
												resizeMode='cover'
											/>
										</View>
									)}
									{selectedImages.leftSide && (
										<View className='mb-4'>
											<Text className='text-text-primary font-semibold mb-2'>
												Left Side
											</Text>
											<Image
												source={{ uri: selectedImages.leftSide }}
												style={{
													width: '100%',
													height: width * 0.8,
													borderRadius: 12,
													borderWidth: 0.5,
													borderColor: '#F9C513',
												}}
												resizeMode='cover'
											/>
										</View>
									)}
									{selectedImages.back && (
										<View className='mb-4'>
											<Text className='text-text-primary font-semibold mb-2'>
												Back
											</Text>
											<Image
												source={{ uri: selectedImages.back }}
												style={{
													width: '100%',
													height: width * 0.8,
													borderRadius: 12,
													borderWidth: 0.5,
													borderColor: '#F9C513',
												}}
												resizeMode='cover'
											/>
										</View>
									)}
								</View>
							)}
						</ScrollView>
					</View>
				</View>
			</Modal>

			<ConfirmModal
				visible={showRatingSuccess}
				title='Progress Rated'
				message='Your progress rating was saved successfully.'
				variant='success'
				confirmLabel='Done'
				onConfirm={() => setShowRatingSuccess(false)}
				onCancel={() => setShowRatingSuccess(false)}
				hideCancel
			/>
			<ConfirmModal
				visible={alertModal.visible}
				title={alertModal.title}
				message={alertModal.message}
				variant={alertModal.variant as any}
				confirmLabel='OK'
				onConfirm={() => setAlertModal((p) => ({ ...p, visible: false }))}
				onCancel={() => setAlertModal((p) => ({ ...p, visible: false }))}
				hideCancel
			/>
		</FixedView>
	);
};

export default CoachProgress;
