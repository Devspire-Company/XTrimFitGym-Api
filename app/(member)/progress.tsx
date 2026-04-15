import ConfirmModal from '@/components/ConfirmModal';
import FixedView from '@/components/FixedView';
import GradientButton from '@/components/GradientButton';
import Input from '@/components/Input';
import Select from '@/components/Select';
import TabHeader from '@/components/TabHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useMemberMembershipModal } from '@/contexts/MemberMembershipModalContext';
import { memberHasActiveGymMembership } from '@/utils/memberMembership';
import {
	GetGoalsQuery,
	GetGoalsQueryVariables,
	GetWeightProgressChartQuery,
	GetWeightProgressChartQueryVariables,
} from '@/graphql/generated/types';
import {
	CREATE_GOAL_MUTATION,
	DELETE_GOAL_MUTATION,
} from '@/graphql/mutations';
import { normalizePhysiqueGoalTypeForApi } from '@/constants/onboarding-options';
import {
	GET_GOALS_QUERY,
	GET_WEIGHT_PROGRESS_CHART_QUERY,
	GET_PROGRESS_RATINGS_QUERY,
	GET_CLIENT_SESSIONS_QUERY,
	GET_SESSION_LOGS_QUERY,
	GET_COACH_RATING_BY_SESSION_LOG_QUERY,
	GET_MY_COACH_RATINGS_FOR_GOAL_QUERY,
} from '@/graphql/queries';
import { useMutation, useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Image as ExpoImage } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	Dimensions,
	FlatList,
	Modal,
	RefreshControl,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const menuWidth = 180;

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

const goalTypeOptions = [
	{ label: 'Weight Loss', value: 'WEIGHT_LOSS' },
	{ label: 'Muscle Building', value: 'MUSCLE_BUILDING' },
	{ label: 'General Fitness', value: 'GENERAL_FITNESS' },
	{ label: 'Strength Training', value: 'STRENGTH_TRAINING' },
	{ label: 'Endurance', value: 'ENDURANCE' },
	{ label: 'Flexibility', value: 'FLEXIBILITY' },
	{ label: 'Athletic Performance', value: 'ATHLETIC_PERFORMANCE' },
	{ label: 'Rehabilitation', value: 'REHABILITATION' },
];

/** Add calendar months without jumping past month-end (e.g. Jan 31 + 1 → Feb 28/29). */
function addCalendarMonths(from: Date, monthsToAdd: number): Date {
	const base = new Date(
		from.getFullYear(),
		from.getMonth(),
		from.getDate(),
	);
	const day = base.getDate();
	base.setMonth(base.getMonth() + monthsToAdd);
	if (base.getDate() !== day) {
		base.setDate(0);
	}
	return base;
}

/** Baseline months from goal type — longest selected wins. */
function monthsBaselineForGoalTypes(types: string[]): number {
	const monthsForType = (type: string) => {
		switch (type) {
			case 'WEIGHT_LOSS':
				return 4;
			case 'MUSCLE_BUILDING':
				return 6;
			case 'GENERAL_FITNESS':
				return 3;
			case 'STRENGTH_TRAINING':
				return 5;
			case 'ENDURANCE':
				return 5;
			case 'FLEXIBILITY':
				return 3;
			case 'ATHLETIC_PERFORMANCE':
				return 6;
			case 'REHABILITATION':
				return 4;
			default:
				return 3;
		}
	};
	return types.reduce((max, type) => Math.max(max, monthsForType(type)), 0);
}

type BodyKind = 'ectomorph' | 'mesomorph' | 'endomorph' | 'general';

function parseBodyKind(physiqueRaw: string | undefined | null): BodyKind {
	const normalized = normalizePhysiqueGoalTypeForApi(physiqueRaw);
	const s = normalized.toLowerCase();
	if (s.includes('not sure') || s.includes('not-sure')) return 'general';
	if (s.includes('ecto')) return 'ectomorph';
	if (s.includes('meso')) return 'mesomorph';
	if (s.includes('endo')) return 'endomorph';
	return 'general';
}

/**
 * Extra time from genetics vs “average” for weight-focused goals.
 * Endomorphs often need longer cuts; ectomorphs longer lean bulks; mesomorphs slightly shorter.
 */
function bodyTypeMonthsMultiplier(body: BodyKind, types: string[]): number {
	const wl = types.includes('WEIGHT_LOSS');
	const mb = types.includes('MUSCLE_BUILDING');
	if (wl && body === 'endomorph') return 1.14;
	if (wl && body === 'ectomorph') return 0.96;
	if (mb && body === 'ectomorph') return 1.2;
	if (mb && body === 'mesomorph') return 0.9;
	if (mb && body === 'endomorph') return 1.06;
	if (!wl && !mb) {
		if (body === 'ectomorph' && types.includes('STRENGTH_TRAINING')) return 1.06;
		if (body === 'endomorph' && types.includes('ENDURANCE')) return 1.05;
	}
	return 1;
}

/**
 * Months implied by kg change at sustainable paces (~1.25 kg/mo loss, ~0.55 kg/mo lean gain).
 */
function monthsFromWeightDelta(types: string[], currentStr: string, targetStr: string): number | null {
	const c = parseFloat(currentStr.replace(/,/g, '.'));
	const t = parseFloat(targetStr.replace(/,/g, '.'));
	if (!Number.isFinite(c) || !Number.isFinite(t) || c <= 0 || t <= 0) return null;

	const hasLoss = types.includes('WEIGHT_LOSS');
	const hasMuscle = types.includes('MUSCLE_BUILDING');
	if (!hasLoss && !hasMuscle) return null;

	let need = 0;
	if (hasLoss && c > t) {
		const lossKg = c - t;
		need = Math.max(need, Math.ceil(lossKg / 1.25));
	}
	if (hasMuscle && t > c) {
		const gainKg = t - c;
		need = Math.max(need, Math.ceil(gainKg / 0.55));
	}
	if (need <= 0) return null;
	return Math.min(Math.max(need, 2), 36);
}

/**
 * Target timeline: max(goal-type baseline, weight-based estimate) × body-type multiplier,
 * then clamped to a sensible range (caller still clamps to 5y cap).
 */
function computeGoalTargetMonths(params: {
	goalTypes: string[];
	physiqueGoalType: string | undefined | null;
	currentWeight: string;
	targetWeight: string;
}): number {
	const { goalTypes, physiqueGoalType, currentWeight, targetWeight } = params;
	if (goalTypes.length === 0) return 0;

	const baseline = monthsBaselineForGoalTypes(goalTypes);
	const body = parseBodyKind(physiqueGoalType);
	const mult = bodyTypeMonthsMultiplier(body, goalTypes);
	const fromWeight = monthsFromWeightDelta(goalTypes, currentWeight, targetWeight);

	let months = baseline;
	if (fromWeight != null) {
		months = Math.max(baseline, fromWeight);
	}
	months = Math.ceil(months * mult);
	return Math.min(Math.max(months, 2), 60);
}

const MemberProgress = () => {
	const { user } = useAuth();
	const router = useRouter();
	const { openMembershipRequired } = useMemberMembershipModal();
	const hasMembership = memberHasActiveGymMembership(user);

	useFocusEffect(
		useCallback(() => {
			if (!hasMembership) {
				openMembershipRequired();
				router.replace('/(member)/workouts');
			}
		}, [hasMembership, openMembershipRequired, router])
	);

	const [refreshing, setRefreshing] = useState(false);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showCreateSuccess, setShowCreateSuccess] = useState(false);
	const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
	const [alertModal, setAlertModal] = useState<{
		visible: boolean;
		title: string;
		message: string;
		variant: 'danger' | 'neutral' | 'success';
	}>({ visible: false, title: '', message: '', variant: 'neutral' });
	const [selectedGoal, setSelectedGoal] = useState<any>(null);
	const [showWeightChart, setShowWeightChart] = useState(false);

	const [title, setTitle] = useState('');
	const [selectedGoalTypes, setSelectedGoalTypes] = useState<string[]>([]);
	const [description, setDescription] = useState('');
	const [targetWeight, setTargetWeight] = useState('');
	const [currentWeight, setCurrentWeight] = useState('');
	const [targetDate, setTargetDate] = useState<Date | undefined>();
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [selectedSession, setSelectedSession] = useState<any>(null);
	/** When opening a completed workout from Recent Sessions, includes weight / goal context */
	const [selectedSessionLog, setSelectedSessionLog] = useState<any>(null);
	const [showWorkoutModal, setShowWorkoutModal] = useState(false);
	const [goalMenuOpen, setGoalMenuOpen] = useState<any>(null);
	const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
	const [goalToDelete, setGoalToDelete] = useState<any>(null);
	const menuButtonRefs = useRef<Record<string, View | null>>({});

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

	// Parse workoutType JSON string to get exercises
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

	const { data: goalsData, refetch: refetchGoals } = useQuery<
		GetGoalsQuery,
		GetGoalsQueryVariables
	>(GET_GOALS_QUERY, {
		variables: { clientId: user?.id || '', status: 'active' },
		fetchPolicy: 'cache-and-network',
		skip: !user?.id,
	});

	// Refetch data when screen is mounted
	useEffect(() => {
		if (user?.id) {
			refetchGoals();
		}
	}, [user?.id, refetchGoals]);

	// Handle pull-to-refresh
	const onRefresh = async () => {
		setRefreshing(true);
		try {
			if (user?.id) {
				await Promise.all([
					refetchGoals(),
					refetchSessions(),
					refetchSessionLogs(),
				]);
			}
		} finally {
			setRefreshing(false);
		}
	};

	const { data: progressData } = useQuery<
		GetWeightProgressChartQuery,
		GetWeightProgressChartQueryVariables
	>(GET_WEIGHT_PROGRESS_CHART_QUERY, {
		variables: { clientId: user?.id || '', goalId: selectedGoal?.id },
		skip: !selectedGoal || !showWeightChart || !user?.id,
	});

	// Query progress ratings for the selected goal
	const { data: ratingsData } = useQuery<any>(
		GET_PROGRESS_RATINGS_QUERY,
		{
			variables: {
				clientId: user?.id || '',
				goalId: selectedGoal?.id || '',
			},
			skip: !selectedGoal || !showWeightChart || !user?.id,
			fetchPolicy: 'cache-and-network',
		}
	);

	const sessionLogIdForCoachRating =
		showWorkoutModal && selectedSessionLog?.id ? selectedSessionLog.id : '';

	const { data: sessionLogCoachRatingData } = useQuery<any>(
		GET_COACH_RATING_BY_SESSION_LOG_QUERY,
		{
			variables: { sessionLogId: sessionLogIdForCoachRating },
			skip: !sessionLogIdForCoachRating || !user?.id,
			fetchPolicy: 'network-only',
		}
	);

	const goalIdForSessionRecap = selectedSessionLog?.session?.goal?.id || '';

	const { data: recapProgressRatingsData } = useQuery<any>(GET_PROGRESS_RATINGS_QUERY, {
		variables: { clientId: user?.id || '', goalId: goalIdForSessionRecap },
		skip:
			!showWorkoutModal ||
			!selectedSessionLog?.id ||
			!goalIdForSessionRecap ||
			!user?.id,
		fetchPolicy: 'cache-and-network',
	});

	const { data: myCoachRatingsForGoal } = useQuery<any>(GET_MY_COACH_RATINGS_FOR_GOAL_QUERY, {
		variables: { goalId: selectedGoal?.id || '' },
		skip: !selectedGoal?.id || !showWeightChart || !user?.id,
		fetchPolicy: 'cache-and-network',
	});

	// Query upcoming sessions to show workouts
	const { data: sessionsData, refetch: refetchSessions } = useQuery(
		GET_CLIENT_SESSIONS_QUERY,
		{
			variables: { clientId: user?.id || '', status: 'UPCOMING' },
			fetchPolicy: 'cache-and-network',
			skip: !user?.id,
		}
	);

	// Query recent session logs to show completed workouts
	const { data: sessionLogsData, refetch: refetchSessionLogs } = useQuery(
		GET_SESSION_LOGS_QUERY,
		{
			variables: { clientId: user?.id || '' },
			fetchPolicy: 'cache-and-network',
			skip: !user?.id,
		}
	);

	// Get sessions with workouts
	const sessionsWithWorkouts = useMemo(() => {
		const upcoming = (sessionsData?.getClientSessions || []).filter((s: any) => {
			const exercises = parseWorkoutExercises(s.workoutType);
			return exercises.length > 0;
		});
		const completed = (sessionLogsData?.getSessionLogs || [])
			.filter((log: any) => {
				const exercises = parseWorkoutExercises(log.session?.workoutType);
				return exercises.length > 0;
			})
			.slice(0, 5); // Show only recent 5
		return { upcoming, completed };
	}, [sessionsData, sessionLogsData, parseWorkoutExercises]);

	const recapRatingsForLog = useMemo(() => {
		if (!selectedSessionLog?.id) return [];
		const list = recapProgressRatingsData?.getProgressRatings || [];
		return list.filter((r: any) => (r.sessionLogIds || []).includes(selectedSessionLog.id));
	}, [recapProgressRatingsData, selectedSessionLog?.id]);

	const memberCoachRatingForLog = useMemo(() => {
		const r = sessionLogCoachRatingData?.getCoachRatingBySessionLog;
		if (!r || !selectedSessionLog?.id) return null;
		return r.sessionLogId === selectedSessionLog.id ? r : null;
	}, [sessionLogCoachRatingData, selectedSessionLog?.id]);

	const mySessionRatingsList = useMemo(
		() => myCoachRatingsForGoal?.getMyCoachRatingsForGoal || [],
		[myCoachRatingsForGoal]
	);

	const [createGoal, { loading: creating }] = useMutation(
		CREATE_GOAL_MUTATION,
		{
			onCompleted: () => {
				setShowCreateModal(false);
				resetForm();
				refetchGoals();
				setShowCreateSuccess(true);
			},
			onError: (error) => {
				setAlertModal({ visible: true, title: 'Error', message: error.message, variant: 'danger' });
			},
		}
	);

	const [deleteGoal] = useMutation(DELETE_GOAL_MUTATION, {
		onCompleted: () => {
			refetchGoals();
			setShowDeleteSuccess(true);
		},
		onError: (error) => {
			setAlertModal({ visible: true, title: 'Error', message: error.message, variant: 'danger' });
		},
	});

	const resetForm = () => {
		setTitle('');
		setSelectedGoalTypes([]);
		setDescription('');
		setTargetWeight('');
		setCurrentWeight('');
		setTargetDate(undefined);
		setErrors({});
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};
		const isWeightRelated = selectedGoalTypes.some(
			(type) => type === 'WEIGHT_LOSS' || type === 'MUSCLE_BUILDING',
		);

		if (!title.trim()) newErrors.title = 'Title is required';
		if (selectedGoalTypes.length === 0) newErrors.goalType = 'Goal type is required';
		if (!targetDate) {
			newErrors.targetDate = isWeightRelated
				? 'Enter valid current and target weight to calculate your target date'
				: 'Target date is required';
		}

		// Weight fields are required only for weight-related goal types
		if (isWeightRelated) {
			if (!currentWeight.trim()) {
				newErrors.currentWeight =
					'Current weight is required for weight-related goals';
			} else if (
				isNaN(parseFloat(currentWeight)) ||
				parseFloat(currentWeight) <= 0
			) {
				newErrors.currentWeight = 'Please enter a valid current weight';
			}
			if (!targetWeight.trim()) {
				newErrors.targetWeight =
					'Target weight is required for weight-related goals';
			} else if (
				isNaN(parseFloat(targetWeight)) ||
				parseFloat(targetWeight) <= 0
			) {
				newErrors.targetWeight = 'Please enter a valid target weight';
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = () => {
		if (!validateForm()) return;

		const primaryGoalType =
			selectedGoalTypes.find((t) => t === 'WEIGHT_LOSS' || t === 'MUSCLE_BUILDING') ||
			selectedGoalTypes[0];

		const input: any = {
			goalType: primaryGoalType,
			title: title.trim(),
			description: description.trim() || undefined,
			targetDate: targetDate?.toISOString(),
		};

		// Only include weight fields for weight-related goals
		const isWeightRelated = selectedGoalTypes.some(
			(type) => type === 'WEIGHT_LOSS' || type === 'MUSCLE_BUILDING',
		);
		if (isWeightRelated) {
			input.currentWeight = parseFloat(currentWeight);
			input.targetWeight = parseFloat(targetWeight);
		}

		createGoal({ variables: { input } });
	};

	const goals = goalsData?.getGoals || [];
	const progressPoints = progressData?.getWeightProgressChart || [];

	const goalTargetDateMaximum = useMemo(() => {
		const d = new Date();
		d.setFullYear(d.getFullYear() + 5);
		return d;
	}, []);

	const isWeightRelatedGoalPick = useMemo(
		() =>
			selectedGoalTypes.some(
				(t) => t === 'WEIGHT_LOSS' || t === 'MUSCLE_BUILDING',
			),
		[selectedGoalTypes],
	);

	const bothWeightsValidForEstimate = useMemo(() => {
		const c = parseFloat(currentWeight.trim().replace(/,/g, '.'));
		const t = parseFloat(targetWeight.trim().replace(/,/g, '.'));
		return Number.isFinite(c) && Number.isFinite(t) && c > 0 && t > 0;
	}, [currentWeight, targetWeight]);

	const showTargetDateEstimating =
		selectedGoalTypes.length > 0 &&
		isWeightRelatedGoalPick &&
		!bothWeightsValidForEstimate;

	// Auto target date: non–weight goals immediately; weight goals only after both weights valid
	useEffect(() => {
		if (selectedGoalTypes.length === 0) {
			setTargetDate(undefined);
			return;
		}

		if (isWeightRelatedGoalPick && !bothWeightsValidForEstimate) {
			setTargetDate(undefined);
			setErrors((prev) => ({ ...prev, targetDate: '' }));
			return;
		}

		const today = new Date();
		const start = new Date(
			today.getFullYear(),
			today.getMonth(),
			today.getDate(),
		);

		const maxMonths = computeGoalTargetMonths({
			goalTypes: selectedGoalTypes,
			physiqueGoalType: user?.membershipDetails?.physiqueGoalType,
			currentWeight,
			targetWeight,
		});
		if (!maxMonths) return;

		let recommended = addCalendarMonths(start, maxMonths);
		if (recommended.getTime() > goalTargetDateMaximum.getTime()) {
			recommended = new Date(goalTargetDateMaximum);
		}
		setTargetDate(recommended);
		setErrors((prev) => ({ ...prev, targetDate: '' }));
	}, [
		selectedGoalTypes,
		currentWeight,
		targetWeight,
		user?.membershipDetails?.physiqueGoalType,
		goalTargetDateMaximum,
		isWeightRelatedGoalPick,
		bothWeightsValidForEstimate,
	]);

	// Simple weight chart visualization
	const renderWeightChart = () => {
		if (progressPoints.length === 0) {
			return (
				<View className='items-center justify-center py-10'>
					<Text className='text-text-secondary'>
						No weight data available yet
					</Text>
				</View>
			);
		}

		const weights = progressPoints.map((p: any) => p.weight);
		const minWeight = Math.min(...weights);
		const maxWeight = Math.max(...weights);
		const range = maxWeight - minWeight || 1;
		const chartHeight = 200;
		const chartWidth = screenWidth - 60;

		return (
			<View className='mt-4'>
				<Text className='text-text-primary font-semibold mb-4'>
					Weight Progress
				</Text>
				<View
					className='border-l-2 border-b-2 border-text-secondary'
					style={{ height: chartHeight, width: chartWidth }}
				>
					{progressPoints.map((point: any, index: number) => {
						const normalizedWeight = (point.weight - minWeight) / range;
						const y = chartHeight - normalizedWeight * chartHeight;
						const x = (index / (progressPoints.length - 1 || 1)) * chartWidth;

						return (
							<View
								key={index}
								className='absolute bg-[#F9C513] rounded-full'
								style={{
									left: x - 4,
									top: y - 4,
									width: 8,
									height: 8,
								}}
							/>
						);
					})}
				</View>
				<View className='flex-row justify-between mt-2'>
					<Text className='text-text-secondary text-xs'>
						{new Date(progressPoints[0]?.date).toLocaleDateString()}
					</Text>
					<Text className='text-text-secondary text-xs'>
						{new Date(
							progressPoints[progressPoints.length - 1]?.date
						).toLocaleDateString()}
					</Text>
				</View>
			</View>
		);
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
					<View>
						<Text className='text-3xl font-bold text-text-primary'>
							Progress
						</Text>
						<Text className='text-text-secondary mt-1'>
							Track your fitness goals
						</Text>
					</View>
					<View className='flex-row gap-3 mt-4'>
						<GradientButton
							onPress={() => {
								resetForm();
								setShowCreateModal(true);
							}}
							className='flex-1'
						>
							Add Goal
						</GradientButton>
						<GradientButton
							onPress={() => router.push('/(member)/session-logs')}
							className='flex-1'
							variant='secondary'
						>
							<View className='flex-row items-center justify-center'>
								<Ionicons name='document-text' size={20} color='#F9C513' />
								<Text className='text-[#F9C513] font-semibold ml-2'>
									Session Logs
								</Text>
							</View>
						</GradientButton>
					</View>
				</View>

				{goals.length === 0 ? (
					<View
						className='bg-bg-primary rounded-xl p-6 items-center border border-[#F9C513]'
						style={{ borderWidth: 0.5 }}
					>
						<Ionicons name='flag-outline' size={48} color='#8E8E93' />
						<Text className='text-text-secondary mt-4 text-center text-base'>
							No goals yet
						</Text>
						<Text className='text-text-secondary mt-2 text-center text-sm'>
							Create a goal to start tracking your progress
						</Text>
					</View>
				) : (
					<>
						<FlatList
							data={goals}
							keyExtractor={(item) => item.id}
							scrollEnabled={false}
							renderItem={({ item }) => (
							<View
								className='bg-bg-primary rounded-xl p-4 mb-3 border border-[#F9C513]'
								style={{ borderWidth: 0.5 }}
							>
								<View className='flex-row justify-between items-start mb-2'>
									<View className='flex-1'>
										<Text className='text-text-primary font-semibold text-lg mb-1'>
											{item.title}
										</Text>
										<Text className='text-text-secondary text-sm'>
											{goalTypeOptions.find(
												(opt) => opt.value === item.goalType
											)?.label || item.goalType}
										</Text>
										{item.coach && (
											<View className='flex-row items-center mt-1'>
												<Ionicons name='person' size={14} color='#F9C513' />
												<Text className='text-[#F9C513] text-xs ml-1'>
													With Coach {item.coach.firstName}{' '}
													{item.coach.lastName}
												</Text>
											</View>
										)}
									</View>
									<View
										ref={(el) => {
											if (el) menuButtonRefs.current[item.id] = el;
										}}
										collapsable={false}
									>
										<TouchableOpacity
											onPress={() => {
												const node = menuButtonRefs.current[item.id];
												(node as any)?.measureInWindow?.(
													(x: number, y: number, _w: number, h: number) => {
														setGoalMenuOpen(item);
														setMenuPosition({
															x: Math.max(8, Math.min(x - menuWidth / 2 + 22, screenWidth - menuWidth - 8)),
															y: y + h + 4,
														});
													}
												);
											}}
											activeOpacity={0.7}
											className='p-2'
										>
											<Ionicons
												name='ellipsis-horizontal'
												size={22}
												color='#8E8E93'
											/>
										</TouchableOpacity>
									</View>
								</View>
								{item.description && (
									<Text className='text-text-secondary text-sm mb-2'>
										{item.description}
									</Text>
								)}
								<View className='flex-row justify-between items-end mt-2'>
									{(item.targetWeight || item.currentWeight) && (
										<View className='flex-row gap-4'>
											{item.currentWeight && (
												<View>
													<Text className='text-text-secondary text-xs'>
														Current
													</Text>
													<Text className='text-text-primary font-semibold'>
														{item.currentWeight} kg
													</Text>
												</View>
											)}
											{item.targetWeight && (
												<View>
													<Text className='text-text-secondary text-xs'>
														Target
													</Text>
													<Text className='text-text-primary font-semibold'>
														{item.targetWeight} kg
													</Text>
												</View>
											)}
										</View>
									)}
								</View>
							</View>
						)}
					/>

					{/* Workouts Section */}
					{(sessionsWithWorkouts.upcoming.length > 0 || sessionsWithWorkouts.completed.length > 0) && (
						<View className='mt-6'>
							<Text className='text-2xl font-bold text-text-primary mb-4'>
								Workouts
							</Text>
							<Text className='text-text-secondary mb-4'>
								Exercises from your sessions
							</Text>

							{/* Upcoming Sessions with Workouts */}
							{sessionsWithWorkouts.upcoming.length > 0 && (
								<View className='mb-4'>
									<Text className='text-lg font-semibold text-text-primary mb-3'>
										Upcoming Sessions
									</Text>
									{sessionsWithWorkouts.upcoming.map((session: any) => {
										const exercises = parseWorkoutExercises(session.workoutType);
										if (exercises.length === 0) return null;
										return (
											<TouchableOpacity
												key={session.id}
												onPress={() => {
													setSelectedSession(session);
													setSelectedSessionLog(null);
													setShowWorkoutModal(true);
												}}
												className='bg-bg-primary rounded-xl p-4 mb-3 border border-[#F9C513]'
												style={{ borderWidth: 0.5 }}
											>
												<Text className='text-text-primary font-semibold text-base mb-2'>
													{session.name}
												</Text>
												<View className='flex-row items-center mb-2'>
													<Ionicons name='calendar' size={14} color='#8E8E93' />
													<Text className='text-text-secondary text-sm ml-1'>
														{new Date(session.date).toLocaleDateString('en-US', {
															month: 'short',
															day: 'numeric',
															year: 'numeric',
														})}
													</Text>
												</View>
												<View className='flex-row items-center'>
													<Ionicons name='barbell' size={14} color='#F9C513' />
													<Text className='text-[#F9C513] text-sm ml-1 font-semibold'>
														{exercises.length} Exercise{exercises.length !== 1 ? 's' : ''}
													</Text>
												</View>
											</TouchableOpacity>
										);
									})}
								</View>
							)}

							{/* Recent Completed Sessions with Workouts */}
							{sessionsWithWorkouts.completed.length > 0 && (
								<View>
									<Text className='text-lg font-semibold text-text-primary mb-3'>
										Recent Sessions
									</Text>
									{sessionsWithWorkouts.completed.map((log: any) => {
										const exercises = parseWorkoutExercises(log.session?.workoutType);
										if (exercises.length === 0) return null;
										return (
											<TouchableOpacity
												key={log.id}
												onPress={() => {
													setSelectedSession(log.session);
													setSelectedSessionLog(log);
													setShowWorkoutModal(true);
												}}
												className='bg-bg-primary rounded-xl p-4 mb-3 border border-[#F9C513]'
												style={{ borderWidth: 0.5 }}
											>
												<Text className='text-text-primary font-semibold text-base mb-2'>
													{log.session?.name || 'Session'}
												</Text>
												<View className='flex-row items-center mb-2'>
													<Ionicons name='checkmark-circle' size={14} color='#4CAF50' />
													<Text className='text-text-secondary text-sm ml-1'>
														Completed{' '}
														{log.completedAt
															? new Date(log.completedAt).toLocaleDateString('en-US', {
																	month: 'short',
																	day: 'numeric',
																})
															: ''}
													</Text>
												</View>
												<View className='flex-row items-center'>
													<Ionicons name='barbell' size={14} color='#F9C513' />
													<Text className='text-[#F9C513] text-sm ml-1 font-semibold'>
														{exercises.length} Exercise{exercises.length !== 1 ? 's' : ''}
													</Text>
												</View>
											</TouchableOpacity>
										);
									})}
								</View>
							)}
						</View>
					)}
					</>
				)}
			</ScrollView>

			{/* Create/Edit Goal Modal */}
			<Modal
				visible={showCreateModal}
				animationType='slide'
				transparent={false}
				onRequestClose={() => {
					setShowCreateModal(false);
					resetForm();
				}}
			>
				<View className='flex-1 bg-bg-darker justify-end'>
					<View
						className='rounded-t-3xl p-6 max-h-[90%] border-t border-[#F9C513]/30'
						style={{
							backgroundColor: 'rgba(28, 28, 30, 0.98)',
							borderTopWidth: 1,
							shadowColor: '#000',
							shadowOffset: { width: 0, height: -4 },
							shadowOpacity: 0.3,
							shadowRadius: 12,
							elevation: 10,
						}}
					>
						<ScrollView showsVerticalScrollIndicator={false}>
							<View className='flex-row justify-between items-center mb-6'>
								<Text className='text-2xl font-bold text-text-primary'>
									Create Goal
								</Text>
								<TouchableOpacity
									onPress={() => {
										setShowCreateModal(false);
										resetForm();
									}}
								>
									<Ionicons name='close' size={28} color='#8E8E93' />
								</TouchableOpacity>
							</View>

							<View className='mb-5'>
								<Text className='text-text-primary text-sm font-medium mb-2'>
									Goal Type *
								</Text>
								<View className='flex-row flex-wrap gap-2'>
									{goalTypeOptions.map((option) => {
										const isSelected = selectedGoalTypes.includes(option.value);
										return (
											<TouchableOpacity
												key={option.value}
												activeOpacity={0.7}
												onPress={() => {
													setErrors({ ...errors, goalType: '' });
													setSelectedGoalTypes((prev) => {
														if (prev.includes(option.value)) {
															return prev.filter((v) => v !== option.value);
														}
														return [...prev, option.value];
													});
												}}
												className={`px-3 py-2 rounded-full border ${
													isSelected
														? 'bg-[#F9C513]/15 border-[#F9C513]'
														: 'bg-input border-input'
												}`}
											>
												<Text
													className={`text-xs font-semibold ${
														isSelected ? 'text-[#F9C513]' : 'text-text-secondary'
													}`}
												>
													{option.label}
												</Text>
											</TouchableOpacity>
										);
									})}
								</View>
								{errors.goalType ? (
									<Text className='text-red-500 text-sm mt-1'>
										{errors.goalType}
									</Text>
								) : (
									<Text className='text-text-secondary text-[11px] mt-1'>
										Weight loss / muscle building: after you enter both weights,
										your target date is calculated. Other goal types get a date as
										soon as you pick them (uses profile body type).
									</Text>
								)}
							</View>

							<Input
								label='Title *'
								placeholder='e.g., Lose 10kg in 3 months'
								value={title}
								onChangeText={(text) => {
									setTitle(text);
									setErrors({ ...errors, title: '' });
								}}
								error={errors.title}
							/>

							<Input
								label='Description (optional)'
								placeholder='Describe your goal...'
								value={description}
								onChangeText={setDescription}
								multiline
								numberOfLines={3}
							/>

							{selectedGoalTypes.some(
								(type) => type === 'WEIGHT_LOSS' || type === 'MUSCLE_BUILDING',
							) && (
								<>
									<Input
										label='Current Weight (kg) *'
										placeholder='Enter current weight'
										value={currentWeight}
										onChangeText={(text) => {
											setCurrentWeight(text);
											setErrors({ ...errors, currentWeight: '' });
										}}
										keyboardType='decimal-pad'
										error={errors.currentWeight}
									/>

									<Input
										label='Target Weight (kg) *'
										placeholder='Enter target weight'
										value={targetWeight}
										onChangeText={(text) => {
											setTargetWeight(text);
											setErrors({ ...errors, targetWeight: '' });
										}}
										keyboardType='decimal-pad'
										error={errors.targetWeight}
									/>
								</>
							)}

							<View className='mb-4'>
								<Text className='text-text-secondary text-sm font-medium mb-2'>
									Target date *
								</Text>
								<View
									className={`rounded-lg p-4 border bg-input ${
										errors.targetDate ? 'border-red-500' : 'border-input'
									}`}
								>
									<Text
										className={`text-base ${
											showTargetDateEstimating || !targetDate
												? 'text-placeholder'
												: 'text-text-primary'
										}`}
									>
										{selectedGoalTypes.length === 0
											? 'Select at least one goal type'
											: showTargetDateEstimating
												? 'Estimating...'
												: targetDate
													? targetDate.toLocaleDateString('en-US', {
															weekday: 'long',
															year: 'numeric',
															month: 'long',
															day: 'numeric',
														})
													: '—'}
									</Text>
								</View>
								{errors.targetDate ? (
									<Text className='text-red-500 text-sm mt-1'>{errors.targetDate}</Text>
								) : showTargetDateEstimating ? (
									<Text className='text-text-secondary text-[11px] mt-1'>
										Enter valid current and target weight (kg) to calculate your
										target date.
									</Text>
								) : (
									<Text className='text-text-secondary text-[11px] mt-1'>
										Based on goal type, your body type (profile), and weight
										difference when applicable. Update profile or weights to refine
										it.
									</Text>
								)}
							</View>

							<GradientButton
								onPress={handleSubmit}
								loading={creating}
								className='mt-4'
							>
								{creating ? 'Creating...' : 'Create Goal'}
							</GradientButton>
						</ScrollView>
					</View>
				</View>
			</Modal>

			{/* Goal Deleted Success Modal */}
			<ConfirmModal
				visible={showDeleteSuccess}
				title="Goal Deleted"
				message="The goal was deleted successfully."
				variant="success"
				confirmLabel="Done"
				onConfirm={() => setShowDeleteSuccess(false)}
				onCancel={() => setShowDeleteSuccess(false)}
				hideCancel
			/>

			{/* Goal Created Success Modal */}
			<ConfirmModal
				visible={showCreateSuccess}
				title="Goal Created"
				message="Your goal was created successfully."
				variant="success"
				confirmLabel="Done"
				onConfirm={() => setShowCreateSuccess(false)}
				onCancel={() => setShowCreateSuccess(false)}
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

			{/* Goal options dropdown - positioned near 3-dots */}
			<Modal
				visible={!!goalMenuOpen && !!menuPosition}
				transparent
				animationType='fade'
				onRequestClose={() => {
					setGoalMenuOpen(null);
					setMenuPosition(null);
				}}
			>
				<TouchableOpacity
					activeOpacity={1}
					className='flex-1 bg-black/30'
					onPress={() => {
						setGoalMenuOpen(null);
						setMenuPosition(null);
					}}
				>
					{menuPosition && (
						<View
							style={{
								position: 'absolute',
								left: menuPosition.x,
								top: menuPosition.y,
								width: menuWidth,
								backgroundColor: 'rgba(28, 28, 30, 0.98)',
								borderRadius: 12,
								borderWidth: 1,
								borderColor: 'rgba(249, 197, 19, 0.3)',
								overflow: 'hidden',
								shadowColor: '#000',
								shadowOffset: { width: 0, height: 4 },
								shadowOpacity: 0.35,
								shadowRadius: 8,
								elevation: 8,
							}}
						>
							<TouchableOpacity
								onPress={() => {
									if (goalMenuOpen) {
										setSelectedGoal(goalMenuOpen);
										setShowWeightChart(true);
									}
									setGoalMenuOpen(null);
									setMenuPosition(null);
								}}
								activeOpacity={0.7}
								className='flex-row items-center px-4 py-3 border-b border-bg-darker/50'
							>
								<Ionicons name='stats-chart-outline' size={20} color='#F9C513' />
								<Text className='text-text-primary font-medium ml-3'>View</Text>
							</TouchableOpacity>
							{goalMenuOpen && !goalMenuOpen.coachId && (
								<TouchableOpacity
									onPress={() => {
										if (goalMenuOpen) {
											setGoalToDelete(goalMenuOpen);
										}
										setGoalMenuOpen(null);
										setMenuPosition(null);
									}}
									activeOpacity={0.7}
									className='flex-row items-center px-4 py-3'
								>
									<Ionicons name='trash-outline' size={20} color='#EF4444' />
									<Text className='text-red-400 font-medium ml-3'>Delete</Text>
								</TouchableOpacity>
							)}
						</View>
					)}
				</TouchableOpacity>
			</Modal>

			{/* Delete Goal confirmation modal */}
			<Modal
				visible={!!goalToDelete}
				transparent
				animationType='fade'
				onRequestClose={() => setGoalToDelete(null)}
			>
				<TouchableOpacity
					activeOpacity={1}
					className='flex-1 bg-black/50 justify-center items-center px-6'
					onPress={() => setGoalToDelete(null)}
				>
					<TouchableOpacity
						activeOpacity={1}
						className='rounded-2xl p-6 w-full max-w-sm border border-[#F9C513]/30'
						style={{
							backgroundColor: 'rgba(28, 28, 30, 0.98)',
							borderWidth: 1,
							shadowColor: '#000',
							shadowOffset: { width: 0, height: 4 },
							shadowOpacity: 0.4,
							shadowRadius: 12,
							elevation: 10,
						}}
						onPress={(e) => e.stopPropagation()}
					>
						<View className='items-center mb-4'>
							<View className='bg-red-500/20 rounded-full p-4 mb-3 border border-red-500/40'>
								<Ionicons name='trash-outline' size={32} color='#EF4444' />
							</View>
							<Text className='text-text-primary font-bold text-xl'>
								Delete Goal
							</Text>
							<Text className='text-text-secondary text-center mt-2 text-sm'>
								Are you sure? This goal cannot be recovered.
							</Text>
						</View>
						<View className='flex-row gap-3'>
							<GradientButton
								variant='secondary'
								className='flex-1'
								onPress={() => setGoalToDelete(null)}
							>
								Cancel
							</GradientButton>
							<TouchableOpacity
								activeOpacity={0.7}
								onPress={() => {
									if (goalToDelete) {
										deleteGoal({ variables: { id: goalToDelete.id } });
										setGoalToDelete(null);
									}
								}}
								className='flex-1 bg-red-500/20 border border-red-500/50 rounded-xl py-3 items-center justify-center'
							>
								<Text className='text-red-400 font-semibold'>Delete</Text>
							</TouchableOpacity>
						</View>
					</TouchableOpacity>
				</TouchableOpacity>
			</Modal>

			{/* Weight Chart Modal */}
			<Modal
				visible={showWeightChart}
				animationType='slide'
				transparent={false}
				onRequestClose={() => {
					setShowWeightChart(false);
					setSelectedGoal(null);
				}}
			>
				<View className='flex-1 bg-bg-darker justify-center px-5'>
					<View
						className='rounded-2xl p-6 max-h-[80%] border border-[#F9C513]/30'
						style={{
							backgroundColor: 'rgba(28, 28, 30, 0.98)',
							borderWidth: 1,
							shadowColor: '#000',
							shadowOffset: { width: 0, height: 4 },
							shadowOpacity: 0.4,
							shadowRadius: 12,
							elevation: 10,
						}}
					>
						<View className='flex-row justify-between items-center mb-4'>
							<Text className='text-2xl font-bold text-text-primary'>
								{selectedGoal?.title}
							</Text>
							<TouchableOpacity
								onPress={() => {
									setShowWeightChart(false);
									setSelectedGoal(null);
								}}
							>
								<Ionicons name='close' size={28} color='#8E8E93' />
							</TouchableOpacity>
						</View>
						<ScrollView>
							{renderWeightChart()}

							{(selectedGoal?.coachId || mySessionRatingsList.length > 0) && (
								<View className='mt-6'>
									<Text className='text-xl font-bold text-text-primary mb-4'>
										Your session feedback to coach
									</Text>
									{mySessionRatingsList.length > 0 ? (
										mySessionRatingsList.map((mr: any) => (
											<View
												key={mr.id}
												className='bg-bg-darker rounded-xl p-4 mb-3 border border-[#F9C513]'
												style={{ borderWidth: 0.5 }}
											>
												<Text className='text-text-primary font-semibold text-base mb-1'>
													{mr.sessionLog?.session?.name || 'Session'}
												</Text>
												{mr.sessionLog?.session?.date ? (
													<Text className='text-text-secondary text-xs mb-2'>
														{new Date(mr.sessionLog.session.date).toLocaleDateString(
															'en-US',
															{ month: 'short', day: 'numeric', year: 'numeric' }
														)}
													</Text>
												) : null}
												{mr.coach ? (
													<Text className='text-text-secondary text-sm mb-2'>
														Coach {mr.coach.firstName} {mr.coach.lastName}
													</Text>
												) : null}
												{mr.sessionLog?.weight != null ? (
													<Text className='text-text-secondary text-sm mb-2'>
														Weight logged:{' '}
														<Text className='text-text-primary font-semibold'>
															{mr.sessionLog.weight} kg
														</Text>
													</Text>
												) : null}
												<View className='flex-row items-center mb-2'>
													<Text className='text-text-secondary text-sm mr-2'>
														Your rating:
													</Text>
													<View className='flex-row items-center'>
														{Array.from({ length: 5 }).map((_, index) => (
															<Ionicons
																key={index}
																name={index < (mr.rating || 0) ? 'star' : 'star-outline'}
																size={16}
																color='#F9C513'
															/>
														))}
														<Text className='text-text-primary font-semibold ml-2'>
															{mr.rating}/5
														</Text>
													</View>
												</View>
												{mr.comment ? (
													<View className='mt-1'>
														<Text className='text-text-secondary text-xs mb-1'>
															Your comment
														</Text>
														<Text className='text-text-primary text-sm'>{mr.comment}</Text>
													</View>
												) : null}
											</View>
										))
									) : (
										<View
											className='items-center justify-center py-6 bg-bg-darker rounded-xl border border-[#F9C513]'
											style={{ borderWidth: 0.5 }}
										>
											<Text className='text-text-secondary text-center text-sm px-2'>
												No coach ratings submitted yet for sessions linked to this goal.
											</Text>
										</View>
									)}
								</View>
							)}
							
							{/* Progress Ratings Section */}
							{selectedGoal?.coachId && (
								<View className='mt-6'>
									<Text className='text-xl font-bold text-text-primary mb-4'>
										Coach rate progress
									</Text>
									{ratingsData?.getProgressRatings &&
									ratingsData.getProgressRatings.length > 0 ? (
										ratingsData.getProgressRatings.map((rating: any) => {
											const startDate = new Date(rating.startDate);
											const endDate = new Date(rating.endDate);
											const verdictLabels: Record<string, string> = {
												PROGRESSIVE: 'Progressive',
												CLOSE_TO_ACHIEVEMENT: 'Close to Achievement',
												ACHIEVED: 'Achieved',
												REGRESSING: 'Regressing',
											};
											const verdictColors: Record<string, string> = {
												PROGRESSIVE: '#10B981', // green
												CLOSE_TO_ACHIEVEMENT: '#F59E0B', // amber
												ACHIEVED: '#3B82F6', // blue
												REGRESSING: '#EF4444', // red
											};

											return (
												<View
													key={rating.id}
													className='bg-bg-darker rounded-xl p-4 mb-3 border border-[#F9C513]'
													style={{ borderWidth: 0.5 }}
												>
													<View className='flex-row justify-between items-start mb-2'>
														<View className='flex-1'>
															<Text className='text-text-primary font-semibold text-base mb-1'>
																{startDate.toLocaleDateString()} -{' '}
																{endDate.toLocaleDateString()}
															</Text>
															{rating.coach && (
																<Text className='text-text-secondary text-sm'>
																	By Coach {rating.coach.firstName}{' '}
																	{rating.coach.lastName}
																</Text>
															)}
														</View>
														<View
															className='px-3 py-1 rounded-full'
															style={{
																backgroundColor:
																	verdictColors[progressVerdictKey(rating.verdict)] ||
																	'#8E8E93',
															}}
														>
															<Text className='text-white text-xs font-semibold'>
																{verdictLabels[progressVerdictKey(rating.verdict)] ||
																	rating.verdict}
															</Text>
														</View>
													</View>

													<View className='flex-row items-center mb-2'>
														<Text className='text-text-secondary text-sm mr-2'>
															Rating:
														</Text>
														<View className='flex-row items-center'>
															{Array.from({ length: 10 }).map((_, index) => (
																<Ionicons
																	key={index}
																	name={
																		index < rating.rating
																			? 'star'
																			: 'star-outline'
																	}
																	size={16}
																	color='#F9C513'
																/>
															))}
															<Text className='text-text-primary font-semibold ml-2'>
																{rating.rating}/10
															</Text>
														</View>
													</View>

													{rating.comment && (
														<View className='mt-2'>
															<Text className='text-text-secondary text-xs mb-1'>
																Comment:
															</Text>
															<Text className='text-text-primary text-sm'>
																{rating.comment}
															</Text>
														</View>
													)}

													<Text className='text-text-secondary text-xs mt-2'>
														Created:{' '}
														{new Date(rating.createdAt).toLocaleDateString()}
													</Text>
												</View>
											);
										})
									) : (
										<View className='items-center justify-center py-8 bg-bg-darker rounded-xl border border-[#F9C513]' style={{ borderWidth: 0.5 }}>
											<Ionicons name='star-outline' size={48} color='#8E8E93' />
											<Text className='text-text-secondary mt-4 text-center text-base'>
												No ratings yet
											</Text>
											<Text className='text-text-secondary mt-2 text-center text-sm'>
												Your coach hasn&apos;t rated your progress for this goal yet
											</Text>
										</View>
									)}
								</View>
							)}
						</ScrollView>
					</View>
				</View>
			</Modal>

			{/* Workout Exercises Modal */}
			<Modal
				visible={showWorkoutModal}
				animationType='slide'
				transparent={false}
				onRequestClose={() => {
					setShowWorkoutModal(false);
					setSelectedSession(null);
					setSelectedSessionLog(null);
				}}
			>
				<View className='flex-1 bg-bg-darker justify-center px-5'>
					<View
						className='rounded-2xl p-6 max-h-[80%] border border-[#F9C513]/30'
						style={{
							backgroundColor: 'rgba(28, 28, 30, 0.98)',
							borderWidth: 1,
							shadowColor: '#000',
							shadowOffset: { width: 0, height: 4 },
							shadowOpacity: 0.4,
							shadowRadius: 12,
							elevation: 10,
						}}
					>
						<View className='flex-row justify-between items-center mb-4'>
							<View className='flex-1'>
								<Text className='text-2xl font-bold text-text-primary'>
									{selectedSession?.name || 'Workout Exercises'}
								</Text>
								{selectedSession?.date && (
									<Text className='text-text-secondary text-sm mt-1'>
										{new Date(selectedSession.date).toLocaleDateString('en-US', {
											month: 'long',
											day: 'numeric',
											year: 'numeric',
										})}
									</Text>
								)}
								{selectedSessionLog ? (
									<Text className='text-[#F9C513] text-xs font-semibold mt-2'>
										Completed session — progress & ratings
									</Text>
								) : null}
							</View>
							<TouchableOpacity
								onPress={() => {
									setShowWorkoutModal(false);
									setSelectedSession(null);
									setSelectedSessionLog(null);
								}}
							>
								<Ionicons name='close' size={28} color='#8E8E93' />
							</TouchableOpacity>
						</View>
						<ScrollView showsVerticalScrollIndicator={false}>
							{selectedSessionLog ? (
								<View className='mb-6'>
									<Text className='text-lg font-semibold text-text-primary mb-3'>
										Session progress
									</Text>
									<View
										className='bg-bg-darker rounded-xl p-4 mb-6 border border-[#F9C513]'
										style={{ borderWidth: 0.5 }}
									>
										{selectedSessionLog.completedAt ? (
											<View className='mb-3'>
												<Text className='text-text-secondary text-xs mb-1'>Completed</Text>
												<Text className='text-text-primary font-semibold'>
													{new Date(selectedSessionLog.completedAt).toLocaleString('en-US', {
														month: 'short',
														day: 'numeric',
														year: 'numeric',
														hour: 'numeric',
														minute: '2-digit',
													})}
												</Text>
											</View>
										) : null}
										{selectedSessionLog.weight != null ? (
											<View className='mb-3'>
												<Text className='text-text-secondary text-xs mb-1'>
													Weight at this session
												</Text>
												<Text className='text-text-primary font-semibold text-lg'>
													{selectedSessionLog.weight} kg
												</Text>
											</View>
										) : null}
										{selectedSessionLog.session?.goal ? (
											<View>
												<Text className='text-text-secondary text-xs mb-2'>
													Goal: {selectedSessionLog.session.goal.title}
												</Text>
												{formatKgDisplay(selectedSessionLog.session.goal.currentWeight) ? (
													<Text className='text-text-primary text-sm mb-1'>
														Starting weight (goal):{' '}
														<Text className='font-bold text-[#F9C513]'>
															{formatKgDisplay(selectedSessionLog.session.goal.currentWeight)}{' '}
															kg
														</Text>
													</Text>
												) : null}
												{formatKgDisplay(selectedSessionLog.session.goal.targetWeight) ? (
													<Text className='text-text-primary text-sm mb-1'>
														Target:{' '}
														<Text className='font-semibold text-text-primary'>
															{formatKgDisplay(selectedSessionLog.session.goal.targetWeight)} kg
														</Text>
													</Text>
												) : null}
												{selectedSessionLog.weight != null &&
												selectedSessionLog.session.goal.currentWeight != null ? (
													<Text className='text-text-secondary text-sm mt-2'>
														vs goal start:{' '}
														{(() => {
															const delta =
																Math.round(
																	(Number(selectedSessionLog.weight) -
																		Number(selectedSessionLog.session.goal.currentWeight)) *
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

									<Text className='text-lg font-semibold text-text-primary mb-3'>
										Your feedback to coach
									</Text>
									<View
										className='bg-bg-darker rounded-xl p-4 mb-6 border border-[#F9C513]'
										style={{ borderWidth: 0.5 }}
									>
										{memberCoachRatingForLog ? (
											<View>
												{memberCoachRatingForLog.coach ? (
													<Text className='text-text-secondary text-sm mb-2'>
														{memberCoachRatingForLog.coach.firstName}{' '}
														{memberCoachRatingForLog.coach.lastName}
													</Text>
												) : null}
												<View className='flex-row items-center mb-2'>
													<View className='flex-row items-center'>
														{Array.from({ length: 5 }).map((_, index) => (
															<Ionicons
																key={index}
																name={
																	index < (memberCoachRatingForLog.rating || 0)
																		? 'star'
																		: 'star-outline'
																}
																size={18}
																color='#F9C513'
															/>
														))}
														<Text className='text-text-primary font-semibold ml-2'>
															{memberCoachRatingForLog.rating}/5
														</Text>
													</View>
												</View>
												{memberCoachRatingForLog.comment ? (
													<View className='mt-2'>
														<Text className='text-text-secondary text-xs mb-1'>
															Your comment
														</Text>
														<Text className='text-text-primary text-sm'>
															{memberCoachRatingForLog.comment}
														</Text>
													</View>
												) : null}
											</View>
										) : (
											<Text className='text-text-secondary text-sm'>
												No coach rating submitted for this session yet. If you just finished it,
												submit your feedback from Schedule after completing the session.
											</Text>
										)}
									</View>

									<Text className='text-lg font-semibold text-text-primary mb-3'>
										Coach rate progress (this session)
									</Text>
									{recapRatingsForLog.length > 0 ? (
										recapRatingsForLog.map((rating: any) => {
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
														<View className='flex-1'>
															<Text className='text-text-primary font-semibold text-base mb-1'>
																{startDate.toLocaleDateString()} —{' '}
																{endDate.toLocaleDateString()}
															</Text>
															{rating.coach ? (
																<Text className='text-text-secondary text-sm'>
																	Coach {rating.coach.firstName} {rating.coach.lastName}
																</Text>
															) : null}
														</View>
														<View
															className='px-3 py-1 rounded-full'
															style={{ backgroundColor: vColors[vk] || '#8E8E93' }}
														>
															<Text className='text-white text-xs font-semibold'>
																{vLabels[vk] || rating.verdict}
															</Text>
														</View>
													</View>
													<View className='flex-row items-center mb-2'>
														<Text className='text-text-secondary text-sm mr-2'>Rating:</Text>
														<View className='flex-row items-center'>
															{Array.from({ length: 10 }).map((_, index) => (
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
																{rating.rating}/10
															</Text>
														</View>
													</View>
													{rating.comment ? (
														<View className='mt-2'>
															<Text className='text-text-secondary text-xs mb-1'>
																Coach comment
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
											className='bg-bg-darker rounded-xl p-4 mb-6 border border-[#F9C513]'
											style={{ borderWidth: 0.5 }}
										>
											<Text className='text-text-secondary text-sm'>
												No coach progress rating yet that includes this session.
											</Text>
										</View>
									)}

									<Text className='text-lg font-semibold text-text-primary mb-3'>
										Workout exercises
									</Text>
								</View>
							) : null}
							{(() => {
								const exercises = parseWorkoutExercises(selectedSession?.workoutType);
								if (exercises.length === 0) {
									return (
										<View className='items-center justify-center py-10'>
											<Text className='text-text-secondary'>
												No exercises found for this session
											</Text>
										</View>
									);
								}
								
								return (
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
																		name='target'
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
								);
							})()}
						</ScrollView>
					</View>
				</View>
			</Modal>
		</FixedView>
	);
};

export default MemberProgress;
