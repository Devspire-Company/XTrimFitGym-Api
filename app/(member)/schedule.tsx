import { PremiumLoadingContent } from '@/components/AuthProcessingScreen';
import { CoachScheduleCalendar } from '@/components/CoachScheduleCalendar';
import { ScheduleDayAttendancePanel } from '@/components/ScheduleDayAttendancePanel';
import CameraCapture from '@/components/CameraCapture';
import ConfirmModal from '@/components/ConfirmModal';
import FixedView from '@/components/FixedView';
import GradientButton from '@/components/GradientButton';
import TabHeader from '@/components/TabHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useMemberMembershipModal } from '@/contexts/MemberMembershipModalContext';
import { memberHasActiveGymMembership } from '@/utils/memberMembership';
import { GetClientSessionsQuery } from '@/graphql/generated/types';
import {
	COMPLETE_SESSION_MUTATION,
	CREATE_COACH_RATING_MUTATION,
	LEAVE_CLASS_SESSION_MUTATION,
	REQUEST_JOIN_CLASS_MUTATION,
	RESPOND_CLASS_INVITE_MUTATION,
} from '@/graphql/mutations';
import {
	GET_ATTENDANCE_RECORDS_QUERY,
	GET_CLIENT_SESSIONS_QUERY,
	GET_COACH_RATING_BY_SESSION_LOG_QUERY,
	GET_JOINABLE_GROUP_CLASSES_QUERY,
} from '@/graphql/queries';
import { uploadImageToCloudinary } from '@/utils/cloudinary-upload';
import {
	attendanceQueryDateRange,
	buildAttendanceDaySet,
} from '@/utils/attendanceCalendar';
import { formatTimeTo12Hour } from '@/utils/time-utils';
import { useMutation, useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Image as ExpoImage } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
	Image,
	Modal,
	Platform,
	RefreshControl,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';

const MIN_COACH_RATING_COMMENT_LENGTH = 25;

type ImageAngle = 'front' | 'rightSide' | 'leftSide' | 'back';

const angleLabels: Record<ImageAngle, string> = {
	front: 'Front',
	rightSide: 'Right Side',
	leftSide: 'Left Side',
	back: 'Back',
};

function localDateKeyFromDate(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

function localDateKeyFromIso(iso: string): string {
	return localDateKeyFromDate(new Date(iso));
}

function formatCalendarDayLabel(key: string): string {
	const parts = key.split('-').map((n) => parseInt(n, 10));
	if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return key;
	const dt = new Date(parts[0], parts[1] - 1, parts[2]);
	return dt.toLocaleDateString('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
}

function formatKgDisplay(value: number | null | undefined): string | null {
	if (value == null || Number.isNaN(Number(value))) return null;
	const n = Number(value);
	const rounded = Math.round(n * 10) / 10;
	return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

const MemberSchedule = () => {
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
	const [selectedSession, setSelectedSession] = useState<any>(null);
	const [showCompletionModal, setShowCompletionModal] = useState(false);
	const [showCamera, setShowCamera] = useState(false);
	const [currentAngle, setCurrentAngle] = useState<ImageAngle>('front');
	const [weight, setWeight] = useState('');
	const [weightError, setWeightError] = useState('');
	const [uploading, setUploading] = useState(false);
	const [progressImages, setProgressImages] = useState<
		Record<ImageAngle, string | null>
	>({
		front: null,
		rightSide: null,
		leftSide: null,
		back: null,
	});
	const [showRatingModal, setShowRatingModal] = useState(false);
	const [completedSessionLogId, setCompletedSessionLogId] = useState<string | null>(null);
	const [completedCoachId, setCompletedCoachId] = useState<string | null>(null);
	const [coachRating, setCoachRating] = useState<number>(0);
	const [coachComment, setCoachComment] = useState<string>('');
	const [coachCommentError, setCoachCommentError] = useState('');
	const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
	const [selectedScheduleDay, setSelectedScheduleDay] = useState(() =>
		localDateKeyFromDate(new Date())
	);
	const [scheduleShowAll, setScheduleShowAll] = useState(false);
	const [alertModal, setAlertModal] = useState<{
		visible: boolean;
		title: string;
		message: string;
		variant: 'danger' | 'neutral' | 'success' | 'warning';
	}>({ visible: false, title: '', message: '', variant: 'neutral' });
	const [leaveClassTarget, setLeaveClassTarget] = useState<{
		id: string;
		className: string;
		isPendingOnly: boolean;
	} | null>(null);
	const [leavingSessionId, setLeavingSessionId] = useState<string | null>(null);
	const [classInviteActionKey, setClassInviteActionKey] = useState<string | null>(null);

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

	const parseWorkoutData = useCallback((workoutType: string | null | undefined) => {
		if (!workoutType) return [];
		try {
			const parsed = JSON.parse(workoutType);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}, []);

	const { data, refetch, loading } = useQuery<GetClientSessionsQuery>(
		GET_CLIENT_SESSIONS_QUERY,
		{
			variables: { clientId: user?.id || '', status: 'scheduled' },
			fetchPolicy: 'cache-and-network',
			skip: !user?.id,
		}
	);

	const attendanceId = user?.attendanceId?.toString();
	const attendanceRange = useMemo(() => attendanceQueryDateRange(), []);

	const { data: scheduleAttendanceData, refetch: refetchScheduleAttendance } = useQuery(
		GET_ATTENDANCE_RECORDS_QUERY,
		{
			variables: {
				filter: attendanceId
					? {
							cardNo: attendanceId,
							startDate: attendanceRange.startDate,
							endDate: attendanceRange.endDate,
						}
					: undefined,
				pagination: { limit: 2500, offset: 0 },
			},
			skip: !user?.id || !attendanceId,
			fetchPolicy: 'cache-and-network',
		}
	);

	const { data: joinableData, refetch: refetchJoinable } = useQuery(
		GET_JOINABLE_GROUP_CLASSES_QUERY,
		{
			fetchPolicy: 'cache-and-network',
			skip: !user?.id || user?.role !== 'member',
		}
	);

	const { data: coachRatingForCompletedLogData, loading: coachRatingForCompletedLogLoading } =
		useQuery(GET_COACH_RATING_BY_SESSION_LOG_QUERY, {
			variables: { sessionLogId: completedSessionLogId ?? '' },
			skip: !showRatingModal || !completedSessionLogId,
			fetchPolicy: 'network-only',
		});

	const existingCoachRatingForModal =
		coachRatingForCompletedLogData?.getCoachRatingBySessionLog ?? null;

	const closeRatingModal = useCallback(() => {
		setShowRatingModal(false);
		setCompletedSessionLogId(null);
		setCompletedCoachId(null);
		setCoachRating(0);
		setCoachComment('');
		setCoachCommentError('');
	}, []);

	useEffect(() => {
		if (user?.id) {
			refetch();
		}
	}, [user?.id, refetch]);

	const onRefresh = async () => {
		setRefreshing(true);
		try {
			if (user?.id) {
				const pulls = [refetch(), refetchJoinable()];
				if (attendanceId) pulls.push(refetchScheduleAttendance());
				await Promise.all(pulls);
			}
		} finally {
			setRefreshing(false);
		}
	};

	const [requestJoinClass, { loading: requestingJoin }] = useMutation(
		REQUEST_JOIN_CLASS_MUTATION,
		{
			onCompleted: async () => {
				await Promise.all([refetch(), refetchJoinable()]);
				setAlertModal({
					visible: true,
					title: 'Request sent',
					message: 'Your coach will review your join request.',
					variant: 'success',
				});
			},
			onError: (error) => {
				setAlertModal({ visible: true, title: 'Error', message: error.message, variant: 'danger' });
			},
		}
	);

	const [respondClassInvite] = useMutation(RESPOND_CLASS_INVITE_MUTATION, {
		onCompleted: async () => {
			await Promise.all([refetch(), refetchJoinable()]);
		},
		onError: (error) => {
			setAlertModal({ visible: true, title: 'Error', message: error.message, variant: 'danger' });
		},
	});

	const [leaveClassSessionMut] = useMutation(LEAVE_CLASS_SESSION_MUTATION, {
		onCompleted: async () => {
			await Promise.all([refetch(), refetchJoinable()]);
			setLeaveClassTarget(null);
			setAlertModal({
				visible: true,
				title: 'Updated',
				message: 'Your class enrollment was updated.',
				variant: 'success',
			});
		},
		onError: (error) => {
			setAlertModal({ visible: true, title: 'Error', message: error.message, variant: 'danger' });
		},
	});

	const [completeSession, { loading: completing }] = useMutation(
		COMPLETE_SESSION_MUTATION,
		{
			onCompleted: async (data) => {
				setShowCompletionModal(false);
				setWeight('');
				setWeightError('');
				setProgressImages({
					front: null,
					rightSide: null,
					leftSide: null,
					back: null,
				});
				await refetch();

				if (data?.completeSession) {
					setCompletedSessionLogId(data.completeSession.id);
					setCompletedCoachId(data.completeSession.coachId);
					setCoachRating(0);
					setCoachComment('');
					setCoachCommentError('');
					setShowRatingModal(true);
				} else {
					setAlertModal({
						visible: true,
						title: 'Success',
						message: 'Session completed successfully!',
						variant: 'success',
					});
				}
			},
			onError: (error) => {
				setAlertModal({ visible: true, title: 'Error', message: error.message, variant: 'danger' });
			},
		}
	);

	const [createCoachRating, { loading: ratingLoading }] = useMutation(
		CREATE_COACH_RATING_MUTATION,
		{
			onCompleted: () => {
				closeRatingModal();
				setAlertModal({
					visible: true,
					title: 'Success',
					message: 'Thank you for your feedback. You can view this rating anytime in Progress or Session logs.',
					variant: 'success',
				});
			},
			onError: (error) => {
				const msg = error.message || '';
				if (msg.toLowerCase().includes('already submitted')) {
					setAlertModal({
						visible: true,
						title: 'Already rated',
						message: msg,
						variant: 'warning',
					});
					return;
				}
				setAlertModal({ visible: true, title: 'Error', message: msg, variant: 'danger' });
			},
		}
	);

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);
		if (date.toDateString() === today.toDateString()) return 'Today';
		if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	};

	const isWeightRelatedGoal = (goal: any) => {
		if (!goal || !goal.goalType) return false;

		const goalType = String(goal.goalType).trim();
		const goalTypeLower = goalType.toLowerCase();

		return (
			goalType === 'Weight loss' || 
			goalType === 'Muscle building' ||
			goalTypeLower === 'weight loss' ||
			goalTypeLower === 'muscle building' ||
			goalType === 'WEIGHT_LOSS' ||
			goalType === 'MUSCLE_BUILDING' ||
			goalTypeLower === 'weight_loss' ||
			goalTypeLower === 'muscle_building'
		);
	};

	const isSessionCurrentlyActive = (session: any) => {
		if (!session || !session.date || !session.startTime) return false;
		
		const now = new Date();
		const sessionDate = new Date(session.date);
		const sessionDateTime = new Date(sessionDate);

		const [hours, minutes] = session.startTime.split(':').map(Number);
		sessionDateTime.setHours(hours, minutes || 0, 0, 0);

		return sessionDateTime <= now;
	};

	const handleCompleteSession = (session: any) => {
		setSelectedSession(session);
		setProgressImages({
			front: null,
			rightSide: null,
			leftSide: null,
			back: null,
		});
		setWeight('');
		setWeightError('');
		setShowCompletionModal(true);
	};

	const handleImageCapture = async (uri: string) => {
		setShowCamera(false);
		setUploading(true);

		try {
			const manipulated = await ImageManipulator.manipulateAsync(
				uri,
				[{ resize: { width: 600 } }],
				{ compress: 0.4, format: ImageManipulator.SaveFormat.JPEG }
			);
			const imageUrl = await uploadImageToCloudinary(manipulated.uri, {
				folder: 'XTrimFitGym/progress-images',
				fileName: 'progress.jpg',
			});
			setProgressImages((prev) => ({
				...prev,
				[currentAngle]: imageUrl,
			}));
		} catch (error: any) {
			setAlertModal({
				visible: true,
				title: 'Upload Error',
				message: error?.message || 'Failed to upload image',
				variant: 'danger',
			});
		} finally {
			setUploading(false);
		}
	};

	const startCameraCapture = (angle: ImageAngle) => {
		setCurrentAngle(angle);
		setShowCamera(true);
	};

	const handleSubmitCompletion = async () => {
		const isWeightRequired = selectedSession?.goal && isWeightRelatedGoal(selectedSession.goal);
		
		if (isWeightRequired) {
			if (!weight || !weight.trim()) {
				setWeightError('Weight is required for weight-related goals');
				setAlertModal({
					visible: true,
					title: 'Weight Required',
					message: `Please enter your current weight to complete this session.\n\nGoal Type: ${selectedSession.goal.goalType}`,
					variant: 'warning',
				});
				return;
			}
			const weightNum = parseFloat(weight.trim());
			if (isNaN(weightNum) || weightNum <= 0) {
				setWeightError('Please enter a valid weight (must be greater than 0)');
				setAlertModal({
					visible: true,
					title: 'Invalid Weight',
					message: 'Please enter a valid weight greater than 0.',
					variant: 'warning',
				});
				return;
			}
		}

		// Validate all images are captured
		if (
			!progressImages.front ||
			!progressImages.rightSide ||
			!progressImages.leftSide ||
			!progressImages.back
		) {
			setAlertModal({
				visible: true,
				title: 'Missing Images',
				message: 'Please capture all four progress images: Front, Right Side, Left Side, and Back',
				variant: 'warning',
			});
			return;
		}

		setWeightError('');

		const input: any = {
			sessionId: selectedSession.id,
			progressImages: {
				front: progressImages.front,
				rightSide: progressImages.rightSide,
				leftSide: progressImages.leftSide,
				back: progressImages.back,
			},
		};

		if (isWeightRequired) {
			input.weight = parseFloat(weight.trim());
		}

		completeSession({
			variables: {
				input,
			},
		});
	};

	const sessions = (data?.getClientSessions || []) as any[];
	const joinableClasses = (joinableData as any)?.getJoinableGroupClasses || [];

	const sessionMarkDays = useMemo(() => {
		const set = new Set<string>();
		for (const s of sessions) {
			set.add(localDateKeyFromIso(s.date));
		}
		return set;
	}, [sessions]);

	const attendanceRecords =
		(scheduleAttendanceData as { getAttendanceRecords?: { records?: unknown[] } } | undefined)
			?.getAttendanceRecords?.records || [];

	const attendanceMarkDays = useMemo(
		() => buildAttendanceDaySet(attendanceRecords as any[]),
		[attendanceRecords]
	);

	const hasSessionsOnSelectedDay = useMemo(() => {
		return sessions.some((s) => localDateKeyFromIso(s.date) === selectedScheduleDay);
	}, [sessions, selectedScheduleDay]);

	const displayedMemberSessions = useMemo(() => {
		if (scheduleShowAll) return sessions;
		return sessions.filter(
			(s) => localDateKeyFromIso(s.date) === selectedScheduleDay
		);
	}, [sessions, selectedScheduleDay, scheduleShowAll]);

	const myEnrollment = (session: any) =>
		(session?.enrollments || []).find((e: any) => e.clientId === user?.id);

	const canCompleteSession = (item: any) => {
		if (item.sessionKind === 'group_class') {
			return (item.clientsIds || []).includes(user?.id);
		}
		return true;
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
						Scheduled Sessions
					</Text>
					<Text className='text-text-secondary mt-1'>
						Your workouts and group classes
					</Text>
				</View>

				{joinableClasses.length > 0 && (
					<View className='mb-6'>
						<Text className='text-lg font-semibold text-text-primary mb-3'>
							Join a class
						</Text>
						{joinableClasses.map((jc: any) => (
							<View
								key={jc.id}
								className='bg-bg-primary rounded-xl p-4 mb-3 border border-[#F9C513]'
								style={{ borderWidth: 0.5 }}
							>
								<Text className='text-text-primary font-semibold text-base'>{jc.name}</Text>
								<Text className='text-text-secondary text-sm mt-1'>
									{jc.coach?.firstName} {jc.coach?.lastName} · {formatDate(jc.date)}{' '}
									{formatTimeTo12Hour(jc.startTime)}
								</Text>
								<Text className='text-text-secondary text-xs mt-1'>{jc.gymArea}</Text>
								<GradientButton
									onPress={() => requestJoinClass({ variables: { sessionId: jc.id } })}
									loading={requestingJoin}
									className='mt-3'
								>
									Request to join
								</GradientButton>
							</View>
						))}
					</View>
				)}

				{loading ? (
					<PremiumLoadingContent embedded message='Please wait..' />
				) : (
					<>
						<View className='mb-4'>
							<Text className='text-xl font-semibold text-text-primary mb-3'>
								Calendar
							</Text>
							<View
								className='mb-3 flex-row rounded-2xl border border-[#F9C513]/25 bg-bg-darker p-1'
								style={{ borderWidth: 1 }}
							>
								<TouchableOpacity
									onPress={() => setScheduleShowAll(false)}
									activeOpacity={0.85}
									className={`flex-1 items-center justify-center rounded-xl py-2.5 ${
										!scheduleShowAll ? 'bg-[#F9C513]' : ''
									}`}
								>
									<Text
										className={`text-sm font-bold ${
											!scheduleShowAll ? 'text-[#111827]' : 'text-text-secondary'
										}`}
									>
										By day
									</Text>
								</TouchableOpacity>
								<TouchableOpacity
									onPress={() => setScheduleShowAll(true)}
									activeOpacity={0.85}
									className={`flex-1 items-center justify-center rounded-xl py-2.5 ${
										scheduleShowAll ? 'bg-[#F9C513]' : ''
									}`}
								>
									<Text
										className={`text-sm font-bold ${
											scheduleShowAll ? 'text-[#111827]' : 'text-text-secondary'
										}`}
									>
										All sessions
									</Text>
								</TouchableOpacity>
							</View>
							<View
								className='mb-2 overflow-hidden rounded-2xl border border-[#F9C513]/35 bg-bg-primary'
								style={{ borderWidth: 1 }}
							>
								<CoachScheduleCalendar
									selectedDay={selectedScheduleDay}
									sessionDays={sessionMarkDays}
									attendanceDays={attendanceMarkDays}
									highlightSelected={!scheduleShowAll}
									onDayPress={(key) => {
										setScheduleShowAll(false);
										setSelectedScheduleDay(key);
									}}
								/>
							</View>
						</View>

						<View className='mb-3'>
							<Text className='text-[10px] font-bold uppercase tracking-wider text-text-secondary'>
								{scheduleShowAll ? 'List view' : 'Selected day'}
							</Text>
							<Text className='text-xl font-bold text-text-primary'>
								{scheduleShowAll
									? 'All scheduled sessions'
									: formatCalendarDayLabel(selectedScheduleDay)}
							</Text>
						</View>

						{!scheduleShowAll ? (
							<ScheduleDayAttendancePanel
								dayKey={selectedScheduleDay}
								dayLabel={formatCalendarDayLabel(selectedScheduleDay)}
								allRecords={attendanceRecords as any[]}
								hasSessionsOnDay={hasSessionsOnSelectedDay}
							/>
						) : null}

						{displayedMemberSessions.length === 0 ? (
							sessions.length === 0 && joinableClasses.length === 0 ? (
								<View
									className='items-center rounded-2xl border border-[#F9C513]/30 bg-bg-primary px-6 py-10'
									style={{ borderWidth: 1 }}
								>
									<View className='mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-bg-darker'>
										<Ionicons name='calendar-outline' size={36} color='#9CA3AF' />
									</View>
									<Text className='text-center text-lg font-semibold text-text-primary'>
										No scheduled sessions
									</Text>
									<Text className='mt-2 max-w-xs text-center text-sm leading-5 text-text-secondary'>
										Your coach will schedule sessions or post classes you can join.
									</Text>
								</View>
							) : (
								<View
									className='items-center rounded-2xl border border-[#F9C513]/30 bg-bg-primary px-6 py-10'
									style={{ borderWidth: 1 }}
								>
									<View className='mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-bg-darker'>
										<Ionicons name='calendar-outline' size={36} color='#9CA3AF' />
									</View>
									<Text className='text-center text-lg font-semibold text-text-primary'>
										{scheduleShowAll
											? 'No scheduled sessions yet'
											: 'No sessions on this date'}
									</Text>
									{!scheduleShowAll && sessions.length > 0 ? (
										<Text className='mt-2 max-w-xs text-center text-sm leading-5 text-text-secondary'>
											Try another day or switch to &quot;All sessions&quot;.
										</Text>
									) : null}
								</View>
							)
						) : (
					<FlatList
						data={displayedMemberSessions}
						keyExtractor={(item) => item.id}
						scrollEnabled={false}
						removeClippedSubviews={false}
						renderItem={({ item }) => {
							const en = myEnrollment(item);
							return (
							<View
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
										<Text className='text-[#F9C513] font-bold text-lg text-center'>
											{formatTimeTo12Hour(item.startTime)}
										</Text>
									</View>
									<View className='flex-1' style={{ minWidth: 0 }}>
										<Text className='text-text-secondary text-xs font-medium mb-1'>
											{formatDate(item.date)}
										</Text>
										<View className='flex-row items-center gap-2 flex-wrap mb-1'>
											<Text className='text-text-primary font-semibold text-base'>
												{item.name}
											</Text>
											{item.sessionKind === 'group_class' && (
												<View className='bg-[#F9C513]/20 px-2 py-0.5 rounded-md'>
													<Text className='text-[#F9C513] text-xs font-semibold'>Class</Text>
												</View>
											)}
										</View>
										{en?.status === 'invited' && (
											<Text className='text-[#F9C513] text-sm mb-2'>
												{"You're invited — accept to join the roster"}
											</Text>
										)}
										{en?.status === 'pending' && (
											<Text className='text-text-secondary text-sm mb-2'>
												Join request pending coach approval
											</Text>
										)}
										<View className='flex-row items-center mb-1'>
											<Ionicons name='location' size={14} color='#8E8E93' />
											<Text className='text-text-secondary text-sm ml-1'>
												{item.gymArea}
											</Text>
										</View>
										<View className='flex-row items-center mb-1'>
											<Ionicons name='person' size={14} color='#8E8E93' />
											<Text className='text-text-secondary text-sm ml-1'>
												With Coach {item.coach?.firstName || ''}{' '}
												{item.coach?.lastName || ''}
											</Text>
										</View>
										{item.goal && (
											<View className='flex-row items-center mt-1'>
												<Ionicons name='flag' size={14} color='#F9C513' />
												<Text className='text-[#F9C513] text-sm ml-1 font-semibold'>
													Goal: {item.goal.title}
												</Text>
											</View>
										)}
									</View>
								</View>

								{/* Workout Exercises */}
								{item.workoutType && (() => {
									const workouts = parseWorkoutData(item.workoutType);
									if (workouts.length === 0) return null;
									
									const isExpanded = expandedSessionId === item.id;
									
									return (
										<View className='mt-3'>
											<TouchableOpacity
												onPress={() => setExpandedSessionId(isExpanded ? null : item.id)}
												className='flex-row items-center justify-between p-3 bg-bg-darker rounded-lg border border-[#F9C513]'
												style={{ borderWidth: 0.5 }}
											>
												<View className='flex-row items-center'>
													<Ionicons name='barbell' size={20} color='#F9C513' />
													<Text className='text-text-primary font-semibold ml-2'>
														Workout Exercises ({workouts.length})
													</Text>
												</View>
												<Ionicons
													name={isExpanded ? 'chevron-up' : 'chevron-down'}
													size={20}
													color='#8E8E93'
												/>
											</TouchableOpacity>

											{isExpanded && (
												<View className='mt-2'>
													{workouts.map((workout: any, index: number) => {
														const gifUrl = workout.gifUrl || buildExerciseImageUrl(workout.id || '');
														return (
															<View
																key={index}
																className='bg-bg-darker rounded-lg p-3 mb-2 border border-[#F9C513]'
																style={{ borderWidth: 0.5 }}
															>
																<View className='flex-row items-start'>
																	{gifUrl && (
																		<ExpoImage
																			source={{ uri: gifUrl }}
																			style={{
																				width: 80,
																				height: 80,
																				borderRadius: 8,
																				marginRight: 12,
																			}}
																			contentFit='cover'
																		/>
																	)}
																	<View className='flex-1'>
																		<Text className='text-text-primary font-semibold text-base mb-1'>
																			{workout.name || 'Unknown Exercise'}
																		</Text>
																		<Text className='text-text-secondary text-sm mb-1'>
																			{workout.bodyPart || ''} • {workout.target || ''}
																		</Text>
																		{workout.equipment && (
																			<Text className='text-text-secondary text-xs mb-2'>
																				Equipment: {workout.equipment}
																			</Text>
																		)}
																		<View className='flex-row items-center mt-1'>
																			<Text className='text-[#F9C513] font-semibold text-sm'>
																				{workout.sets || 0} sets × {workout.reps || 0} reps
																			</Text>
																		</View>
																	</View>
																</View>
															</View>
														);
													})}
												</View>
											)}
										</View>
									);
								})()}

								{en?.status === 'invited' && (
									<View className='flex-row gap-2 mt-3'>
										<TouchableOpacity
											onPress={() => {
												const key = `${item.id}:accept`;
												setClassInviteActionKey(key);
												respondClassInvite({
													variables: { sessionId: item.id, accept: true },
												})
													.catch(() => {})
													.finally(() => setClassInviteActionKey(null));
											}}
											disabled={classInviteActionKey !== null}
											className='flex-1 bg-[#22C55E]/25 py-3 rounded-xl items-center justify-center min-h-[48px]'
											style={{ opacity: classInviteActionKey !== null ? 0.55 : 1 }}
										>
											{classInviteActionKey === `${item.id}:accept` ? (
												<ActivityIndicator color='#22C55E' size='small' />
											) : (
												<Text className='text-[#22C55E] font-semibold'>Accept</Text>
											)}
										</TouchableOpacity>
										<TouchableOpacity
											onPress={() => {
												const key = `${item.id}:decline`;
												setClassInviteActionKey(key);
												respondClassInvite({
													variables: { sessionId: item.id, accept: false },
												})
													.catch(() => {})
													.finally(() => setClassInviteActionKey(null));
											}}
											disabled={classInviteActionKey !== null}
											className='flex-1 bg-bg-darker py-3 rounded-xl items-center justify-center min-h-[48px] border border-[#F9C513]'
											style={{ borderWidth: 0.5, opacity: classInviteActionKey !== null ? 0.55 : 1 }}
										>
											{classInviteActionKey === `${item.id}:decline` ? (
												<ActivityIndicator color='#8E8E93' size='small' />
											) : (
												<Text className='text-text-secondary font-semibold'>Decline</Text>
											)}
										</TouchableOpacity>
									</View>
								)}

								{item.sessionKind === 'group_class' &&
									(en?.status === 'accepted' || en?.status === 'pending') && (
										<TouchableOpacity
											onPress={() =>
												setLeaveClassTarget({
													id: item.id,
													className: item.name,
													isPendingOnly: en?.status === 'pending',
												})
											}
											disabled={leavingSessionId !== null}
											className='mt-3 bg-bg-darker py-3 rounded-xl items-center border border-[#FF3B30]/45'
											style={{ borderWidth: 0.5, opacity: leavingSessionId !== null ? 0.55 : 1 }}
										>
											<Text className='text-[#FF3B30] font-semibold'>
												{en?.status === 'pending'
													? 'Cancel join request'
													: 'Leave class'}
											</Text>
										</TouchableOpacity>
									)}

								{isSessionCurrentlyActive(item) && canCompleteSession(item) && (
									<GradientButton
										onPress={() => handleCompleteSession(item)}
										className='mt-3'
									>
										Complete Session
									</GradientButton>
								)}
							</View>
							);
						}}
					/>
						)}
					</>
				)}
			</ScrollView>

			{/* Completion Modal */}
			<Modal
				visible={showCompletionModal}
				animationType='slide'
				transparent
				onRequestClose={() => {
					setShowCompletionModal(false);
					setWeight('');
					setWeightError('');
					setProgressImages({
						front: null,
						rightSide: null,
						leftSide: null,
						back: null,
					});
				}}
			>
				<View className='flex-1 bg-bg-darker justify-end'>
					<View
						className='bg-bg-primary rounded-t-3xl p-6 max-h-[90%] border-t border-[#F9C513]'
						style={{ borderTopWidth: 0.5 }}
					>
						<ScrollView showsVerticalScrollIndicator={false}>
							<View className='flex-row justify-between items-center mb-6'>
								<Text className='text-2xl font-bold text-text-primary'>
									Complete Session
								</Text>
								<TouchableOpacity
									onPress={() => {
										setShowCompletionModal(false);
										setWeight('');
										setWeightError('');
										setProgressImages({
											front: null,
											rightSide: null,
											leftSide: null,
											back: null,
										});
									}}
								>
									<Ionicons name='close' size={28} color='#8E8E93' />
								</TouchableOpacity>
							</View>


							{selectedSession?.goal &&
								isWeightRelatedGoal(selectedSession.goal) && (
									<View className='mb-6'>
										{(() => {
											const g = selectedSession.goal;
											const startStr = formatKgDisplay(g.currentWeight);
											const targetStr = formatKgDisplay(g.targetWeight);
											const curParsed = parseFloat(weight.trim().replace(/,/g, '.'));
											const curStr =
												weight.trim() && !Number.isNaN(curParsed)
													? formatKgDisplay(curParsed)
													: null;
											return (
												<View className='mb-4 rounded-xl border border-[#F9C513]/50 bg-bg-darker p-4'>
													<Text className='text-[#F9C513] text-xs font-semibold uppercase tracking-wide mb-3'>
														Weight comparison
													</Text>
													{startStr != null ? (
														<View className='flex-row gap-3 mb-2'>
															<View className='flex-1 rounded-lg border border-[#F9C513]/30 bg-bg-primary/80 p-3'>
																<Text className='text-text-secondary text-xs mb-1'>
																	Starting (when you set the goal)
																</Text>
																<Text className='text-[#F9C513] text-xl font-bold'>
																	{startStr}{' '}
																	<Text className='text-base font-semibold'>kg</Text>
																</Text>
															</View>
															<View className='flex-1 rounded-lg border border-[#34C759]/40 bg-bg-primary/80 p-3'>
																<Text className='text-text-secondary text-xs mb-1'>
																	Now (this session)
																</Text>
																<Text className='text-[#34C759] text-xl font-bold'>
																	{curStr != null ? (
																		<>
																			{curStr}{' '}
																			<Text className='text-base font-semibold'>kg</Text>
																		</>
																	) : (
																		<Text className='text-text-secondary text-sm font-normal'>
																			Enter below
																		</Text>
																	)}
																</Text>
															</View>
														</View>
													) : (
														<Text className='text-text-secondary text-sm leading-5 mb-2'>
															No starting weight is stored on this goal yet. Enter your
															current weight below — you can set starting weight on Progress.
														</Text>
													)}
													{targetStr != null ? (
														<Text className='text-text-secondary text-sm mb-2'>
															Goal target:{' '}
															<Text className='text-text-primary font-semibold'>
																{targetStr} kg
															</Text>
														</Text>
													) : null}
													{startStr != null && curStr != null && g.currentWeight != null ? (
														(() => {
															const delta =
																Math.round((curParsed - Number(g.currentWeight)) * 10) / 10;
															const sign = delta > 0 ? '+' : '';
															return (
																<Text className='text-text-secondary text-sm'>
																	Change from start:{' '}
																	<Text className='text-text-primary font-semibold'>
																		{sign}
																		{delta} kg
																	</Text>
																</Text>
															);
														})()
													) : null}
												</View>
											);
										})()}
										<Text className='text-text-primary font-semibold mb-2'>
											Enter Current Weight (kg){' '}
											<Text className='text-red-500'>*</Text>
										</Text>
										<TextInput
											className={`bg-bg-darker rounded-lg p-4 text-text-primary text-lg border ${
												weightError ? 'border-red-500' : 'border-[#F9C513]'
											}`}
											style={{ borderWidth: 0.5 }}
											placeholder='Enter weight in kg (required)'
											placeholderTextColor='#8E8E93'
											value={weight}
											onChangeText={(text) => {
												setWeight(text);
												setWeightError('');
											}}
											keyboardType='decimal-pad'
										/>
										{weightError ? (
											<Text className='text-red-500 text-sm mt-1'>
												{weightError}
											</Text>
										) : null}
									</View>
								)}

							<View className='mb-6'>
								<Text className='text-text-primary font-semibold mb-4'>
									Progress Photos <Text className='text-red-500'>*</Text>
								</Text>
								<Text className='text-text-secondary text-sm mb-4'>
									Please take 4 photos from different angles using the camera
								</Text>

								{(
									['front', 'rightSide', 'leftSide', 'back'] as ImageAngle[]
								).map((angle) => (
									<TouchableOpacity
										key={angle}
										onPress={() => startCameraCapture(angle)}
										disabled={uploading}
										className='mb-3 p-4 bg-bg-darker rounded-xl border border-[#F9C513]'
										style={{ borderWidth: 0.5, opacity: uploading ? 0.5 : 1 }}
									>
										<View className='flex-row items-center justify-between'>
											<View className='flex-row items-center flex-1'>
												<Ionicons
													name={
														progressImages[angle]
															? 'checkmark-circle'
															: 'camera'
													}
													size={24}
													color={progressImages[angle] ? '#4CAF50' : '#F9C513'}
												/>
												<Text className='text-text-primary font-semibold ml-3'>
													{angleLabels[angle]}
												</Text>
											</View>
											{progressImages[angle] ? (
												<View
													className='w-16 h-16 rounded-lg overflow-hidden border border-[#F9C513]'
													style={{ borderWidth: 0.5 }}
												>
													<Image
														source={{ uri: progressImages[angle]! }}
														className='w-full h-full'
													/>
												</View>
											) : (
												<Ionicons
													name='chevron-forward'
													size={20}
													color='#8E8E93'
												/>
											)}
										</View>
									</TouchableOpacity>
								))}

								{uploading && (
									<View className='items-center py-4'>
										<ActivityIndicator size='small' color='#F9C513' />
										<Text className='text-text-secondary text-sm mt-2'>
											Uploading image...
										</Text>
									</View>
								)}
							</View>

							{(() => {
								const isWeightRequired = selectedSession?.goal && isWeightRelatedGoal(selectedSession.goal);
								const isWeightValid = !isWeightRequired || (weight.trim() && parseFloat(weight.trim()) > 0);

								const allImagesCaptured =
									progressImages.front &&
									progressImages.rightSide &&
									progressImages.leftSide &&
									progressImages.back;

								const isFormValid = isWeightValid && allImagesCaptured;
								
								return (
									<GradientButton
										onPress={handleSubmitCompletion}
										loading={completing || uploading}
										className='mt-4'
										disabled={completing || uploading || !isFormValid}
									>
										{completing ? 'Completing...' : 'Complete Session'}
									</GradientButton>
								);
							})()}
						</ScrollView>
					</View>
				</View>
			</Modal>

			{/* Camera Modal */}
			<CameraCapture
				visible={showCamera}
				onClose={() => setShowCamera(false)}
				onCapture={handleImageCapture}
				angle={currentAngle}
				angleLabel={angleLabels[currentAngle]}
			/>

			{/* Coach Rating Modal — one rating per session; existing rating is read-only */}
			<Modal
				visible={showRatingModal}
				animationType='slide'
				transparent={false}
				onRequestClose={closeRatingModal}
			>
				<View className='flex-1 bg-bg-darker justify-center px-5'>
					<View
						className='bg-bg-primary rounded-2xl p-6 border border-[#F9C513]'
						style={{ borderWidth: 0.5 }}
					>
						<View className='flex-row justify-between items-center mb-4'>
							<Text className='text-2xl font-bold text-text-primary flex-1 pr-2'>
								{existingCoachRatingForModal
									? 'Your coach rating'
									: 'Rate your coach'}
							</Text>
							<TouchableOpacity onPress={closeRatingModal} accessibilityLabel='Close'>
								<Ionicons name='close' size={28} color='#8E8E93' />
							</TouchableOpacity>
						</View>

						{coachRatingForCompletedLogLoading ? (
							<View className='py-10 items-center justify-center'>
								<ActivityIndicator size='large' color='#F9C513' />
								<Text className='text-text-secondary text-sm mt-4'>Loading…</Text>
							</View>
						) : existingCoachRatingForModal ? (
							<ScrollView showsVerticalScrollIndicator={false}>
								<Text className='text-text-secondary text-base mb-6'>
									You already rated this session. You can review it below.
								</Text>
								{existingCoachRatingForModal.coach ? (
									<Text className='text-text-primary font-semibold mb-4'>
										Coach {existingCoachRatingForModal.coach.firstName}{' '}
										{existingCoachRatingForModal.coach.lastName}
									</Text>
								) : null}
								<Text className='text-text-secondary text-sm mb-2'>Your stars</Text>
								<View className='flex-row items-center mb-6'>
									{[1, 2, 3, 4, 5].map((star) => (
										<Ionicons
											key={star}
											name={
												star <= (existingCoachRatingForModal.rating || 0)
													? 'star'
													: 'star-outline'
											}
											size={36}
											color='#F9C513'
										/>
									))}
									<Text className='text-text-primary font-semibold ml-3 text-lg'>
										{existingCoachRatingForModal.rating}/5
									</Text>
								</View>
								<Text className='text-text-secondary text-sm mb-2'>
									Why you rated this way (your feedback)
								</Text>
								<View className='bg-bg-darker rounded-lg p-4 border border-[#F9C513]/40 mb-6'>
									<Text className='text-text-primary text-base leading-6'>
										{existingCoachRatingForModal.comment || '—'}
									</Text>
								</View>
								{existingCoachRatingForModal.createdAt ? (
									<Text className='text-text-secondary text-xs mb-6'>
										Submitted{' '}
										{new Date(existingCoachRatingForModal.createdAt).toLocaleString('en-US', {
											month: 'short',
											day: 'numeric',
											year: 'numeric',
											hour: 'numeric',
											minute: '2-digit',
										})}
									</Text>
								) : null}
								<GradientButton onPress={closeRatingModal}>Done</GradientButton>
							</ScrollView>
						) : (
							<ScrollView showsVerticalScrollIndicator={false}>
								<Text className='text-text-secondary text-base mb-6'>
									Tap stars, then tell us why. Both are required.
								</Text>

								<View className='mb-6'>
									<Text className='text-text-primary font-semibold mb-3'>
										Stars <Text className='text-red-500'>*</Text>
									</Text>
									<View className='flex-row justify-center gap-2'>
										{[1, 2, 3, 4, 5].map((star) => (
											<TouchableOpacity
												key={star}
												onPress={() => setCoachRating(star)}
												className='p-2'
												accessibilityLabel={`${star} star${star > 1 ? 's' : ''}`}
											>
												<Ionicons
													name={star <= coachRating ? 'star' : 'star-outline'}
													size={40}
													color='#F9C513'
												/>
											</TouchableOpacity>
										))}
									</View>
									{coachRating > 0 ? (
										<Text className='text-text-secondary text-center mt-2'>
											{coachRating} out of 5
										</Text>
									) : null}
									<Text className='text-text-secondary text-center text-xs mt-1'>
										1 = Lowest, 5 = Highest satisfaction
									</Text>
								</View>

								<View className='mb-6'>
									<Text className='text-text-primary font-semibold mb-2'>
										Why this rating? (written feedback){' '}
										<Text className='text-red-500'>*</Text>
									</Text>
									<Text className='text-text-secondary text-sm mb-2'>
										Brief reason for your score (min {MIN_COACH_RATING_COMMENT_LENGTH}{' '}
										characters).
									</Text>
									<TextInput
										className={`bg-bg-darker rounded-lg p-4 text-text-primary text-base border ${
											coachCommentError ? 'border-red-500' : 'border-[#F9C513]'
										}`}
										style={{ borderWidth: 0.5, minHeight: 120, textAlignVertical: 'top' }}
										placeholder='Tell us why'
										placeholderTextColor='#8E8E93'
										value={coachComment}
										onChangeText={(t) => {
											setCoachComment(t);
											setCoachCommentError('');
										}}
										multiline
										numberOfLines={5}
									/>
									<View className='flex-row justify-between items-start mt-1'>
										{coachCommentError ? (
											<Text className='text-red-500 text-sm flex-1 mr-2'>{coachCommentError}</Text>
										) : (
											<View className='flex-1 mr-2' />
										)}
										<Text
											className={`text-xs ${
												coachComment.trim().length >= MIN_COACH_RATING_COMMENT_LENGTH
													? 'text-[#34C759]'
													: 'text-text-secondary'
											}`}
										>
											{coachComment.trim().length}/{MIN_COACH_RATING_COMMENT_LENGTH}
										</Text>
									</View>
								</View>

								<View>
									<TouchableOpacity
										className='bg-[#F9C513] rounded-lg p-4 items-center'
										onPress={() => {
											if (coachRating === 0) {
												setAlertModal({
													visible: true,
													title: 'Stars required',
													message: 'Please tap 1–5 stars before submitting.',
													variant: 'warning',
												});
												return;
											}

											const trimmed = coachComment.trim();
											if (trimmed.length < MIN_COACH_RATING_COMMENT_LENGTH) {
												setCoachCommentError(
													`Please write at least ${MIN_COACH_RATING_COMMENT_LENGTH} characters explaining your rating.`
												);
												setAlertModal({
													visible: true,
													title: 'Feedback required',
													message: `Tell your coach why you chose this score (at least ${MIN_COACH_RATING_COMMENT_LENGTH} characters).`,
													variant: 'warning',
												});
												return;
											}

											if (!completedSessionLogId || !completedCoachId) {
												setAlertModal({
													visible: true,
													title: 'Error',
													message: 'Missing session information',
													variant: 'danger',
												});
												return;
											}

											createCoachRating({
												variables: {
													input: {
														coachId: completedCoachId,
														sessionLogId: completedSessionLogId,
														rating: coachRating,
														comment: trimmed,
													},
												},
											});
										}}
										disabled={
											ratingLoading ||
											coachRating === 0 ||
											coachComment.trim().length < MIN_COACH_RATING_COMMENT_LENGTH
										}
										style={{
											opacity:
												ratingLoading ||
												coachRating === 0 ||
												coachComment.trim().length < MIN_COACH_RATING_COMMENT_LENGTH
													? 0.5
													: 1,
										}}
									>
										{ratingLoading ? (
											<ActivityIndicator color='#000' />
										) : (
											<Text className='text-black font-semibold'>Submit feedback</Text>
										)}
									</TouchableOpacity>
								</View>
							</ScrollView>
						)}
					</View>
				</View>
			</Modal>
			<ConfirmModal
				visible={!!leaveClassTarget}
				title={leaveClassTarget?.isPendingOnly ? 'Cancel request?' : 'Leave this class?'}
				message={
					leaveClassTarget
						? leaveClassTarget.isPendingOnly
							? `Cancel your request to join "${leaveClassTarget.className}"?`
							: `Leave "${leaveClassTarget.className}"? You can request to join again if the coach allows it.`
						: ''
				}
				variant='warning'
				confirmLabel={leaveClassTarget?.isPendingOnly ? 'Cancel request' : 'Leave'}
				loading={!!leaveClassTarget && leavingSessionId === leaveClassTarget.id}
				onCancel={() => {
					if (!leavingSessionId) setLeaveClassTarget(null);
				}}
				onConfirm={() => {
					if (!leaveClassTarget) return;
					const sid = leaveClassTarget.id;
					setLeavingSessionId(sid);
					leaveClassSessionMut({ variables: { sessionId: sid } })
						.catch(() => {})
						.finally(() => setLeavingSessionId(null));
				}}
			/>
			<ConfirmModal
				visible={alertModal.visible}
				title={alertModal.title}
				message={alertModal.message}
				variant={alertModal.variant as any}
				confirmLabel="OK"
				onConfirm={() => setAlertModal((p) => ({ ...p, visible: false }))}
				onCancel={() => setAlertModal((p) => ({ ...p, visible: false }))}
				hideCancel
			/>
		</FixedView>
	);
};

export default MemberSchedule;
