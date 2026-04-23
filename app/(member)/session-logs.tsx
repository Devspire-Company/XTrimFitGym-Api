import { PremiumLoadingContent } from '@/components/AuthProcessingScreen';
import FixedView from '@/components/FixedView';
import TabHeader from '@/components/TabHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useMemberMembershipModal } from '@/contexts/MemberMembershipModalContext';
import { memberHasActiveGymMembership } from '@/utils/memberMembership';
import { GetSessionLogsQuery } from '@/graphql/generated/types';
import { CREATE_COACH_RATING_MUTATION } from '@/graphql/mutations';
import {
	GET_SESSION_LOGS_QUERY,
	GET_COACH_RATING_BY_SESSION_LOG_QUERY,
	GET_PROGRESS_RATINGS_QUERY,
} from '@/graphql/queries';
import { progressRatingIncludesSessionLog } from '@/utils/progress-rating-match';
import { formatTimeTo12Hour } from '@/utils/time-utils';
import { useMutation, useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Image as ExpoImage } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	Dimensions,
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
const MIN_COACH_RATING_COMMENT_LENGTH = 25;

function formatKgDisplay(value: number | null | undefined): string | null {
	if (value == null) return null;
	const n = Number(value);
	if (Number.isNaN(n)) return null;
	const rounded = Math.round(n * 10) / 10;
	return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function progressVerdictKey(verdict: string | undefined | null): string {
	return String(verdict || '')
		.toUpperCase()
		.replace(/-/g, '_');
}

interface WorkoutExercise {
	id: string;
	name: string;
	bodyPart: string;
	target: string;
	equipment?: string;
	gifUrl?: string;
	sets: number;
	reps: number;
}

const MemberSessionLogs = () => {
	const { user } = useAuth();
	const router = useRouter();
	const { openMembershipRequired } = useMemberMembershipModal();
	const hasMembership = memberHasActiveGymMembership(user);

	useFocusEffect(
		useCallback(() => {
			if (!hasMembership) {
				openMembershipRequired();
				router.navigate('/(member)/workouts');
			}
		}, [hasMembership, openMembershipRequired, router])
	);

	const [refreshing, setRefreshing] = useState(false);
	const [selectedLog, setSelectedLog] = useState<any>(null);
	const [showImagesModal, setShowImagesModal] = useState(false);
	const [showDetailsModal, setShowDetailsModal] = useState(false);
	const [pendingCoachRating, setPendingCoachRating] = useState(0);
	const [pendingCoachComment, setPendingCoachComment] = useState('');
	const [pendingCoachCommentError, setPendingCoachCommentError] = useState('');
	const [ratingSubmitError, setRatingSubmitError] = useState('');
	const [optimisticCoachRating, setOptimisticCoachRating] = useState<any>(null);

	const apiKey =
		(Constants?.expoConfig as any)?.extra?.exerciseDbApiKey ??
		(Constants?.manifest as any)?.extra?.exerciseDbApiKey;

	const buildExerciseImageUrl = useCallback(
		(exerciseId: string) => {
			if (!apiKey) return null;
			return `https://exercisedb.p.rapidapi.com/image?exerciseId=${encodeURIComponent(
				exerciseId
			)}&resolution=360&rapidapi-key=${apiKey}`;
		},
		[apiKey]
	);

	const parseWorkoutExercises = useCallback((workoutType: string | null | undefined): WorkoutExercise[] => {
		if (!workoutType) return [];
		try {
			const parsed = JSON.parse(workoutType);
			if (Array.isArray(parsed)) {
				return parsed.map((w: any) => ({
					id: String(w.id || ''),
					name: String(w.name || ''),
					bodyPart: String(w.bodyPart || ''),
					target: String(w.target || ''),
					equipment: w.equipment ? String(w.equipment) : undefined,
					gifUrl: w.gifUrl ? String(w.gifUrl) : undefined,
					sets: typeof w.sets === 'number' ? w.sets : parseInt(String(w.sets || '0'), 10) || 0,
					reps: typeof w.reps === 'number' ? w.reps : parseInt(String(w.reps || '0'), 10) || 0,
				}));
			}
			return [];
		} catch {
			return [];
		}
	}, []);

	const { data, refetch, loading } = useQuery<GetSessionLogsQuery>(
		GET_SESSION_LOGS_QUERY,
		{
			variables: { clientId: user?.id || '' },
			fetchPolicy: 'cache-and-network',
			skip: !user?.id,
		}
	);

	const sessionLogIdForDetails =
		showDetailsModal && selectedLog?.id ? selectedLog.id : '';

	const { data: detailsCoachRatingData, refetch: refetchDetailsCoachRating } = useQuery<any>(
		GET_COACH_RATING_BY_SESSION_LOG_QUERY,
		{
			variables: { sessionLogId: sessionLogIdForDetails },
			skip: !sessionLogIdForDetails || !user?.id,
			fetchPolicy: 'network-only',
		}
	);

	const goalIdForLogDetails = selectedLog?.session?.goal?.id || '';

	const { data: detailsProgressRatingsData } = useQuery<any>(GET_PROGRESS_RATINGS_QUERY, {
		variables: { clientId: user?.id || '', goalId: goalIdForLogDetails },
		skip: !showDetailsModal || !selectedLog?.id || !goalIdForLogDetails || !user?.id,
		fetchPolicy: 'cache-and-network',
	});

	const detailsRecapRatings = useMemo(() => {
		if (!selectedLog?.id) return [];
		const list = detailsProgressRatingsData?.getProgressRatings || [];
		return list.filter((r: any) => progressRatingIncludesSessionLog(r, selectedLog.id));
	}, [detailsProgressRatingsData, selectedLog?.id]);

	const detailsMemberCoachRating = useMemo(() => {
		const r = detailsCoachRatingData?.getCoachRatingBySessionLog;
		if (!r) return null;
		return r;
	}, [detailsCoachRatingData]);

	useEffect(() => {
		setPendingCoachRating(0);
		setPendingCoachComment('');
		setPendingCoachCommentError('');
		setRatingSubmitError('');
		setOptimisticCoachRating(null);
	}, [selectedLog?.id]);

	const [createCoachRating, { loading: creatingCoachRating }] = useMutation(
		CREATE_COACH_RATING_MUTATION,
		{
			onCompleted: async (data) => {
				const created = data?.createCoachRating;
				if (created && selectedLog?.id) {
					setOptimisticCoachRating({
						id: created.id,
						sessionLogId: created.sessionLogId || selectedLog.id,
						rating: created.rating,
						comment: created.comment,
						createdAt: created.createdAt,
						coach:
							selectedLog?.session?.coach ||
							selectedLog?.coach ||
							null,
					});
				}
				setPendingCoachRating(0);
				setPendingCoachComment('');
				setPendingCoachCommentError('');
				setRatingSubmitError('');
				await Promise.all([refetchDetailsCoachRating(), refetch()]);
			},
			onError: async (error) => {
				const msg = error.message || 'Failed to submit feedback.';
				if (msg.toLowerCase().includes('already submitted')) {
					setOptimisticCoachRating((prev: any) => {
						if (prev) return prev;
						return {
							id: `existing-${selectedLog?.id || 'rating'}`,
							sessionLogId: selectedLog?.id || '',
							rating: pendingCoachRating || 0,
							comment:
								pendingCoachComment.trim() ||
								'Rating already submitted for this session.',
							createdAt: new Date().toISOString(),
							coach: selectedLog?.session?.coach || selectedLog?.coach || null,
						};
					});
					setPendingCoachCommentError('');
					setRatingSubmitError('');
					await refetchDetailsCoachRating();
					return;
				}
				setRatingSubmitError(msg);
			},
		}
	);

	const submitCoachRatingForDetails = useCallback(() => {
		if (!selectedLog?.id) {
			setRatingSubmitError('Missing session information.');
			return;
		}

		const coachIdCandidates = [
			selectedLog.coachId,
			selectedLog.coach?.id,
			selectedLog.coach?._id,
			selectedLog.session?.coachId,
			selectedLog.session?.coach?.id,
			selectedLog.session?.coach?._id,
		]
			.map((v) => (v == null ? '' : String(v).trim()))
			.filter((v) => v.length > 0);
		const coachId = coachIdCandidates[0] || '';
		if (!coachId) {
			setRatingSubmitError('Coach not found for this session.');
			return;
		}

		if (pendingCoachRating === 0) {
			setRatingSubmitError('Please tap 1-5 stars.');
			return;
		}

		const trimmed = pendingCoachComment.trim();
		if (trimmed.length < MIN_COACH_RATING_COMMENT_LENGTH) {
			setPendingCoachCommentError(
				`Please write at least ${MIN_COACH_RATING_COMMENT_LENGTH} characters.`
			);
			setRatingSubmitError(
				`Tell us why (at least ${MIN_COACH_RATING_COMMENT_LENGTH} characters).`
			);
			return;
		}

		setRatingSubmitError('');
		createCoachRating({
			variables: {
				input: {
					coachId,
					sessionLogId: selectedLog.id,
					rating: pendingCoachRating,
					comment: trimmed,
				},
			},
		});
	}, [createCoachRating, pendingCoachComment, pendingCoachRating, selectedLog]);

	const visibleMemberCoachRating = detailsMemberCoachRating || optimisticCoachRating;

	const onRefresh = async () => {
		setRefreshing(true);
		try {
			if (user?.id) {
				await refetch();
			}
		} finally {
			setRefreshing(false);
		}
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	};

	const formatDateHeader = (dateString: string) => {
		const date = new Date(dateString);
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		if (date.toDateString() === today.toDateString()) {
			return 'Today';
		}
		if (date.toDateString() === yesterday.toDateString()) {
			return 'Yesterday';
		}
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
		});
	};

	// Group session logs by date
	const groupedLogs = useMemo(() => {
		const sessionLogs = data?.getSessionLogs || [];
		const groups: Record<string, any[]> = {};

		sessionLogs.forEach((log: any) => {
			const dateKey = log.session?.date
				? new Date(log.session.date).toDateString()
				: log.completedAt
					? new Date(log.completedAt).toDateString()
					: 'Unknown';

			if (!groups[dateKey]) {
				groups[dateKey] = [];
			}
			groups[dateKey].push(log);
		});

		const sortedDates = Object.keys(groups).sort((a, b) => {
			return new Date(b).getTime() - new Date(a).getTime();
		});

		sortedDates.forEach((date) => {
			groups[date].sort((a, b) => {
				const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
				const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
				return dateB - dateA;
			});
		});

		return { groups, sortedDates };
	}, [data?.getSessionLogs]);

	if (!hasMembership) {
		return (
			<FixedView className='flex-1 bg-bg-darker'>
				<TabHeader showCoachIcon={false} />
			</FixedView>
		);
	}

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
						Session Logs
					</Text>
					<Text className='text-text-secondary mt-1'>
						Your completed workout sessions
					</Text>
				</View>
				{loading ? (
					<PremiumLoadingContent embedded message='Please wait..' />
				) : !data?.getSessionLogs || data.getSessionLogs.length === 0 ? (
					<View
						className='bg-bg-primary rounded-xl p-6 items-center border border-[#F9C513]'
						style={{ borderWidth: 0.5 }}
					>
						<Ionicons name='document-text-outline' size={48} color='#8E8E93' />
						<Text className='text-text-secondary mt-4 text-center text-base'>
							No session logs yet
						</Text>
						<Text className='text-text-secondary mt-2 text-center text-sm'>
							Your completed sessions will appear here
						</Text>
					</View>
				) : (
					<View>
						{groupedLogs.sortedDates.map((dateKey) => (
							<View key={dateKey} className='mb-6'>
								<View className='mb-3'>
									<Text className='text-xl font-bold text-text-primary'>
										{formatDateHeader(dateKey)}
									</Text>
									<View className='h-0.5 bg-[#F9C513] mt-1' />
								</View>
								{groupedLogs.groups[dateKey].map((item: any) => (
									<TouchableOpacity
										key={item.id}
										onPress={() => {
											setSelectedLog(item);
											setShowDetailsModal(true);
										}}
										className='bg-bg-primary rounded-xl p-4 mb-3 border border-[#F9C513]'
										style={{ borderWidth: 0.5 }}
									>
										<View className='flex-row'>
											<View
												className='bg-bg-darker rounded-lg py-3 px-3 mr-3 items-center justify-center border border-[#F9C513]'
												style={{
													borderWidth: 0.5,
													alignSelf: 'stretch',
													flexShrink: 0,
													minWidth: 88,
												}}
											>
												{item.session?.startTime ? (
													<Text className='text-[#F9C513] font-bold text-lg text-center'>
														{formatTimeTo12Hour(item.session.startTime)}
													</Text>
												) : null}
											</View>
											<View className='flex-1' style={{ minWidth: 0 }}>
												<Text className='text-text-secondary text-xs font-medium mb-1'>
													{item.session?.date
														? formatDate(item.session.date)
														: 'N/A'}
												</Text>
												<Text className='text-text-primary font-semibold text-base mb-2'>
													{item.session?.name || 'Session'}
												</Text>
												<View className='flex-row items-center mb-1'>
													<Ionicons
														name='checkmark-circle'
														size={14}
														color='#4CAF50'
													/>
													<Text className='text-text-secondary text-sm ml-1'>
														Completed
													</Text>
												</View>
												{item.session?.coach && (
													<View className='flex-row items-center mb-1'>
														<Ionicons name='person' size={14} color='#8E8E93' />
														<Text className='text-text-secondary text-sm ml-1'>
															Coach: {item.session.coach.firstName}{' '}
															{item.session.coach.lastName}
														</Text>
													</View>
												)}
												{item.session?.gymArea && (
													<View className='flex-row items-center mb-1'>
														<Ionicons
															name='location'
															size={14}
															color='#8E8E93'
														/>
														<Text className='text-text-secondary text-sm ml-1'>
															{item.session.gymArea}
														</Text>
													</View>
												)}
												{item.weight && (
													<View className='flex-row items-center mt-1'>
														<Ionicons name='scale' size={14} color='#8E8E93' />
														<Text className='text-text-secondary text-sm ml-1'>
															Weight: {item.weight} kg
														</Text>
													</View>
												)}
												{(() => {
													const exercises = parseWorkoutExercises(item.session?.workoutType);
													if (exercises.length > 0) {
														return (
															<View className='flex-row items-center mt-2'>
																<Ionicons name='barbell' size={14} color='#F9C513' />
																<Text className='text-[#F9C513] text-xs ml-1'>
																	{exercises.length} Exercise{exercises.length !== 1 ? 's' : ''}
																</Text>
															</View>
														);
													}
													return null;
												})()}
												{item.progressImages && (
													<View className='flex-row items-center mt-2'>
														<Ionicons name='images' size={14} color='#F9C513' />
														<Text className='text-[#F9C513] text-xs ml-1'>
															4 Progress Photos
														</Text>
													</View>
												)}
											</View>
										</View>
									</TouchableOpacity>
								))}
							</View>
						))}
					</View>
				)}
			</ScrollView>

			{/* Session Details Modal */}
			<Modal
				visible={showDetailsModal}
				animationType='slide'
				transparent
				onRequestClose={() => {
					setShowDetailsModal(false);
					setSelectedLog(null);
				}}
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
										Session Details
									</Text>
									{selectedLog?.session && (
										<Text className='text-text-secondary text-sm mt-1'>
											{selectedLog.session.name}
										</Text>
									)}
								</View>
								<TouchableOpacity
									onPress={() => {
										setShowDetailsModal(false);
										setSelectedLog(null);
									}}
								>
									<Ionicons name='close' size={28} color='#8E8E93' />
								</TouchableOpacity>
							</View>

							{selectedLog && (
								<View>
									{/* Session Information */}
									<View className='mb-6'>
										<Text className='text-lg font-semibold text-text-primary mb-3'>
											Session Information
										</Text>
										<View
											className='bg-bg-darker rounded-xl p-4 border border-[#F9C513]'
											style={{ borderWidth: 0.5 }}
										>
											{selectedLog.session?.date && (
												<View className='mb-3'>
													<Text className='text-text-secondary text-xs mb-1'>
														Date
													</Text>
													<Text className='text-text-primary font-semibold'>
														{formatDate(selectedLog.session.date)}
													</Text>
												</View>
											)}
											{selectedLog.session?.startTime && (
												<View className='mb-3'>
													<Text className='text-text-secondary text-xs mb-1'>
														Time
													</Text>
													<Text className='text-text-primary font-semibold'>
														{formatTimeTo12Hour(selectedLog.session.startTime)}
														{selectedLog.session.endTime &&
															` - ${formatTimeTo12Hour(selectedLog.session.endTime)}`}
													</Text>
												</View>
											)}
											{selectedLog.session?.gymArea && (
												<View className='mb-3'>
													<Text className='text-text-secondary text-xs mb-1'>
														Gym Area
													</Text>
													<Text className='text-text-primary font-semibold'>
														{selectedLog.session.gymArea}
													</Text>
												</View>
											)}
											{selectedLog.session?.coach && (
												<View className='mb-3'>
													<Text className='text-text-secondary text-xs mb-1'>
														Coach
													</Text>
													<Text className='text-text-primary font-semibold'>
														{selectedLog.session.coach.firstName}{' '}
														{selectedLog.session.coach.lastName}
													</Text>
												</View>
											)}
											{selectedLog.session?.goal && (
												<View className='mb-3'>
													<Text className='text-text-secondary text-xs mb-1'>
														Goal
													</Text>
													<Text className='text-text-primary font-semibold'>
														{selectedLog.session.goal.title}
													</Text>
												</View>
											)}
											{selectedLog.session?.note && (
												<View className='mb-3'>
													<Text className='text-text-secondary text-xs mb-1'>
														Session Note
													</Text>
													<Text className='text-text-primary'>
														{selectedLog.session.note}
													</Text>
												</View>
											)}
										</View>
									</View>

									{/* Progress Data */}
									<View className='mb-6'>
										<Text className='text-lg font-semibold text-text-primary mb-3'>
											Progress Data
										</Text>
										<View
											className='bg-bg-darker rounded-xl p-4 border border-[#F9C513]'
											style={{ borderWidth: 0.5 }}
										>
											{selectedLog.weight && (
												<View className='mb-3'>
													<Text className='text-text-secondary text-xs mb-1'>
														Weight
													</Text>
													<Text className='text-text-primary font-semibold text-lg'>
														{selectedLog.weight} kg
													</Text>
												</View>
											)}
											{selectedLog.completedAt && (
												<View className='mb-3'>
													<Text className='text-text-secondary text-xs mb-1'>
														Completed At
													</Text>
													<Text className='text-text-primary font-semibold'>
														{formatDate(selectedLog.completedAt)}{' '}
														{new Date(
															selectedLog.completedAt
														).toLocaleTimeString('en-US', {
															hour: 'numeric',
															minute: '2-digit',
														})}
													</Text>
												</View>
											)}
											{selectedLog.notes && (
												<View>
													<Text className='text-text-secondary text-xs mb-1'>
														Notes
													</Text>
													<Text className='text-text-primary'>
														{selectedLog.notes}
													</Text>
												</View>
											)}
											{selectedLog.session?.goal ? (
												<View className='mt-3 pt-3 border-t border-[#F9C513]/30'>
													<Text className='text-text-secondary text-xs mb-2'>
														Goal reference
													</Text>
													{formatKgDisplay(selectedLog.session.goal.currentWeight) ? (
														<Text className='text-text-primary text-sm mb-1'>
															Starting weight (goal):{' '}
															<Text className='font-bold text-[#F9C513]'>
																{formatKgDisplay(selectedLog.session.goal.currentWeight)} kg
															</Text>
														</Text>
													) : null}
													{formatKgDisplay(selectedLog.session.goal.targetWeight) ? (
														<Text className='text-text-primary text-sm mb-1'>
															Target:{' '}
															<Text className='font-semibold'>
																{formatKgDisplay(selectedLog.session.goal.targetWeight)} kg
															</Text>
														</Text>
													) : null}
													{selectedLog.weight != null &&
													selectedLog.session.goal.currentWeight != null ? (
														<Text className='text-text-secondary text-sm mt-2'>
															vs goal start:{' '}
															{(() => {
																const delta =
																	Math.round(
																		(Number(selectedLog.weight) -
																			Number(selectedLog.session.goal.currentWeight)) *
																			10
																	) / 10;
																const sign = delta > 0 ? '+' : '';
																return (
																	<Text className='text-[#F9C513] font-semibold'>
																		{sign}
																		{delta} kg
																	</Text>
																);
															})()}
														</Text>
													) : null}
												</View>
											) : null}
										</View>
									</View>

									<View className='mb-6'>
										<Text className='text-lg font-semibold text-text-primary mb-3'>
											Your feedback to coach
										</Text>
										<Text className='text-text-secondary text-sm mb-3 -mt-1'>
											One rating per session. Submitted ratings are view-only.
										</Text>
										<View
											className='bg-bg-darker rounded-xl p-4 border border-[#F9C513]'
											style={{ borderWidth: 0.5 }}
										>
											{visibleMemberCoachRating ? (
												<View>
													{visibleMemberCoachRating.coach ? (
														<Text className='text-text-secondary text-sm mb-2'>
															{visibleMemberCoachRating.coach.firstName}{' '}
															{visibleMemberCoachRating.coach.lastName}
														</Text>
													) : null}
													<View className='flex-row items-center mb-2'>
														{Array.from({ length: 5 }).map((_, index) => (
															<Ionicons
																key={index}
																name={
																	index < (visibleMemberCoachRating.rating || 0)
																		? 'star'
																		: 'star-outline'
																}
																size={18}
																color='#F9C513'
															/>
														))}
														<Text className='text-text-primary font-semibold ml-2'>
															{visibleMemberCoachRating.rating}/5
														</Text>
													</View>
													{visibleMemberCoachRating.comment ? (
														<View className='mt-2'>
															<Text className='text-text-secondary text-xs mb-1'>
																Why you rated this way
															</Text>
															<Text className='text-text-primary text-sm'>
																{visibleMemberCoachRating.comment}
															</Text>
														</View>
													) : null}
												</View>
											) : (
												<View>
													<Text className='text-text-secondary text-sm mb-3'>
														No coach rating yet. Add your feedback below.
													</Text>
													<Text className='text-text-primary font-semibold mb-2'>
														Stars <Text className='text-red-500'>*</Text>
													</Text>
													<View className='flex-row justify-center gap-2 mb-2'>
														{[1, 2, 3, 4, 5].map((star) => (
															<TouchableOpacity
																key={star}
																onPress={() => {
																	setPendingCoachRating(star);
																	setRatingSubmitError('');
																}}
																className='p-1'
																accessibilityLabel={`${star} star${star > 1 ? 's' : ''}`}
															>
																<Ionicons
																	name={star <= pendingCoachRating ? 'star' : 'star-outline'}
																	size={28}
																	color='#F9C513'
																/>
															</TouchableOpacity>
														))}
													</View>
													<Text className='text-text-secondary text-center text-xs mb-3'>
														1 = Lowest, 5 = Highest satisfaction
													</Text>
													<Text className='text-text-primary font-semibold mb-2'>
														Why this rating? <Text className='text-red-500'>*</Text>
													</Text>
													<TextInput
														className={`bg-bg-primary rounded-lg p-3 text-text-primary text-sm border ${
															pendingCoachCommentError
																? 'border-red-500'
																: 'border-[#F9C513]/50'
														}`}
														style={{ borderWidth: 0.5, minHeight: 90, textAlignVertical: 'top' }}
														placeholder='Tell us why'
														placeholderTextColor='#8E8E93'
														value={pendingCoachComment}
														onChangeText={(t) => {
															setPendingCoachComment(t);
															setPendingCoachCommentError('');
															setRatingSubmitError('');
														}}
														multiline
														numberOfLines={4}
													/>
													<View className='flex-row justify-between items-start mt-1 mb-3'>
														{pendingCoachCommentError ? (
															<Text className='text-red-500 text-xs flex-1 mr-2'>
																{pendingCoachCommentError}
															</Text>
														) : (
															<View className='flex-1 mr-2' />
														)}
														<Text
															className={`text-xs ${
																pendingCoachComment.trim().length >=
																MIN_COACH_RATING_COMMENT_LENGTH
																	? 'text-[#34C759]'
																	: 'text-text-secondary'
															}`}
														>
															{pendingCoachComment.trim().length}/
															{MIN_COACH_RATING_COMMENT_LENGTH}
														</Text>
													</View>
													{ratingSubmitError ? (
														<Text className='text-red-500 text-xs mb-3'>
															{ratingSubmitError}
														</Text>
													) : null}
													<TouchableOpacity
														className='bg-[#F9C513] rounded-lg p-3 items-center'
														onPress={submitCoachRatingForDetails}
														disabled={
															creatingCoachRating ||
															pendingCoachRating === 0 ||
															pendingCoachComment.trim().length <
																MIN_COACH_RATING_COMMENT_LENGTH
														}
														style={{
															opacity:
																creatingCoachRating ||
																pendingCoachRating === 0 ||
																pendingCoachComment.trim().length <
																	MIN_COACH_RATING_COMMENT_LENGTH
																	? 0.5
																	: 1,
														}}
													>
														<Text className='text-black font-semibold'>
															{creatingCoachRating ? 'Submitting...' : 'Submit feedback'}
														</Text>
													</TouchableOpacity>
												</View>
											)}
										</View>
									</View>

									<View className='mb-6'>
										<Text className='text-lg font-semibold text-text-primary mb-3'>
											Coach rate progress (this session)
										</Text>
										{detailsRecapRatings.length > 0 ? (
											detailsRecapRatings.map((rating: any) => {
												const startDate = new Date(rating.startDate);
												const endDate = new Date(rating.endDate);
												const vLabels: Record<string, string> = {
													PROGRESSIVE: 'Progressive',
													CLOSE_TO_ACHIEVEMENT: 'Close to Achievement',
													ACHIEVED: 'Achieved',
													REGRESSING: 'Regressing',
												};
												const vColors: Record<string, string> = {
													PROGRESSIVE: '#10B981',
													CLOSE_TO_ACHIEVEMENT: '#F59E0B',
													ACHIEVED: '#3B82F6',
													REGRESSING: '#EF4444',
												};
												const vk = progressVerdictKey(rating.verdict);
												return (
													<View
														key={rating.id}
														className='bg-bg-darker rounded-xl p-4 mb-3 border border-[#F9C513]'
														style={{ borderWidth: 0.5 }}
													>
														<View className='flex-row justify-between items-start mb-2'>
															<View className='flex-1 pr-2'>
																<Text className='text-text-primary font-semibold text-base mb-1'>
																	{startDate.toLocaleDateString()} —{' '}
																	{endDate.toLocaleDateString()}
																</Text>
																{rating.coach ? (
																	<Text className='text-text-secondary text-sm'>
																		Coach {rating.coach.firstName}{' '}
																		{rating.coach.lastName}
																	</Text>
																) : null}
															</View>
															<View className='items-end'>
																<Text className='text-text-secondary text-xs mb-1'>
																	Final verdict
																</Text>
																<View
																	className='px-3 py-1 rounded-full'
																	style={{ backgroundColor: vColors[vk] || '#8E8E93' }}
																>
																	<Text className='text-white text-xs font-semibold'>
																		{vLabels[vk] || rating.verdict}
																	</Text>
																</View>
															</View>
														</View>
														<View className='flex-row items-center mb-2'>
															<Text className='text-text-secondary text-sm mr-2'>
																Coach rating:
															</Text>
															<View className='flex-row items-center'>
																{Array.from({ length: 5 }).map((_, index) => (
																	<Ionicons
																		key={index}
																		name={
																			index < rating.rating ? 'star' : 'star-outline'
																		}
																		size={16}
																		color='#F9C513'
																	/>
																))}
																<Text className='text-text-primary font-semibold ml-2'>
																	{rating.rating}/5
																</Text>
															</View>
														</View>
														{rating.comment ? (
															<View className='mt-2'>
																<Text className='text-text-secondary text-xs mb-1'>
																	Coach feedback
																</Text>
																<Text className='text-text-primary text-sm'>
																	{rating.comment}
																</Text>
															</View>
														) : null}
													</View>
												);
											})
										) : (
											<View
												className='bg-bg-darker rounded-xl p-4 border border-[#F9C513]'
												style={{ borderWidth: 0.5 }}
											>
												<Text className='text-text-secondary text-sm'>
													No coach progress rating yet that includes this session.
												</Text>
											</View>
										)}
									</View>

									{/* Workout Exercises */}
									{(() => {
										const exercises = parseWorkoutExercises(selectedLog.session?.workoutType);
										if (exercises.length === 0) return null;
										
										return (
											<View className='mb-6'>
												<Text className='text-lg font-semibold text-text-primary mb-3'>
													Workout Exercises
												</Text>
												<View className='space-y-3'>
													{exercises.map((exercise, index) => {
														const imageUrl = buildExerciseImageUrl(exercise.id);
														return (
															<View
																key={`${exercise.id}-${index}`}
																className='bg-bg-darker rounded-xl p-4 border border-[#F9C513]'
																style={{ borderWidth: 0.5 }}
															>
																<View className='flex-row'>
																	{imageUrl && (
																		<View className='mr-3'>
																			<ExpoImage
																				source={{ uri: imageUrl }}
																				style={{
																					width: 80,
																					height: 80,
																					borderRadius: 8,
																					borderWidth: 0.5,
																					borderColor: '#F9C513',
																				}}
																				contentFit='cover'
																			/>
																		</View>
																	)}
																	<View className='flex-1'>
																		<Text className='text-text-primary font-semibold text-base mb-1'>
																			{exercise.name}
																		</Text>
																		<View className='flex-row items-center mb-1'>
																			<Ionicons
																				name='body'
																				size={14}
																				color='#8E8E93'
																			/>
																			<Text className='text-text-secondary text-xs ml-1'>
																				{exercise.bodyPart}
																			</Text>
																		</View>
																		{exercise.target && (
																			<View className='flex-row items-center mb-1'>
																				<Ionicons
																					name='locate-outline'
																					size={14}
																					color='#8E8E93'
																				/>
																				<Text className='text-text-secondary text-xs ml-1'>
																					{exercise.target}
																				</Text>
																			</View>
																		)}
																		{exercise.equipment && (
																			<View className='flex-row items-center mb-2'>
																				<Ionicons
																					name='construct'
																					size={14}
																					color='#8E8E93'
																				/>
																				<Text className='text-text-secondary text-xs ml-1'>
																					{exercise.equipment}
																				</Text>
																			</View>
																		)}
																		<View className='flex-row items-center'>
																			<View className='bg-[#F9C513] px-2 py-1 rounded mr-2'>
																				<Text className='text-bg-darker font-semibold text-xs'>
																					{exercise.sets} Sets
																				</Text>
																			</View>
																			<View className='bg-[#F9C513] px-2 py-1 rounded'>
																				<Text className='text-bg-darker font-semibold text-xs'>
																					{exercise.reps} Reps
																				</Text>
																			</View>
																		</View>
																	</View>
																</View>
															</View>
														);
													})}
												</View>
											</View>
										);
									})()}

									{/* Progress Images */}
									{selectedLog.progressImages && (
										<View className='mb-6'>
											<Text className='text-lg font-semibold text-text-primary mb-3'>
												Progress Photos
											</Text>
											<TouchableOpacity
												onPress={() => {
													setShowDetailsModal(false);
													setShowImagesModal(true);
												}}
												className='p-4 bg-bg-darker rounded-xl border border-[#F9C513]'
												style={{ borderWidth: 0.5 }}
											>
												<View className='flex-row items-center justify-between'>
													<View className='flex-row items-center'>
														<Ionicons name='images' size={24} color='#F9C513' />
														<Text className='text-text-primary font-semibold ml-3'>
															View All Progress Photos
														</Text>
													</View>
													<Ionicons
														name='chevron-forward'
														size={20}
														color='#8E8E93'
													/>
												</View>
											</TouchableOpacity>
										</View>
									)}
								</View>
							)}
						</ScrollView>
					</View>
				</View>
			</Modal>

			{/* Progress Images Modal */}
			<Modal
				visible={showImagesModal}
				animationType='slide'
				transparent
				onRequestClose={() => {
					setShowImagesModal(false);
					setSelectedLog(null);
				}}
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
										Progress Photos
									</Text>
									{selectedLog?.session && (
										<Text className='text-text-secondary text-sm mt-1'>
											{selectedLog.session.name} -{' '}
											{formatDate(selectedLog.session.date)}
										</Text>
									)}
								</View>
								<TouchableOpacity
									onPress={() => {
										setShowImagesModal(false);
										setSelectedLog(null);
									}}
								>
									<Ionicons name='close' size={28} color='#8E8E93' />
								</TouchableOpacity>
							</View>

							{selectedLog?.progressImages && (
								<View>
									{selectedLog.progressImages.front && (
										<View className='mb-4'>
											<Text className='text-text-primary font-semibold mb-2'>
												Front
											</Text>
											<Image
												source={{ uri: selectedLog.progressImages.front }}
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
									{selectedLog.progressImages.rightSide && (
										<View className='mb-4'>
											<Text className='text-text-primary font-semibold mb-2'>
												Right Side
											</Text>
											<Image
												source={{ uri: selectedLog.progressImages.rightSide }}
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
									{selectedLog.progressImages.leftSide && (
										<View className='mb-4'>
											<Text className='text-text-primary font-semibold mb-2'>
												Left Side
											</Text>
											<Image
												source={{ uri: selectedLog.progressImages.leftSide }}
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
									{selectedLog.progressImages.back && (
										<View className='mb-4'>
											<Text className='text-text-primary font-semibold mb-2'>
												Back
											</Text>
											<Image
												source={{ uri: selectedLog.progressImages.back }}
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
		</FixedView>
	);
};

export default MemberSessionLogs;
