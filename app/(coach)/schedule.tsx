import { PremiumLoadingContent } from '@/components/AuthProcessingScreen';
import { CoachScheduleCalendar } from '@/components/CoachScheduleCalendar';
import { ScheduleDayAttendancePanel } from '@/components/ScheduleDayAttendancePanel';
import DatePicker from '@/components/DatePicker';
import FixedView from '@/components/FixedView';
import ConfirmModal from '@/components/ConfirmModal';
import GradientButton from '@/components/GradientButton';
import Input from '@/components/Input';
import Select from '@/components/Select';
import TabHeader from '@/components/TabHeader';
import TimePicker from '@/components/TimePicker';
import {
	getGymMinutesBoundsForWeekday,
	getGymMinutesBoundsNoReferenceDate,
} from '@/constants/gym-hours';
import { useAuth } from '@/contexts/AuthContext';
import {
	ASSIGN_COACH_TO_GOAL_MUTATION,
	CANCEL_SESSION_MUTATION,
	COACH_RESPOND_JOIN_REQUEST_MUTATION,
	CREATE_SESSION_FROM_TEMPLATE_MUTATION,
	CREATE_SESSION_MUTATION,
	INVITE_CLIENTS_TO_CLASS_MUTATION,
	REMOVE_CLIENT_FROM_CLASS_SESSION_MUTATION,
} from '@/graphql/mutations';
import {
	GET_ALL_CLIENT_GOALS_QUERY,
	GET_COACH_SESSION_LOGS_QUERY,
	GET_COACH_SESSIONS_QUERY,
	GET_SESSION_LOG_BY_SESSION_ID_QUERY,
	GET_ATTENDANCE_RECORDS_QUERY,
	GET_SESSION_TEMPLATES_QUERY,
	GET_USERS_QUERY,
} from '@/graphql/queries';
import {
	formatMinutesAs12hClock,
	formatTimeRangeTo12Hour,
	formatTimeTo12Hour,
	intersectMinuteBounds,
	minutesOfDayFromDate,
	preferredWorkoutMinuteBoundsForUsers,
} from '@/utils/time-utils';
import {
	attendanceQueryDateRange,
	buildAttendanceDaySet,
} from '@/utils/attendanceCalendar';
import { useMutation, useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	ActivityIndicator,
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

function normalizeInviteSearchText(s: string) {
	return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function memberMatchesInviteSearch(c: any, rawQuery: string) {
	const q = normalizeInviteSearchText(rawQuery);
	if (!q) return true;
	const fn = normalizeInviteSearchText(String(c.firstName ?? ''));
	const mn = normalizeInviteSearchText(String(c.middleName ?? ''));
	const ln = normalizeInviteSearchText(String(c.lastName ?? ''));
	const em = normalizeInviteSearchText(String(c.email ?? ''));
	const phoneDigits = String(c.phoneNumber ?? '').replace(/\D/g, '');
	const fullName = [fn, mn, ln].filter(Boolean).join(' ');
	const tokens = q.split(' ').filter(Boolean);
	return tokens.every((t) => {
		const td = t.replace(/\D/g, '');
		if (em.includes(t)) return true;
		if (td.length >= 3 && phoneDigits.includes(td)) return true;
		if (fullName.includes(t)) return true;
		return fn.includes(t) || ln.includes(t) || mn.includes(t);
	});
}

const ROSTER_SECTION_PREVIEW = 5;
const ROSTER_INVITE_PREVIEW = 6;
const ROSTER_LIST_MAX_HEIGHT = 240;

const gymAreas = [
	{ label: 'Main Training Area', value: 'Main Training Area' },
	{ label: 'Cardio Zone', value: 'Cardio Zone' },
	{ label: 'Free Weights Area', value: 'Free Weights Area' },
];

/** Send session calendar day without local-midnight → UTC day-shift (API uses new Date(iso)). */
function sessionCalendarDateToIso(d: Date): string {
	const y = d.getFullYear();
	const m = d.getMonth();
	const day = d.getDate();
	return new Date(Date.UTC(y, m, day, 12, 0, 0, 0)).toISOString();
}

function parseScheduleDayToLocalDate(key: string): Date | undefined {
	const parts = key.split('-').map((n) => parseInt(n, 10));
	if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return undefined;
	return new Date(parts[0], parts[1] - 1, parts[2]);
}

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

const CoachSchedule = () => {
	const { user } = useAuth();
	const router = useRouter();
	const [refreshing, setRefreshing] = useState(false);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showGoalsModal, setShowGoalsModal] = useState(false);
	const [showTemplatesModal, setShowTemplatesModal] = useState(false);
	const [selectedClients, setSelectedClients] = useState<string[]>([]);
	const [sessionName, setSessionName] = useState('');
	const [date, setDate] = useState<Date | undefined>();
	const [startTime, setStartTime] = useState<Date | undefined>();
	const [endTime, setEndTime] = useState<Date | undefined>();
	const [gymArea, setGymArea] = useState('');
	const [note, setNote] = useState('');
	const [isTemplate, setIsTemplate] = useState(false);
	const [isGroupClass, setIsGroupClass] = useState(false);
	const [maxParticipants, setMaxParticipants] = useState('20');
	const [classManageSession, setClassManageSession] = useState<any>(null);
	const classManageSessionIdRef = useRef<string | null>(null);
	const [invitePickClients, setInvitePickClients] = useState<string[]>([]);
	const [classRosterInviteSearch, setClassRosterInviteSearch] = useState('');
	const [rosterExpandRequests, setRosterExpandRequests] = useState(true);
	const [rosterExpandRoster, setRosterExpandRoster] = useState(true);
	const [rosterExpandInvited, setRosterExpandInvited] = useState(true);
	const [rosterMorePending, setRosterMorePending] = useState(false);
	const [rosterMoreConfirmed, setRosterMoreConfirmed] = useState(false);
	const [rosterMoreInvited, setRosterMoreInvited] = useState(false);
	const [rosterMoreInviteList, setRosterMoreInviteList] = useState(false);
	const [rosterConfirmedSearch, setRosterConfirmedSearch] = useState('');
	/** `${clientId}:accept` | `${clientId}:reject` while coach join response is in flight */
	const [pendingCoachJoinKey, setPendingCoachJoinKey] = useState<string | null>(null);
	const [removeRosterMember, setRemoveRosterMember] = useState<{
		id: string;
		name: string;
	} | null>(null);
	const [selectedGoalId, setSelectedGoalId] = useState<string>('');
	const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [templatesExpanded, setTemplatesExpanded] = useState(false);
	const [showProgressImagesModal, setShowProgressImagesModal] = useState(false);
	const [selectedSessionForProgress, setSelectedSessionForProgress] =
		useState<any>(null);
	const [selectedScheduleDay, setSelectedScheduleDay] = useState(() =>
		localDateKeyFromDate(new Date())
	);
	const [scheduleListUpcoming, setScheduleListUpcoming] = useState(false);

	const SESSION_DEFAULT_DURATION_MINUTES = 60;

	const [showCreateSessionSuccess, setShowCreateSessionSuccess] = useState(false);
	const [showTemplateSessionSuccess, setShowTemplateSessionSuccess] =
		useState(false);
	const [sessionToCancel, setSessionToCancel] = useState<any>(null);
	const [alertModal, setAlertModal] = useState<{
		visible: boolean;
		title: string;
		message: string;
		variant: 'danger' | 'neutral' | 'success' | 'warning';
	}>({ visible: false, title: '', message: '', variant: 'neutral' });

	// Workout selection states
	const [showWorkoutModal, setShowWorkoutModal] = useState(false);
	const [wasCreateModalOpen, setWasCreateModalOpen] = useState(false);
	const [exercises, setExercises] = useState<any[]>([]);
	const [filteredExercises, setFilteredExercises] = useState<any[]>([]);
	const [categories, setCategories] = useState<string[]>([]);
	const [selectedCategory, setSelectedCategory] = useState<string>('all');
	const [searchWorkout, setSearchWorkout] = useState('');
	const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(false);
	const [selectedWorkouts, setSelectedWorkouts] = useState<
		{
			id: string;
			name: string;
			bodyPart: string;
			target: string;
			equipment?: string;
			gifUrl: string;
			sets: string;
			reps: string;
		}[]
	>([]);
	const [preferredTimeLabel, setPreferredTimeLabel] = useState<string | null>(
		null
	);

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

	const fetchExercisesByCategory = useCallback(
		async (bodyPart: string) => {
			if (!apiKey) return;
			try {
				setIsLoadingWorkouts(true);
				let url: string;
				if (bodyPart === 'all') {
					url = 'https://exercisedb.p.rapidapi.com/exercises?limit=60&offset=0';
				} else {
					const encoded = encodeURIComponent(bodyPart);
					url = `https://exercisedb.p.rapidapi.com/exercises/bodyPart/${encoded}?limit=60&offset=0`;
				}

				const response = await fetch(url, {
					method: 'GET',
					headers: {
						'X-RapidAPI-Key': apiKey as string,
						'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
					},
				});

				if (!response.ok) {
					throw new Error(`Failed to load workouts (${response.status})`);
				}

				const data = await response.json();
				setExercises(data);
				setFilteredExercises(data);
			} catch (err: any) {
				setAlertModal({
					visible: true,
					title: 'Error',
					message: err?.message ?? 'Unable to load workouts right now. Please try again later.',
					variant: 'danger',
				});
			} finally {
				setIsLoadingWorkouts(false);
			}
		},
		[apiKey]
	);

	useEffect(() => {
		if (!showWorkoutModal || !apiKey) return;

		const fetchCategoriesAndInitialExercises = async () => {
			try {
				setIsLoadingWorkouts(true);
				const categoriesResponse = await fetch(
					'https://exercisedb.p.rapidapi.com/exercises/bodyPartList',
					{
						method: 'GET',
						headers: {
							'X-RapidAPI-Key': apiKey as string,
							'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
						},
					}
				);

				if (!categoriesResponse.ok) {
					let bodyPreview = '';
					try {
						const text = await categoriesResponse.text();
						bodyPreview = text ? ` - ${text.slice(0, 180)}` : '';
					} catch {}
					throw new Error(
						`Failed to load workout categories (${categoriesResponse.status})${bodyPreview}`
					);
				}

				const categoriesData = await categoriesResponse.json();
				const normalizedCategories = categoriesData.map((c: string) =>
					c.toLowerCase()
				);
				setCategories(normalizedCategories);
				setSelectedCategory('all');
				await fetchExercisesByCategory('all');
			} catch (err: any) {
				setAlertModal({
					visible: true,
					title: 'Error',
					message: err?.message ?? 'Unable to load workouts right now. Please try again later.',
					variant: 'danger',
				});
			} finally {
				setIsLoadingWorkouts(false);
			}
		};

		void fetchCategoriesAndInitialExercises();
	}, [showWorkoutModal, apiKey, fetchExercisesByCategory]);

	useEffect(() => {
		if (!showWorkoutModal) return;

		const trimmed = searchWorkout.trim();
		if (!trimmed) {
			setFilteredExercises(exercises);
			return;
		}

		const q = trimmed.toLowerCase();
		setFilteredExercises(
			exercises.filter(
				(ex: any) =>
					ex.name.toLowerCase().includes(q) ||
					ex.bodyPart.toLowerCase().includes(q) ||
					ex.target.toLowerCase().includes(q)
			)
		);
	}, [searchWorkout, exercises, showWorkoutModal]);

	const { data: sessionsData, refetch } = useQuery(GET_COACH_SESSIONS_QUERY, {
		variables: { coachId: user?.id },
		fetchPolicy: 'cache-and-network',
		skip: !user?.id,
	});

	const { data: goalsData, refetch: refetchGoals } = useQuery(
		GET_ALL_CLIENT_GOALS_QUERY,
		{
			variables: { coachId: user?.id, status: 'active' },
			fetchPolicy: 'cache-and-network',
			skip: !user?.id,
		}
	);

	const { data: templatesData, refetch: refetchTemplates } = useQuery(
		GET_SESSION_TEMPLATES_QUERY,
		{
			variables: { coachId: user?.id },
			fetchPolicy: 'cache-and-network',
			skip: !user?.id,
		}
	);

	const { data: clientsData } = useQuery(GET_USERS_QUERY, {
		variables: { role: 'member' },
		fetchPolicy: 'cache-and-network',
	});

	const { data: sessionLogData, refetch: refetchSessionLog } = useQuery(
		GET_SESSION_LOG_BY_SESSION_ID_QUERY,
		{
			variables: { sessionId: selectedSessionForProgress?.id || '' },
			fetchPolicy: 'cache-and-network',
			skip: !selectedSessionForProgress?.id || !showProgressImagesModal,
		}
	);

	// Query all session logs to check which sessions have progress images
	const { data: allSessionLogsData } = useQuery(GET_COACH_SESSION_LOGS_QUERY, {
		variables: { coachId: user?.id || '' },
		fetchPolicy: 'cache-and-network',
		skip: !user?.id,
	});

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
				pagination: { limit: 500, offset: 0 },
			},
			skip: !user?.id || !attendanceId,
			fetchPolicy: 'cache-and-network',
		}
	);

	// Create a Set of session IDs that have progress images
	const sessionsWithProgressImages = useMemo(() => {
		const sessionIds = new Set<string>();
		if (allSessionLogsData?.getCoachSessionLogs) {
			(allSessionLogsData.getCoachSessionLogs as any[]).forEach((log: any) => {
				if (
					log.progressImages &&
					(log.progressImages.front ||
						log.progressImages.rightSide ||
						log.progressImages.leftSide ||
						log.progressImages.back)
				) {
					sessionIds.add(log.sessionId);
				}
			});
		}
		return sessionIds;
	}, [allSessionLogsData]);

	const assignableClientIds = useMemo(() => {
		const set = new Set<string>();
		const coachId = user?.id ? String(user.id) : '';
		(user?.coachDetails?.clientsIds || []).forEach((id: any) => {
			if (id != null && String(id) !== '') set.add(String(id));
		});
		if (clientsData?.getUsers && coachId) {
			for (const u of clientsData.getUsers) {
				const c = u as any;
				if (!c?.id || c.role !== 'member') continue;
				const coaches = c.membershipDetails?.coachesIds || [];
				if (coaches.some((x: any) => x != null && String(x) === coachId)) {
					set.add(String(c.id));
				}
			}
		}
		return set;
	}, [user?.id, user?.coachDetails?.clientsIds, clientsData]);

	const allClients = useMemo(() => {
		if (!clientsData?.getUsers) return [];
		return clientsData.getUsers.filter((client: any) => {
			if (!client?.id || client.role !== 'member') return false;
			return assignableClientIds.has(String(client.id));
		});
	}, [clientsData, assignableClientIds]);

	const allMemberUsers = useMemo(() => {
		if (!clientsData?.getUsers) return [];
		return clientsData.getUsers.filter(
			(c: any) => c?.id && c.role === 'member'
		);
	}, [clientsData]);

	const inviteBlockedIds = useMemo(() => {
		if (!classManageSession) return new Set<string>();
		const s = classManageSession;
		const blocked = new Set<string>();
		(s.clientsIds || []).forEach((id: any) => {
			if (id != null && String(id) !== '') blocked.add(String(id));
		});
		(s.clients || []).forEach((c: any) => {
			if (c?.id) blocked.add(String(c.id));
		});
		(s.enrollments || []).forEach((e: any) => {
			if (!['invited', 'pending', 'accepted'].includes(e.status)) return;
			const cid = e.clientId ?? e.client?.id;
			if (cid != null && String(cid) !== '') blocked.add(String(cid));
		});
		return blocked;
	}, [classManageSession]);

	const filteredInviteClients = useMemo(() => {
		const blocked = inviteBlockedIds;
		const qRaw = classRosterInviteSearch;
		const qNorm = normalizeInviteSearchText(qRaw);
		const notBlocked = (c: any) => !blocked.has(String(c.id));

		if (!qNorm) {
			return allClients.filter(notBlocked);
		}
		return allMemberUsers.filter(
			(c: any) => notBlocked(c) && memberMatchesInviteSearch(c, qRaw)
		);
	}, [allClients, allMemberUsers, inviteBlockedIds, classRosterInviteSearch]);

	useEffect(() => {
		if (!classManageSession?.id) return;
		const en = classManageSession.enrollments || [];
		const inv = en.filter((e: any) => e.status === 'invited').length;
		const conf = (classManageSession.clients || []).length;
		setRosterExpandRequests(true);
		setRosterExpandRoster(conf <= ROSTER_SECTION_PREVIEW);
		setRosterExpandInvited(inv <= ROSTER_SECTION_PREVIEW);
		setRosterMorePending(false);
		setRosterMoreConfirmed(false);
		setRosterMoreInvited(false);
		setRosterMoreInviteList(false);
	}, [classManageSession?.id]);

	useEffect(() => {
		if (user?.id) {
			refetch();
			refetchGoals();
			refetchTemplates();
		}
	}, [user?.id, refetch, refetchGoals, refetchTemplates]);

	const onRefresh = async () => {
		setRefreshing(true);
		try {
			if (user?.id) {
				const pulls = [refetch(), refetchGoals(), refetchTemplates()];
				if (attendanceId) pulls.push(refetchScheduleAttendance());
				await Promise.all(pulls);
			}
		} finally {
			setRefreshing(false);
		}
	};

	const [createSession, { loading: creating }] = useMutation(
		CREATE_SESSION_MUTATION,
		{
			onCompleted: () => {
				setShowCreateModal(false);
				resetForm();
				refetch();
				refetchTemplates();
				setShowCreateSessionSuccess(true);
			},
			onError: (error) => {
				setAlertModal({ visible: true, title: 'Error', message: error.message, variant: 'danger' });
			},
		}
	);

	const [createSessionFromTemplate, { loading: creatingFromTemplate }] =
		useMutation(CREATE_SESSION_FROM_TEMPLATE_MUTATION, {
			onCompleted: () => {
				setShowCreateModal(false);
				resetForm();
				refetch();
				setShowTemplateSessionSuccess(true);
			},
			onError: (error) => {
				setAlertModal({ visible: true, title: 'Error', message: error.message, variant: 'danger' });
			},
		});

	const [assignCoachToGoal] = useMutation(ASSIGN_COACH_TO_GOAL_MUTATION, {
		onCompleted: () => {
			refetchGoals();
			setAlertModal({
				visible: true,
				title: 'Success',
				message: 'You are now helping with this goal!',
				variant: 'success',
			});
		},
		onError: (error) => {
			setAlertModal({ visible: true, title: 'Error', message: error.message, variant: 'danger' });
		},
	});

	const [cancelSession] = useMutation(CANCEL_SESSION_MUTATION, {
		onCompleted: () => {
			refetch();
		},
		onError: (error) => {
			setAlertModal({ visible: true, title: 'Error', message: error.message, variant: 'danger' });
		},
	});

	const [inviteClientsToClass] = useMutation(INVITE_CLIENTS_TO_CLASS_MUTATION, {
		onCompleted: async () => {
			const sid = classManageSessionIdRef.current;
			const { data } = await refetch();
			const list = (data as any)?.getCoachSessions || [];
			const upd = list.find((s: any) => s.id === sid);
			if (upd) setClassManageSession(upd);
			else {
				setClassManageSession(null);
				classManageSessionIdRef.current = null;
			}
			setInvitePickClients([]);
			setClassRosterInviteSearch('');
			setAlertModal({
				visible: true,
				title: 'Sent',
				message: 'Invitations updated.',
				variant: 'success',
			});
		},
		onError: (error) => {
			setAlertModal({ visible: true, title: 'Error', message: error.message, variant: 'danger' });
		},
	});

	const [coachRespondJoin] = useMutation(COACH_RESPOND_JOIN_REQUEST_MUTATION, {
		onCompleted: async () => {
			setPendingCoachJoinKey(null);
			const sid = classManageSessionIdRef.current;
			const { data } = await refetch();
			const list = (data as any)?.getCoachSessions || [];
			const upd = list.find((s: any) => s.id === sid);
			if (upd) setClassManageSession(upd);
			else {
				setClassManageSession(null);
				classManageSessionIdRef.current = null;
			}
		},
		onError: (error) => {
			setPendingCoachJoinKey(null);
			setAlertModal({ visible: true, title: 'Error', message: error.message, variant: 'danger' });
		},
	});

	const [removeClientFromClass, { loading: removingRosterClient }] = useMutation(
		REMOVE_CLIENT_FROM_CLASS_SESSION_MUTATION,
		{
			onCompleted: async () => {
				setRemoveRosterMember(null);
				const sid = classManageSessionIdRef.current;
				const { data } = await refetch();
				const list = (data as any)?.getCoachSessions || [];
				const upd = list.find((s: any) => s.id === sid);
				if (upd) setClassManageSession(upd);
				else {
					setClassManageSession(null);
					classManageSessionIdRef.current = null;
				}
				setAlertModal({
					visible: true,
					title: 'Removed',
					message: 'Member removed from this class.',
					variant: 'success',
				});
			},
			onError: (error) => {
				setAlertModal({ visible: true, title: 'Error', message: error.message, variant: 'danger' });
			},
		}
	);

	const resetForm = () => {
		setSessionName('');
		setDate(undefined);
		setStartTime(undefined);
		setEndTime(undefined);
		setGymArea('');
		setNote('');
		setSelectedClients([]);
		setIsTemplate(false);
		setIsGroupClass(false);
		setMaxParticipants('20');
		setClassManageSession(null);
		classManageSessionIdRef.current = null;
		setInvitePickClients([]);
		setClassRosterInviteSearch('');
		setSelectedGoalId('');
		setSelectedTemplateId('');
		setErrors({});
		setSelectedWorkouts([]);
	};

	const handleAddWorkout = (exercise: any) => {
		const gifUrl =
			(typeof exercise?.gifUrl === 'string' && exercise.gifUrl.trim()) ||
			buildExerciseImageUrl(exercise.id) ||
			'';
		setSelectedWorkouts([
			...selectedWorkouts,
			{
				id: exercise.id,
				name: exercise.name,
				bodyPart: exercise.bodyPart,
				target: exercise.target,
				equipment: exercise.equipment,
				gifUrl,
				sets: '3',
				reps: '10',
			},
		]);
	};

	const handleRemoveWorkout = (index: number) => {
		setSelectedWorkouts(selectedWorkouts.filter((_, i) => i !== index));
	};

	const gymBoundsForSession = useMemo(() => {
		if (!date) return getGymMinutesBoundsNoReferenceDate();
		return getGymMinutesBoundsForWeekday(new Date(date).getDay());
	}, [date]);

	/** Minute bounds for start/end pickers: client preferred window ∩ gym hours for session day. */
	const sessionTimeBounds = useMemo(() => {
		if (isTemplate || isGroupClass) return gymBoundsForSession;

		const clientIds =
			selectedClients.length > 0 ? selectedClients : [];
		if (clientIds.length === 0) return gymBoundsForSession;

		const clientObjs = clientIds
			.map((id) =>
				(allClients as any[]).find((c: any) => String(c.id) === String(id))
			)
			.filter(Boolean);
		const pref = preferredWorkoutMinuteBoundsForUsers(clientObjs);
		if (!pref) return gymBoundsForSession;
		const crossed = intersectMinuteBounds(pref, gymBoundsForSession);
		return crossed ?? gymBoundsForSession;
	}, [
		allClients,
		date,
		gymBoundsForSession,
		isGroupClass,
		isTemplate,
		selectedClients,
	]);

	const endTimePickerMinMinutes = useMemo(() => {
		const { min, max } = sessionTimeBounds;
		const step = 15;
		if (!startTime) return min;
		const sm = minutesOfDayFromDate(startTime);
		const next = Math.max(min, Math.ceil((sm + step) / step) * step);
		return Math.min(max, next);
	}, [startTime, sessionTimeBounds]);

	const suggestEndAfterStart = useCallback(
		(start: Date) => {
			const step = 15;
			let endM =
				minutesOfDayFromDate(start) + SESSION_DEFAULT_DURATION_MINUTES;
			endM = Math.round(endM / step) * step;
			endM = Math.max(
				sessionTimeBounds.min + step,
				Math.min(sessionTimeBounds.max, endM)
			);
			const d = new Date(start);
			d.setHours(Math.floor(endM / 60), endM % 60, 0, 0);
			return d;
		},
		[sessionTimeBounds]
	);

	// Explain listed times + suggest defaults inside allowed window
	useEffect(() => {
		if (isTemplate || isGroupClass) {
			setPreferredTimeLabel(null);
			return;
		}
		if (selectedClients.length === 0) {
			setPreferredTimeLabel(null);
			return;
		}

		const clientObjs = selectedClients
			.map((id) =>
				(allClients as any[]).find((c: any) => String(c.id) === String(id))
			)
			.filter(Boolean);
		const pref = preferredWorkoutMinuteBoundsForUsers(clientObjs);

		const from = formatMinutesAs12hClock(sessionTimeBounds.min);
		const to = formatMinutesAs12hClock(sessionTimeBounds.max);
		if (!pref) {
			setPreferredTimeLabel(
				`Listed times: ${from} – ${to} (gym hours for this session day — no preferred workout time on file).`
			);
		} else {
			const scope =
				selectedClients.length > 1
					? 'overlap of selected clients’ preferred hours'
					: 'this client’s preferred hours';
			setPreferredTimeLabel(
				`Listed times: ${from} – ${to} (${scope}, limited by gym hours for this session day).`
			);
		}

		if (!startTime) {
			const sm = sessionTimeBounds.min;
			const suggestedStart = new Date();
			suggestedStart.setHours(Math.floor(sm / 60), sm % 60, 0, 0);
			setStartTime(suggestedStart);
			setErrors((prev) => ({ ...prev, startTime: '' }));

			if (!endTime) {
				const targetEnd = Math.min(
					sessionTimeBounds.max,
					sm + SESSION_DEFAULT_DURATION_MINUTES
				);
				const step = 15;
				let endM = Math.round(targetEnd / step) * step;
				endM = Math.max(
					sessionTimeBounds.min + step,
					Math.min(sessionTimeBounds.max, endM)
				);
				const suggestedEnd = new Date();
				suggestedEnd.setHours(
					Math.floor(endM / 60),
					endM % 60,
					0,
					0
				);
				setEndTime(suggestedEnd);
			}
		}
	}, [
		allClients,
		endTime,
		isTemplate,
		isGroupClass,
		selectedClients,
		selectedTemplateId,
		sessionTimeBounds,
		startTime,
		setErrors,
	]);

	// Keep chosen times inside allowed quarter-hour slots when bounds or clients change
	useEffect(() => {
		const { min, max } = sessionTimeBounds;
		const step = 15;
		const snap = (m: number) => {
			let t = Math.max(min, Math.min(max, m));
			t = Math.round(t / step) * step;
			return Math.max(min, Math.min(max, t));
		};

		if (startTime) {
			const sm = minutesOfDayFromDate(startTime);
			const ns = snap(sm);
			if (ns !== sm) {
				const d = new Date(startTime);
				d.setHours(Math.floor(ns / 60), ns % 60, 0, 0);
				setStartTime(d);
				return;
			}
		}

		if (endTime) {
			const em = minutesOfDayFromDate(endTime);
			let ne = snap(em);
			const minEnd = startTime
				? Math.max(
						min,
						Math.ceil(
							(minutesOfDayFromDate(startTime) + step) / step
						) * step
				  )
				: min;
			if (ne < minEnd) ne = Math.min(max, minEnd);
			if (ne > max) ne = max;
			if (ne !== em) {
				const d = new Date(endTime);
				d.setHours(Math.floor(ne / 60), ne % 60, 0, 0);
				setEndTime(d);
			}
		}
	}, [sessionTimeBounds, startTime, endTime]);

	const handleUpdateWorkoutSets = (index: number, sets: string) => {
		const updated = [...selectedWorkouts];
		updated[index].sets = sets;
		setSelectedWorkouts(updated);
	};

	const handleUpdateWorkoutReps = (index: number, reps: string) => {
		const updated = [...selectedWorkouts];
		updated[index].reps = reps;
		setSelectedWorkouts(updated);
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};
		if (selectedTemplateId) {
			if (!date) newErrors.date = 'Date is required';
			if (!startTime) newErrors.startTime = 'Start time is required';
			if (selectedClients.length === 0)
				newErrors.clients = 'Select at least one client';
			if (!selectedGoalId) newErrors.goalId = 'A goal must be selected';
		} else if (isTemplate) {
			if (!sessionName.trim())
				newErrors.sessionName = 'Workout name is required';
			if (!gymArea) newErrors.gymArea = 'Gym area is required';
		} else if (isGroupClass) {
			if (!sessionName.trim())
				newErrors.sessionName = 'Class name is required';
			if (!date) newErrors.date = 'Date is required';
			if (!startTime) newErrors.startTime = 'Start time is required';
			if (!gymArea) newErrors.gymArea = 'Gym area is required';
			const mp = parseInt(maxParticipants, 10);
			if (!mp || mp < 1)
				newErrors.maxParticipants = 'Enter max participants (at least 1)';
		} else {
			if (!sessionName.trim())
				newErrors.sessionName = 'Workout name is required';
			if (!date) newErrors.date = 'Date is required';
			if (!startTime) newErrors.startTime = 'Start time is required';
			if (!gymArea) newErrors.gymArea = 'Gym area is required';
			if (selectedClients.length === 0)
				newErrors.clients = 'Select at least one client';
			if (!selectedGoalId) newErrors.goalId = 'A goal must be selected';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	// Helper function to convert Date to 12-hour format string
	const formatTimeToString = (time: Date | undefined): string => {
		if (!time) return '';
		const hours = time.getHours();
		const minutes = time.getMinutes();
		const ampm = hours >= 12 ? 'PM' : 'AM';
		const displayHours = hours % 12 || 12;
		const displayMinutes = minutes.toString().padStart(2, '0');
		return `${displayHours}:${displayMinutes} ${ampm}`;
	};

	const handleCreateSession = () => {
		if (!validateForm()) return;

		const startTimeString = formatTimeToString(startTime);
		const endTimeString = endTime ? formatTimeToString(endTime) : undefined;

		const showAlert = (title: string, message: string) => {
			setAlertModal({ visible: true, title, message, variant: 'danger' });
		};

		if (selectedTemplateId) {
			// Ensure goal is selected and belongs to one of the selected clients
			if (!selectedGoalId) {
				showAlert('Error', 'Please select a goal for one of the selected clients');
				return;
			}

			// Verify the selected goal belongs to one of the selected clients
			const selectedGoal = myGoals.find((g: any) => g.id === selectedGoalId);
			if (!selectedGoal) {
				showAlert('Error', 'Selected goal not found');
				return;
			}

			const goalClientId = String(
				selectedGoal.clientId || selectedGoal.client?.id || ''
			);
			const isGoalForSelectedClient = selectedClients.some(
				(clientId: string) => String(clientId) === goalClientId
			);

			if (!isGoalForSelectedClient) {
				showAlert('Error', 'The selected goal must belong to one of the selected clients');
				return;
			}

			// Validate date
			if (!date) {
				showAlert('Error', 'Date is required');
				return;
			}

			// Validate startTime
			if (!startTime) {
				showAlert('Error', 'Start time is required');
				return;
			}

			// Validate selectedClients
			if (!selectedClients || selectedClients.length === 0) {
				showAlert('Error', 'At least one client must be selected');
				return;
			}

			// Prepare workout data for template with validation
			let workoutData: string | undefined = undefined;
			if (selectedWorkouts.length > 0) {
				try {
					const workoutArray = selectedWorkouts.map((w) => ({
						id: String(w.id || ''),
						name: String(w.name || ''),
						bodyPart: String(w.bodyPart || ''),
						target: String(w.target || ''),
						equipment: w.equipment ? String(w.equipment) : undefined,
						gifUrl: w.gifUrl ? String(w.gifUrl) : undefined,
						sets: parseInt(String(w.sets || '0'), 10) || 0,
						reps: parseInt(String(w.reps || '0'), 10) || 0,
					}));
					workoutData = JSON.stringify(workoutArray);
					// Validate JSON is valid
					JSON.parse(workoutData);
				} catch {
					showAlert('Error', 'Failed to prepare workout data. Please try again.');
					return;
				}
			}

			// Ensure all IDs are strings
			const normalizedClientsIds = selectedClients.map((id: any) => String(id));
			const normalizedTemplateId = String(selectedTemplateId);
			const normalizedGoalId = String(selectedGoalId);

			createSessionFromTemplate({
				variables: {
					input: {
						templateId: normalizedTemplateId,
						clientsIds: normalizedClientsIds,
						date: sessionCalendarDateToIso(date),
						startTime: startTimeString,
						endTime: endTimeString || undefined,
						goalId: normalizedGoalId,
						workoutType: workoutData || undefined,
					},
				},
			});
			return;
		}

		// Prepare workout data with validation
		let workoutData: string | undefined = undefined;
		if (selectedWorkouts.length > 0) {
			try {
				const workoutArray = selectedWorkouts.map((w) => ({
					id: String(w.id || ''),
					name: String(w.name || ''),
					bodyPart: String(w.bodyPart || ''),
					target: String(w.target || ''),
					equipment: w.equipment ? String(w.equipment) : undefined,
					gifUrl: w.gifUrl ? String(w.gifUrl) : undefined,
					sets: parseInt(String(w.sets || '0'), 10) || 0,
					reps: parseInt(String(w.reps || '0'), 10) || 0,
				}));
				workoutData = JSON.stringify(workoutArray);
				// Validate JSON is valid
				JSON.parse(workoutData);
			} catch {
				setAlertModal({
					visible: true,
					title: 'Error',
					message: 'Failed to prepare workout data. Please try again.',
					variant: 'danger',
				});
				return;
			}
		}

		if (isTemplate) {
			createSession({
				variables: {
					input: {
						clientsIds: [],
						name: sessionName.trim(),
						date: new Date().toISOString(),
						startTime: '12:00 PM',
						gymArea,
						note: note || undefined,
						isTemplate: true,
						goalId: selectedGoalId || undefined,
						workoutType: workoutData || undefined,
					},
				},
			});
			return;
		}

		if (!date) {
			setAlertModal({ visible: true, title: 'Error', message: 'Date is required', variant: 'danger' });
			return;
		}

		if (!startTime) {
			setAlertModal({ visible: true, title: 'Error', message: 'Start time is required', variant: 'danger' });
			return;
		}

		if (isGroupClass) {
			const mp = parseInt(maxParticipants, 10);
			if (!mp || mp < 1) {
				setAlertModal({
					visible: true,
					title: 'Error',
					message: 'Enter a valid max participants',
					variant: 'danger',
				});
				return;
			}
			const invited = selectedClients.map((id: any) => String(id));
			createSession({
				variables: {
					input: {
						clientsIds: [],
						name: sessionName.trim(),
						date: sessionCalendarDateToIso(date),
						startTime: startTimeString,
						endTime: endTimeString || undefined,
						gymArea,
						note: note || undefined,
						workoutType: workoutData || undefined,
						sessionKind: 'group_class',
						maxParticipants: mp,
						invitedClientIds: invited.length > 0 ? invited : undefined,
					},
				},
			});
			return;
		}

		const normalizedClientsIds = selectedClients.map((id: any) => String(id));

		createSession({
			variables: {
				input: {
					clientsIds: normalizedClientsIds,
					name: sessionName.trim(),
					date: sessionCalendarDateToIso(date),
					startTime: startTimeString,
					endTime: endTimeString || undefined,
					gymArea,
					note: note || undefined,
					goalId: selectedGoalId || undefined,
					workoutType: workoutData || undefined,
				},
			},
		});
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

	const sessions = sessionsData?.getCoachSessions || [];
	const goals = goalsData?.getAllClientGoals || [];

	const sessionMarkDays = useMemo(() => {
		const set = new Set<string>();
		for (const s of sessions as any[]) {
			if (s.isTemplate || s.status === 'cancelled') continue;
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

	const hasSessionsOnSelectedScheduleDay = useMemo(() => {
		return (sessions as any[]).some(
			(s: any) =>
				!s.isTemplate &&
				s.status !== 'cancelled' &&
				localDateKeyFromIso(s.date) === selectedScheduleDay
		);
	}, [sessions, selectedScheduleDay]);

	const displayedScheduleSessions = useMemo(() => {
		const list = sessions as any[];
		if (scheduleListUpcoming) {
			const today = new Date();
			const todayStart = new Date(
				today.getFullYear(),
				today.getMonth(),
				today.getDate()
			);
			return list
				.filter((s: any) => {
					if (s.isTemplate) return false;
					if (s.status === 'cancelled' || s.status === 'completed') return false;
					const sessionDate = new Date(s.date);
					return sessionDate >= todayStart;
				})
				.sort((a: any, b: any) => {
					const da = new Date(a.date).getTime();
					const db = new Date(b.date).getTime();
					if (da !== db) return da - db;
					return String(a.startTime ?? '').localeCompare(String(b.startTime ?? ''));
				})
				.slice(0, 20);
		}
		return list
			.filter((s: any) => {
				if (s.isTemplate) return false;
				if (s.status === 'cancelled') return false;
				return localDateKeyFromIso(s.date) === selectedScheduleDay;
			})
			.sort((a: any, b: any) =>
				String(a.startTime ?? '').localeCompare(String(b.startTime ?? ''))
			);
	}, [sessions, selectedScheduleDay, scheduleListUpcoming]);

	const templates = templatesData?.getSessionTemplates || [];
	const unassignedGoals = goals.filter((goal: any) => !goal.coachId);
	const myGoals = goals.filter((goal: any) => goal.coachId === user?.id);

	// Get goals for selected clients - only show goals where coach is assigned (myGoals)
	// and that belong to the selected clients
	const availableGoals = useMemo(() => {
		if (selectedClients.length === 0) {
			// If no clients selected, show all assigned goals
			return myGoals;
		}

		// Normalize selected client IDs to strings for comparison
		const normalizedSelectedClients = selectedClients.map((id: string) =>
			String(id)
		);

		// Filter goals to only show those for selected clients where coach is assigned
		return myGoals.filter((goal: any) => {
			// Get the client ID from the goal - handle both clientId field and client object
			// The GraphQL query returns both clientId and client.id, so check both
			let goalClientId: string | null = null;

			if (goal.clientId) {
				goalClientId = String(goal.clientId);
			} else if (goal.client?.id) {
				goalClientId = String(goal.client.id);
			}

			if (!goalClientId) {
				// If we can't find the client ID, skip this goal
				return false;
			}

			// Check if this goal's client is in the selected clients list
			return normalizedSelectedClients.includes(goalClientId);
		});
	}, [selectedClients, myGoals]);

	// Auto-manage selected goal based on selected clients
	useEffect(() => {
		// Only for regular session creation (not templates / schedule-from-template / group class)
		if (isTemplate || selectedTemplateId || isGroupClass) return;

		// No clients selected: clear goal
		if (selectedClients.length === 0) {
			if (selectedGoalId) {
				setSelectedGoalId('');
				setErrors((prev) => ({ ...prev, goalId: '' }));
			}
			return;
		}

		// If there's exactly one goal for the selected clients, auto-pick it
		if (availableGoals.length === 1) {
			const onlyGoalId = String(availableGoals[0].id);
			if (String(selectedGoalId) !== onlyGoalId) {
				setSelectedGoalId(onlyGoalId);
				setErrors((prev) => ({ ...prev, goalId: '' }));
			}
			return;
		}

		// If current selectedGoalId is no longer valid for the current clients, clear it
		if (
			selectedGoalId &&
			!availableGoals.some((g: any) => String(g.id) === String(selectedGoalId))
		) {
			setSelectedGoalId('');
			setErrors((prev) => ({ ...prev, goalId: '' }));
		}
	}, [
		availableGoals,
		isTemplate,
		isGroupClass,
		selectedClients,
		selectedGoalId,
		selectedTemplateId,
		setErrors,
	]);

	const applyCalendarDayToSessionDate = useCallback(() => {
		const d = parseScheduleDayToLocalDate(selectedScheduleDay);
		if (d) setDate(d);
	}, [selectedScheduleDay]);

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
				{/* Header */}
				<View className='mb-6'>
					<View className='flex-row justify-between items-center mb-2'>
						<Text className='text-3xl font-bold text-text-primary'>Schedule</Text>
						<GradientButton
							onPress={() => {
								applyCalendarDayToSessionDate();
								setShowCreateModal(true);
							}}
							className='px-4 py-2'
						>
							<View className='flex-row items-center'>
								<Ionicons name='add' size={20} color='#fff' />
								<Text className='text-white font-semibold ml-2 text-sm'>
									New Session
								</Text>
							</View>
						</GradientButton>
					</View>
					<Text className='text-text-secondary text-sm'>
						Plan workouts, reuse templates, and keep track of upcoming sessions
						with your clients.
					</Text>
				</View>

				{/* Quick tools: Goals & Templates */}
				<View className='mb-6'>
					<Text className='text-text-primary font-semibold mb-3'>
						Planning Tools
					</Text>
					<View className='flex-row gap-3'>
						<TouchableOpacity
							onPress={() => setShowGoalsModal(true)}
							className='flex-1 bg-bg-primary rounded-xl px-3 py-3 flex-row items-center justify-center border border-[#F9C513]/30'
						>
							<Ionicons name='flag' size={18} color='#F9C513' />
							<Text className='text-text-primary font-semibold ml-2 text-sm'>
								Client Goals
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => setShowTemplatesModal(true)}
							className='flex-1 bg-bg-primary rounded-xl px-3 py-3 flex-row items-center justify-center border border-[#F9C513]/30'
						>
							<Ionicons name='copy' size={18} color='#F9C513' />
							<Text className='text-text-primary font-semibold ml-2 text-sm'>
								Session Templates
							</Text>
						</TouchableOpacity>
					</View>
				</View>

				{/* Calendar + sessions */}
				<View className='mb-4'>
					<Text className='text-xl font-semibold text-text-primary mb-2'>
						Calendar
					</Text>
					<Text className='text-text-secondary text-sm mb-3'>
						Gold dot: coaching session. Green check: your gym check-in. Tap a day for
						check-in times and that day&apos;s sessions.
					</Text>
					<View className='flex-row gap-2 mb-3'>
						<TouchableOpacity
							onPress={() => setScheduleListUpcoming(false)}
							className={`flex-1 py-2.5 rounded-xl border items-center justify-center ${
								!scheduleListUpcoming
									? 'bg-[#F9C513] border-[#F9C513]'
									: 'bg-bg-primary border-[#F9C513]/35'
							}`}
							style={{ borderWidth: 0.5 }}
						>
							<Text
								className={`text-sm font-semibold ${
									!scheduleListUpcoming ? 'text-[#111827]' : 'text-text-secondary'
								}`}
							>
								By day
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => setScheduleListUpcoming(true)}
							className={`flex-1 py-2.5 rounded-xl border items-center justify-center ${
								scheduleListUpcoming
									? 'bg-[#F9C513] border-[#F9C513]'
									: 'bg-bg-primary border-[#F9C513]/35'
							}`}
							style={{ borderWidth: 0.5 }}
						>
							<Text
								className={`text-sm font-semibold ${
									scheduleListUpcoming ? 'text-[#111827]' : 'text-text-secondary'
								}`}
							>
								Upcoming
							</Text>
						</TouchableOpacity>
					</View>
					<View
						className='bg-bg-primary rounded-xl border border-[#F9C513]/40 overflow-hidden mb-4'
						style={{ borderWidth: 0.5 }}
					>
						<CoachScheduleCalendar
							selectedDay={selectedScheduleDay}
							sessionDays={sessionMarkDays}
							attendanceDays={attendanceMarkDays}
							highlightSelected={!scheduleListUpcoming}
							onDayPress={(key) => {
								setScheduleListUpcoming(false);
								setSelectedScheduleDay(key);
							}}
						/>
					</View>
					<Text className='text-lg font-semibold text-text-primary mb-3'>
						{scheduleListUpcoming
							? 'Upcoming sessions'
							: `Sessions — ${formatCalendarDayLabel(selectedScheduleDay)}`}
					</Text>
					{!scheduleListUpcoming ? (
						<ScheduleDayAttendancePanel
							dayKey={selectedScheduleDay}
							dayLabel={formatCalendarDayLabel(selectedScheduleDay)}
							allRecords={attendanceRecords as any[]}
							hasSessionsOnDay={hasSessionsOnSelectedScheduleDay}
						/>
					) : null}
					{displayedScheduleSessions.length === 0 ? (
						<View
							className='bg-bg-primary rounded-xl p-6 items-center border border-[#F9C513]'
							style={{ borderWidth: 0.5 }}
						>
							<Ionicons name='calendar-outline' size={48} color='#8E8E93' />
							<Text className='text-text-secondary mt-2 text-center'>
								{scheduleListUpcoming
									? 'No upcoming sessions'
									: 'No sessions on this date'}
							</Text>
						</View>
					) : (
						<FlatList
							data={displayedScheduleSessions}
							keyExtractor={(item) => item.id}
							scrollEnabled={false}
							renderItem={({ item }) => (
								<View
									className='bg-bg-primary rounded-xl p-4 mb-3 flex-row border border-[#F9C513]'
									style={{ borderWidth: 0.5 }}
								>
									<View
										className='bg-bg-darker rounded-lg p-3 mr-3 items-center justify-center min-w-[80] border border-[#F9C513]'
										style={{ borderWidth: 0.5 }}
									>
										<Text className='text-[#F9C513] font-bold text-lg'>
											{formatTimeTo12Hour(item.startTime)}
										</Text>
										<Text className='text-text-secondary text-xs mt-1'>
											{formatDate(item.date)}
										</Text>
									</View>
									<View className='flex-1'>
										<View className='flex-row items-center gap-2 flex-wrap mb-1'>
											<Text className='text-text-primary font-semibold text-base'>
												{item.name}
											</Text>
											{item.sessionKind === 'group_class' && (
												<View className='bg-[#F9C513]/20 px-2 py-0.5 rounded-md border border-[#F9C513]/50'>
													<Text className='text-[#F9C513] text-xs font-semibold'>
														Group class
													</Text>
												</View>
											)}
										</View>
										<View className='flex-row items-center mb-1'>
											<Ionicons name='location' size={14} color='#8E8E93' />
											<Text className='text-text-secondary text-sm ml-1'>
												{item.gymArea}
											</Text>
										</View>
										<Text className='text-text-secondary text-sm'>
											{item.sessionKind === 'group_class'
												? `${item.clients?.length || 0}/${
														item.maxParticipants ?? '?'
													} enrolled`
												: `${item.clients?.length || 0} client(s)`}
										</Text>
										{item.goal && (
											<Text className='text-[#F9C513] text-xs mt-1'>
												Goal: {item.goal.title}
											</Text>
										)}
									</View>
									<View className='flex-row items-center gap-2'>
										{item.sessionKind === 'group_class' && (
											<TouchableOpacity
												onPress={() => {
													setInvitePickClients([]);
													setClassRosterInviteSearch('');
													classManageSessionIdRef.current = item.id;
													setClassManageSession(item);
												}}
												className='p-2'
											>
												<Ionicons name='people' size={24} color='#F9C513' />
											</TouchableOpacity>
										)}
										{new Date(item.date) <= new Date() &&
											sessionsWithProgressImages.has(item.id) && (
												<TouchableOpacity
													onPress={() => {
														setSelectedSessionForProgress(item);
														setShowProgressImagesModal(true);
													}}
													className='p-2'
												>
													<Ionicons name='images' size={24} color='#F9C513' />
												</TouchableOpacity>
											)}
										<TouchableOpacity
											onPress={() => {
												setSessionToCancel(item);
											}}
											className='p-2'
										>
											<Ionicons name='close-circle' size={24} color='#FF3B30' />
										</TouchableOpacity>
									</View>
								</View>
							)}
						/>
					)}
				</View>

				{/* My Goals below schedule */}
				{myGoals.length > 0 && (
					<View className='mb-4'>
						<Text className='text-xl font-semibold text-text-primary mb-4'>
							My Goals ({myGoals.length})
						</Text>
						<FlatList
							data={myGoals.slice(0, 3)}
							keyExtractor={(item) => item.id}
							scrollEnabled={false}
							renderItem={({ item }) => (
								<View
									className='bg-bg-primary rounded-xl p-4 mb-3 border border-[#F9C513]'
									style={{ borderWidth: 0.5 }}
								>
									<Text className='text-text-primary font-semibold text-base mb-1'>
										{item.title}
									</Text>
									<Text className='text-text-secondary text-sm'>
										Client: {item.client?.firstName} {item.client?.lastName}
									</Text>
									<Text className='text-text-secondary text-sm'>
										Type: {item.goalType}
									</Text>
								</View>
							)}
						/>
					</View>
				)}

			</ScrollView>

			<Modal
				visible={showGoalsModal}
				animationType='slide'
				transparent
				onRequestClose={() => setShowGoalsModal(false)}
			>
				<View className='flex-1 bg-bg-darker justify-end'>
					<View
						className='bg-bg-primary rounded-t-3xl p-5 max-h-[90%] border-t border-[#F9C513]'
						style={{ borderTopWidth: 0.5 }}
					>
						<ScrollView showsVerticalScrollIndicator={false}>
							<View className='flex-row justify-between items-center mb-6'>
								<Text className='text-2xl font-bold text-text-primary'>
									Client Goals
								</Text>
								<TouchableOpacity onPress={() => setShowGoalsModal(false)}>
									<Ionicons name='close' size={28} color='#8E8E93' />
								</TouchableOpacity>
							</View>

							{goals.length === 0 ? (
								<View
									className='items-center py-10 border border-[#F9C513] rounded-xl'
									style={{ borderWidth: 0.5 }}
								>
									<Ionicons name='flag-outline' size={48} color='#8E8E93' />
									<Text className='text-text-secondary mt-4 text-center'>
										No goals available
									</Text>
								</View>
							) : (
								<>
									{unassignedGoals.length > 0 && (
										<View className='mb-6'>
											<Text className='text-lg font-semibold text-text-primary mb-3'>
												Available Goals ({unassignedGoals.length})
											</Text>
											<FlatList
												data={unassignedGoals}
												keyExtractor={(item) => item.id}
												scrollEnabled={false}
												renderItem={({ item }) => (
													<View
														className='bg-bg-darker rounded-xl p-4 mb-3 border border-[#F9C513]'
														style={{ borderWidth: 0.5 }}
													>
														<Text className='text-text-primary font-semibold text-base mb-2'>
															{item.title}
														</Text>
														<Text className='text-text-secondary text-sm mb-1'>
															Client: {item.client?.firstName}{' '}
															{item.client?.lastName}
														</Text>
														<Text className='text-text-secondary text-sm mb-3'>
															Type: {item.goalType}
														</Text>
														<GradientButton
															onPress={() => {
																assignCoachToGoal({
																	variables: { goalId: item.id },
																});
															}}
															className='mt-2'
														>
															Help with this Goal
														</GradientButton>
													</View>
												)}
											/>
										</View>
									)}

									{myGoals.length > 0 && (
										<View>
											<Text className='text-lg font-semibold text-text-primary mb-3'>
												My Goals ({myGoals.length})
											</Text>
											<FlatList
												data={myGoals}
												keyExtractor={(item) => item.id}
												scrollEnabled={false}
												renderItem={({ item }) => (
													<View
														className='bg-bg-darker rounded-xl p-4 mb-3 border border-[#F9C513]'
														style={{ borderWidth: 0.5 }}
													>
														<Text className='text-text-primary font-semibold text-base mb-2'>
															{item.title}
														</Text>
														<Text className='text-text-secondary text-sm mb-1'>
															Client: {item.client?.firstName}{' '}
															{item.client?.lastName}
														</Text>
														<Text className='text-text-secondary text-sm'>
															Type: {item.goalType}
														</Text>
													</View>
												)}
											/>
										</View>
									)}
								</>
							)}
						</ScrollView>
					</View>
				</View>
			</Modal>

			<Modal
				visible={showTemplatesModal}
				animationType='slide'
				transparent
				onRequestClose={() => setShowTemplatesModal(false)}
			>
				<View className='flex-1 bg-bg-darker justify-end'>
					<View
						className='bg-bg-primary rounded-t-3xl p-5 max-h-[90%] border-t border-[#F9C513]'
						style={{ borderTopWidth: 0.5 }}
					>
						<ScrollView showsVerticalScrollIndicator={false}>
							<View className='flex-row justify-between items-center mb-6'>
								<Text className='text-2xl font-bold text-text-primary'>
									Session Templates
								</Text>
								<TouchableOpacity onPress={() => setShowTemplatesModal(false)}>
									<Ionicons name='close' size={28} color='#8E8E93' />
								</TouchableOpacity>
							</View>

							{templates.length === 0 ? (
								<View
									className='items-center py-10 border border-[#F9C513] rounded-xl'
									style={{ borderWidth: 0.5 }}
								>
									<Ionicons name='copy-outline' size={48} color='#8E8E93' />
									<Text className='text-text-secondary mt-4 text-center'>
										No templates yet
									</Text>
									<Text className='text-text-secondary mt-2 text-center text-sm'>
										Create reusable session templates to schedule quickly
									</Text>
								</View>
							) : (
								<FlatList
									data={templates}
									keyExtractor={(item) => item.id}
									scrollEnabled={false}
									renderItem={({ item }) => (
										<View className='bg-bg-darker rounded-xl p-4 mb-3 border border-bg-primary'>
											<Text className='text-text-primary font-semibold text-base mb-2'>
												{item.name}
											</Text>
											<View className='flex-row items-center mb-2'>
												<Ionicons name='location' size={14} color='#8E8E93' />
												<Text className='text-text-secondary text-sm ml-1'>
													{item.gymArea}
												</Text>
											</View>
											{item.goal && (
												<Text className='text-[#F9C513] text-xs mb-2'>
													Goal: {item.goal.title}
												</Text>
											)}
											<View className='flex-row gap-2 mt-2'>
												<GradientButton
													onPress={() => {
														setSelectedTemplateId(item.id);
														setIsGroupClass(false);
														applyCalendarDayToSessionDate();
														setShowCreateModal(true);
														setShowTemplatesModal(false);
													}}
													className='flex-1'
												>
													Schedule
												</GradientButton>
											</View>
										</View>
									)}
								/>
							)}
						</ScrollView>
					</View>
				</View>
			</Modal>

			<Modal
				visible={showCreateModal}
				animationType='slide'
				transparent
				onRequestClose={() => {
					setShowCreateModal(false);
					resetForm();
				}}
			>
				<View className='flex-1 bg-bg-darker justify-end'>
					<View
						className='bg-bg-primary rounded-t-3xl p-5 max-h-[90%] border-t border-[#F9C513]'
						style={{ borderTopWidth: 0.5 }}
					>
						<ScrollView
							showsVerticalScrollIndicator={false}
							keyboardShouldPersistTaps='handled'
						>
							<View className='flex-row justify-between items-center mb-6'>
								<Text className='text-2xl font-bold text-text-primary'>
									{selectedTemplateId
										? 'Schedule from Template'
										: isTemplate
											? 'Create Template'
											: 'Create Session'}
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

							{selectedTemplateId ? (
								<>
									<Text className='text-text-secondary mb-4'>
										Schedule this template for specific clients and date
									</Text>
									<View className='mb-4'>
										<Text className='text-text-primary font-semibold mb-2'>
											Select Clients <Text className='text-red-500'>*</Text>
										</Text>
										{allClients.length === 0 ? (
											<Text className='text-text-secondary text-sm'>
												No clients available
											</Text>
										) : (
											allClients.map((client: any) => (
												<TouchableOpacity
													key={client.id}
													onPress={() => {
														if (selectedClients.includes(client.id)) {
															setSelectedClients(
																selectedClients.filter((id) => id !== client.id)
															);
															// Clear goal if it was for this client
															if (selectedGoalId) {
																const goal = myGoals.find((g: any) => {
																	const goalClientId = String(
																		g.clientId || g.client?.id || ''
																	);
																	return (
																		String(g.id) === String(selectedGoalId) &&
																		String(client.id) === goalClientId
																	);
																});
																if (goal) {
																	setSelectedGoalId('');
																	setErrors({ ...errors, goalId: '' });
																}
															}
															setErrors({ ...errors, clients: '' });
														} else {
															setSelectedClients([
																...selectedClients,
																client.id,
															]);
															setErrors({ ...errors, clients: '' });
														}
													}}
													className={`p-3 rounded-lg mb-2 border ${
														selectedClients.includes(client.id)
															? 'bg-[#F9C513]/20 border-[#F9C513]'
															: 'bg-bg-darker border-[#F9C513]'
													}`}
													style={{ borderWidth: 0.5 }}
												>
													<Text className='text-text-primary'>
														{client.firstName} {client.lastName}
													</Text>
												</TouchableOpacity>
											))
										)}
										{errors.clients && (
											<Text className='text-red-500 text-sm mt-1'>
												{errors.clients}
											</Text>
										)}
									</View>
									<View className='mb-4'>
										<Text className='text-text-primary font-semibold mb-2'>
											Link to Goal <Text className='text-red-500'>*</Text>
										</Text>
										<Select
											options={availableGoals.map((goal: any) => ({
												label: `${goal.title} - ${goal.client?.firstName} ${goal.client?.lastName}`,
												value: goal.id,
											}))}
											value={selectedGoalId}
											onChange={(value) => {
												setSelectedGoalId(value);
												setErrors({ ...errors, goalId: '' });
											}}
											placeholder={
												selectedClients.length === 0
													? 'Select clients first to see their goals'
													: availableGoals.length === 0
														? 'No goals available for selected clients'
														: 'Select a goal'
											}
											disabled={
												selectedClients.length === 0 ||
												availableGoals.length === 0
											}
											error={errors.goalId}
										/>
										{selectedClients.length === 0 && (
											<Text className='text-text-secondary text-xs mt-1'>
												Select clients above to see their available goals
											</Text>
										)}
										{selectedClients.length > 0 &&
											availableGoals.length === 0 && (
												<Text className='text-red-500 text-xs mt-1'>
													No goals available for the selected clients. Please
													assign yourself to their goals first.
												</Text>
											)}
										{errors.goalId && (
											<Text className='text-red-500 text-sm mt-1'>
												{errors.goalId}
											</Text>
										)}
									</View>
									<DatePicker
										label='Session date *'
										sheetTitle='Session date'
										value={date}
										onChange={setDate}
										minimumDate={new Date()}
										error={errors.date}
									/>
									<Text className='text-text-secondary text-xs -mt-2 mb-3'>
										This is the calendar day only — start and end time are set
										below. New Session pre-fills from the day highlighted on your
										schedule.
									</Text>
									<TimePicker
										label='Start Time'
										value={startTime}
										minMinutes={sessionTimeBounds.min}
										maxMinutes={sessionTimeBounds.max}
										modalTitle='Start time'
										onChange={(time) => {
											setStartTime(time);
											setErrors({ ...errors, startTime: '' });
											if (time) {
												const suggestedEnd = suggestEndAfterStart(time);
												if (!endTime || endTime <= time) {
													setEndTime(suggestedEnd);
												}
											}
										}}
										placeholder='Select start time'
										error={errors.startTime}
									/>
									{preferredTimeLabel && (
										<Text className='text-text-secondary text-xs mt-1'>
											{preferredTimeLabel}
										</Text>
									)}
									<View className='mt-4'>
										<TimePicker
											label='End Time (Optional)'
											value={endTime}
											minMinutes={endTimePickerMinMinutes}
											maxMinutes={sessionTimeBounds.max}
											modalTitle='End time'
											onChange={setEndTime}
											placeholder='Select end time'
										/>
									</View>
									{/* Workout selection before time so coach can base duration on plan */}
									<View className='mb-4 mt-2'>
										<Text className='text-text-primary font-semibold mb-2'>
											Workout Exercises
										</Text>
										<TouchableOpacity
											onPress={() => {
												console.log('Opening workout modal');
												// Remember that create modal was open and close it
												setWasCreateModalOpen(showCreateModal);
												setShowCreateModal(false);
												// Small delay to ensure modal closes before opening new one
												setTimeout(() => {
													setShowWorkoutModal(true);
												}, 300);
											}}
											activeOpacity={0.7}
											className='p-3 bg-bg-darker rounded-lg border border-[#F9C513]'
											style={{ borderWidth: 0.5 }}
										>
											<View className='flex-row items-center justify-between'>
												<View className='flex-row items-center'>
													<Ionicons name='barbell' size={20} color='#F9C513' />
													<Text className='text-text-primary ml-2'>
														{selectedWorkouts.length > 0
															? `${selectedWorkouts.length} exercise(s) selected`
															: 'Add Workout Exercises'}
													</Text>
												</View>
												<Ionicons
													name='chevron-forward'
													size={20}
													color='#8E8E93'
												/>
											</View>
										</TouchableOpacity>
										{selectedWorkouts.length > 0 && (
											<View className='mt-3'>
												{selectedWorkouts.map((workout, index) => (
													<View
														key={index}
														className='bg-bg-darker rounded-lg p-3 mb-2 border border-[#F9C513]'
														style={{ borderWidth: 0.5 }}
													>
														<View className='flex-row items-center justify-between mb-2'>
															<Text className='text-text-primary font-semibold flex-1'>
																{workout.name}
															</Text>
															<TouchableOpacity
																onPress={() => handleRemoveWorkout(index)}
																className='ml-2'
															>
																<Ionicons
																	name='close-circle'
																	size={20}
																	color='#FF3B30'
																/>
															</TouchableOpacity>
														</View>
														<View className='flex-row items-center gap-3 mt-2'>
															<View className='flex-1'>
																<Text className='text-text-secondary text-xs mb-1'>
																	Sets
																</Text>
																<TextInput
																	value={workout.sets}
																	onChangeText={(text) =>
																		handleUpdateWorkoutSets(index, text)
																	}
																	keyboardType='number-pad'
																	className='bg-bg-primary rounded-lg p-2 text-text-primary border border-[#F9C513]'
																	style={{ borderWidth: 0.5 }}
																/>
															</View>
															<View className='flex-1'>
																<Text className='text-text-secondary text-xs mb-1'>
																	Reps
																</Text>
																<TextInput
																	value={workout.reps}
																	onChangeText={(text) =>
																		handleUpdateWorkoutReps(index, text)
																	}
																	keyboardType='number-pad'
																	className='bg-bg-primary rounded-lg p-2 text-text-primary border border-[#F9C513]'
																	style={{ borderWidth: 0.5 }}
																/>
															</View>
														</View>
													</View>
												))}
											</View>
										)}
									</View>
									<GradientButton
										onPress={handleCreateSession}
										loading={creatingFromTemplate}
										className='mt-4'
									>
										Schedule Session
									</GradientButton>
								</>
							) : (
								<>
									{/* Save as reusable template button - moved to top */}
									{!isTemplate && (
										<TouchableOpacity
											onPress={() => {
												setIsTemplate(true);
												setIsGroupClass(false);
											}}
											className='mb-4 p-3 bg-bg-darker rounded-lg border border-[#F9C513]'
											style={{ borderWidth: 0.5 }}
										>
											<View className='flex-row items-center'>
												<Ionicons name='copy' size={20} color='#F9C513' />
												<Text className='text-text-primary ml-2'>
													Save as reusable template
												</Text>
											</View>
										</TouchableOpacity>
									)}

									{!isTemplate && (
										<TouchableOpacity
											onPress={() => {
												setIsGroupClass((g) => !g);
												setIsTemplate(false);
												if (!isGroupClass) {
													setSelectedGoalId('');
												}
											}}
											className={`mb-4 p-3 rounded-lg border border-[#F9C513] ${
												isGroupClass ? 'bg-[#F9C513]/20' : 'bg-bg-darker'
											}`}
											style={{ borderWidth: 0.5 }}
										>
											<View className='flex-row items-center'>
												<Ionicons name='people' size={20} color='#F9C513' />
												<Text className='text-text-primary ml-2'>
													{isGroupClass
														? 'Group class \u2014 tap to switch to 1:1 session'
														: 'Create group class (Zumba, studio, etc.)'}
												</Text>
											</View>
										</TouchableOpacity>
									)}

									{isGroupClass && (
										<View className='mb-4'>
											<Text className='text-text-primary font-semibold mb-2'>
												Max participants
											</Text>
											<TextInput
												value={maxParticipants}
												onChangeText={(t) => {
													setMaxParticipants(t.replace(/[^0-9]/g, ''));
													setErrors((e) => ({ ...e, maxParticipants: '' }));
												}}
												keyboardType='number-pad'
												placeholder='20'
												placeholderTextColor='#8E8E93'
												className='bg-bg-darker rounded-lg p-3 text-text-primary border border-[#F9C513]'
												style={{ borderWidth: 0.5 }}
											/>
											{errors.maxParticipants ? (
												<Text className='text-red-500 text-sm mt-1'>
													{errors.maxParticipants}
												</Text>
											) : null}
										</View>
									)}

									{/* Select clients first so Link to Goal can be enabled */}
									{!isTemplate && (
										<View className='mb-4'>
											<Text className='text-text-primary font-semibold mb-2'>
												{isGroupClass
													? 'Invite clients (optional)'
													: 'Select Clients'}
												{!isGroupClass && <Text className='text-red-500'> *</Text>}
											</Text>
											{allClients.length === 0 ? (
												<Text className='text-text-secondary text-sm'>
													No clients available
												</Text>
											) : (
												allClients.map((client: any) => (
													<TouchableOpacity
														key={client.id}
														onPress={() => {
															if (selectedClients.includes(client.id)) {
																setSelectedClients(
																	selectedClients.filter(
																		(id) => id !== client.id
																	)
																);
																if (selectedGoalId) {
																	const goal = myGoals.find((g: any) => {
																		const goalClientId = String(
																			g.clientId || g.client?.id || ''
																		);
																		return (
																			String(g.id) === String(selectedGoalId) &&
																			String(client.id) === goalClientId
																		);
																	});
																	if (goal) {
																		setSelectedGoalId('');
																	}
																}
															} else {
																setSelectedClients([
																	...selectedClients,
																	client.id,
																]);
															}
														}}
														className={`p-3 rounded-lg mb-2 border ${
															selectedClients.includes(client.id)
																? 'bg-[#F9C513]/20 border-[#F9C513]'
																: 'bg-bg-darker border-[#F9C513]'
														}`}
														style={{ borderWidth: 0.5 }}
													>
														<Text className='text-text-primary'>
															{client.firstName} {client.lastName}
														</Text>
													</TouchableOpacity>
												))
											)}
											{errors.clients && (
												<Text className='text-red-500 text-sm mt-1'>
													{errors.clients}
												</Text>
											)}
										</View>
									)}

									{!isTemplate && !isGroupClass && (
										<View className='mb-4'>
											<Text className='text-text-primary font-semibold mb-2'>
												Link to Goal <Text className='text-red-500'>*</Text>
											</Text>
											<Select
												options={availableGoals.map((goal: any) => ({
													label: `${goal.title} - ${goal.client?.firstName} ${goal.client?.lastName}`,
													value: goal.id,
												}))}
												value={selectedGoalId}
												onChange={(value) => {
													setSelectedGoalId(value);
													setErrors((prev) => ({ ...prev, goalId: '' }));
												}}
												placeholder={
													selectedClients.length === 0
														? 'Select clients first to see their goals'
														: availableGoals.length === 0
															? 'No goals available for selected clients'
															: 'Select a goal'
												}
												disabled={
													selectedClients.length === 0 ||
													availableGoals.length === 0
												}
												error={errors.goalId}
											/>
											{selectedClients.length === 0 && (
												<Text className='text-text-secondary text-xs mt-1'>
													Select clients above to see their available goals
												</Text>
											)}
											{selectedClients.length > 0 &&
												availableGoals.length === 0 && (
													<Text className='text-red-500 text-xs mt-1'>
														No goals available for the selected clients. Please
														assign yourself to their goals first.
													</Text>
												)}
											{errors.goalId && (
												<Text className='text-red-500 text-sm mt-1'>
													{errors.goalId}
												</Text>
											)}
										</View>
									)}

									<Input
										label={isGroupClass ? 'Class name' : 'Workout Name'}
										placeholder={
											isGroupClass
												? 'e.g., Zumba, Spin, HIIT'
												: 'e.g., Chest, Back, Leg Day'
										}
										value={sessionName}
										onChangeText={(text) => {
											setSessionName(text);
											setErrors({ ...errors, sessionName: '' });
										}}
										error={errors.sessionName}
									/>

									<Select
										label='Gym Area'
										options={gymAreas}
										value={gymArea}
										onChange={(value) => {
											setGymArea(value);
											setErrors({ ...errors, gymArea: '' });
										}}
										placeholder='Select gym area'
										error={errors.gymArea}
									/>

									{/* Workout selection before time so coach can base duration on plan */}
									<View className='mb-4 mt-2'>
										<Text className='text-text-primary font-semibold mb-2'>
											Workout Exercises
										</Text>
										<TouchableOpacity
											onPress={() => {
												console.log('Opening workout modal');
												// Remember that create modal was open and close it
												setWasCreateModalOpen(showCreateModal);
												setShowCreateModal(false);
												// Small delay to ensure modal closes before opening new one
												setTimeout(() => {
													setShowWorkoutModal(true);
												}, 300);
											}}
											activeOpacity={0.7}
											className='p-3 bg-bg-darker rounded-lg border border-[#F9C513]'
											style={{ borderWidth: 0.5 }}
										>
											<View className='flex-row items-center justify-between'>
												<View className='flex-row items-center'>
													<Ionicons name='barbell' size={20} color='#F9C513' />
													<Text className='text-text-primary ml-2'>
														{selectedWorkouts.length > 0
															? `${selectedWorkouts.length} exercise(s) selected`
															: 'Add Workout Exercises'}
													</Text>
												</View>
												<Ionicons
													name='chevron-forward'
													size={20}
													color='#8E8E93'
												/>
											</View>
										</TouchableOpacity>
										{selectedWorkouts.length > 0 && (
											<View className='mt-3'>
												{selectedWorkouts.map((workout, index) => (
													<View
														key={index}
														className='bg-bg-darker rounded-lg p-3 mb-2 border border-[#F9C513]'
														style={{ borderWidth: 0.5 }}
													>
														<View className='flex-row items-center justify-between mb-2'>
															<Text className='text-text-primary font-semibold flex-1'>
																{workout.name}
															</Text>
															<TouchableOpacity
																onPress={() => handleRemoveWorkout(index)}
																className='ml-2'
															>
																<Ionicons
																	name='close-circle'
																	size={20}
																	color='#FF3B30'
																/>
															</TouchableOpacity>
														</View>
														<View className='flex-row items-center gap-3 mt-2'>
															<View className='flex-1'>
																<Text className='text-text-secondary text-xs mb-1'>
																	Sets
																</Text>
																<TextInput
																	value={workout.sets}
																	onChangeText={(text) =>
																		handleUpdateWorkoutSets(index, text)
																	}
																	keyboardType='number-pad'
																	className='bg-bg-primary rounded-lg p-2 text-text-primary border border-[#F9C513]'
																	style={{ borderWidth: 0.5 }}
																/>
															</View>
															<View className='flex-1'>
																<Text className='text-text-secondary text-xs mb-1'>
																	Reps
																</Text>
																<TextInput
																	value={workout.reps}
																	onChangeText={(text) =>
																		handleUpdateWorkoutReps(index, text)
																	}
																	keyboardType='number-pad'
																	className='bg-bg-primary rounded-lg p-2 text-text-primary border border-[#F9C513]'
																	style={{ borderWidth: 0.5 }}
																/>
															</View>
														</View>
													</View>
												))}
											</View>
										)}
									</View>

									<DatePicker
										label='Session date *'
										sheetTitle='Session date'
										value={date}
										onChange={setDate}
										minimumDate={new Date()}
										error={errors.date}
									/>
									<Text className='text-text-secondary text-xs -mt-2 mb-3'>
										This is the calendar day only — start and end time are set
										below. New Session pre-fills from the day highlighted on your
										schedule.
									</Text>
									<TimePicker
										label='Start Time'
										value={startTime}
										minMinutes={sessionTimeBounds.min}
										maxMinutes={sessionTimeBounds.max}
										modalTitle='Start time'
										onChange={(time) => {
											setStartTime(time);
											setErrors({ ...errors, startTime: '' });
											if (time) {
												const suggestedEnd = suggestEndAfterStart(time);
												if (!endTime || endTime <= time) {
													setEndTime(suggestedEnd);
												}
											}
										}}
										placeholder='Select start time'
										error={errors.startTime}
									/>
									{preferredTimeLabel && (
										<Text className='text-text-secondary text-xs mt-1'>
											{preferredTimeLabel}
										</Text>
									)}
									<View className='mt-4'>
										<TimePicker
											label='End Time (Optional)'
											value={endTime}
											minMinutes={endTimePickerMinMinutes}
											maxMinutes={sessionTimeBounds.max}
											modalTitle='End time'
											onChange={setEndTime}
											placeholder='Select end time'
										/>
									</View>

									<Input
										label='Notes (Optional)'
										placeholder='Additional notes...'
										value={note}
										onChangeText={setNote}
										multiline
										numberOfLines={3}
									/>

									<GradientButton
										onPress={handleCreateSession}
										loading={creating}
										className='mt-4'
									>
										{isTemplate ? 'Create Template' : 'Create Session'}
									</GradientButton>
								</>
							)}
						</ScrollView>
					</View>
				</View>
			</Modal>

			{/* Progress Images Modal */}
			<Modal
				visible={showProgressImagesModal}
				animationType='slide'
				transparent
				onRequestClose={() => {
					setShowProgressImagesModal(false);
					setSelectedSessionForProgress(null);
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
									{selectedSessionForProgress && (
										<Text className='text-text-secondary text-sm mt-1'>
											{selectedSessionForProgress.name} -{' '}
											{formatDate(selectedSessionForProgress.date)}
										</Text>
									)}
								</View>
								<TouchableOpacity
									onPress={() => {
										setShowProgressImagesModal(false);
										setSelectedSessionForProgress(null);
									}}
								>
									<Ionicons name='close' size={28} color='#8E8E93' />
								</TouchableOpacity>
							</View>

							{sessionLogData?.getSessionLogBySessionId ? (
								<View>
									{sessionLogData.getSessionLogBySessionId.progressImages ? (
										<View>
											{sessionLogData.getSessionLogBySessionId.progressImages
												.front && (
												<View className='mb-4'>
													<Text className='text-text-primary font-semibold mb-2'>
														Front
													</Text>
													<Image
														source={{
															uri: sessionLogData.getSessionLogBySessionId
																.progressImages.front,
														}}
														style={{
															width: '100%',
															height: Dimensions.get('window').width * 0.8,
															borderRadius: 12,
															borderWidth: 0.5,
															borderColor: '#F9C513',
														}}
														resizeMode='cover'
													/>
												</View>
											)}
											{sessionLogData.getSessionLogBySessionId.progressImages
												.rightSide && (
												<View className='mb-4'>
													<Text className='text-text-primary font-semibold mb-2'>
														Right Side
													</Text>
													<Image
														source={{
															uri: sessionLogData.getSessionLogBySessionId
																.progressImages.rightSide,
														}}
														style={{
															width: '100%',
															height: Dimensions.get('window').width * 0.8,
															borderRadius: 12,
															borderWidth: 0.5,
															borderColor: '#F9C513',
														}}
														resizeMode='cover'
													/>
												</View>
											)}
											{sessionLogData.getSessionLogBySessionId.progressImages
												.leftSide && (
												<View className='mb-4'>
													<Text className='text-text-primary font-semibold mb-2'>
														Left Side
													</Text>
													<Image
														source={{
															uri: sessionLogData.getSessionLogBySessionId
																.progressImages.leftSide,
														}}
														style={{
															width: '100%',
															height: Dimensions.get('window').width * 0.8,
															borderRadius: 12,
															borderWidth: 0.5,
															borderColor: '#F9C513',
														}}
														resizeMode='cover'
													/>
												</View>
											)}
											{sessionLogData.getSessionLogBySessionId.progressImages
												.back && (
												<View className='mb-4'>
													<Text className='text-text-primary font-semibold mb-2'>
														Back
													</Text>
													<Image
														source={{
															uri: sessionLogData.getSessionLogBySessionId
																.progressImages.back,
														}}
														style={{
															width: '100%',
															height: Dimensions.get('window').width * 0.8,
															borderRadius: 12,
															borderWidth: 0.5,
															borderColor: '#F9C513',
														}}
														resizeMode='cover'
													/>
												</View>
											)}
											{sessionLogData.getSessionLogBySessionId.weight && (
												<View
													className='mb-4 p-4 bg-bg-darker rounded-xl border border-[#F9C513]'
													style={{ borderWidth: 0.5 }}
												>
													<Text className='text-text-primary font-semibold mb-1'>
														Weight
													</Text>
													<Text className='text-text-secondary text-lg'>
														{sessionLogData.getSessionLogBySessionId.weight} kg
													</Text>
												</View>
											)}
										</View>
									) : (
										<View className='items-center py-10'>
											<Ionicons
												name='images-outline'
												size={64}
												color='#8E8E93'
											/>
											<Text className='text-text-secondary mt-4 text-center'>
												No progress photos available yet
											</Text>
											<Text className='text-text-secondary text-sm mt-2 text-center'>
												The client hasn&apos;t completed this session yet
											</Text>
										</View>
									)}
								</View>
							) : (
								<PremiumLoadingContent embedded message='Please wait..' />
							)}
						</ScrollView>
					</View>
				</View>
			</Modal>

			{/* Workout Selection Modal */}
			<Modal
				visible={showWorkoutModal}
				animationType='slide'
				transparent={true}
				statusBarTranslucent={true}
				onRequestClose={() => {
					setShowWorkoutModal(false);
					// Reopen create modal if it was open before
					if (wasCreateModalOpen) {
						setTimeout(() => {
							setShowCreateModal(true);
							setWasCreateModalOpen(false);
						}, 300);
					}
				}}
			>
				<View className='flex-1 bg-bg-darker justify-end'>
					<View
						className='bg-bg-primary rounded-t-3xl border-t border-[#F9C513]'
						style={{ borderTopWidth: 0.5, maxHeight: '90%', minHeight: '85%' }}
					>
						<View className='p-5 pb-0'>
							<View className='flex-row justify-between items-center mb-6'>
								<Text className='text-2xl font-bold text-text-primary'>
									Select Workout Exercises
								</Text>
								<TouchableOpacity
									onPress={() => {
										setShowWorkoutModal(false);
										// Reopen create modal if it was open before
										if (wasCreateModalOpen) {
											setTimeout(() => {
												setShowCreateModal(true);
												setWasCreateModalOpen(false);
											}, 300);
										}
									}}
								>
									<Ionicons name='close' size={28} color='#8E8E93' />
								</TouchableOpacity>
							</View>
						</View>

						<ScrollView
							className='flex-1 px-5'
							showsVerticalScrollIndicator={false}
							contentContainerStyle={{ paddingBottom: 20 }}
						>
							{!apiKey ? (
								<View className='items-center py-10'>
									<Text className='text-text-secondary text-center'>
										Missing ExerciseDB API key. Please configure it in app.json
									</Text>
								</View>
							) : (
								<>
									<View className='mb-4'>
										<TextInput
											placeholder='Search by name, body part, or target muscle'
											placeholderTextColor='#8E8E93'
											value={searchWorkout}
											onChangeText={setSearchWorkout}
											className='bg-bg-darker rounded-lg p-3 text-text-primary border border-[#F9C513]'
											style={{ borderWidth: 0.5 }}
										/>
									</View>

									{categories.length > 0 && (
										<View className='mb-4'>
											<FlatList
												data={['all', ...categories]}
												keyExtractor={(item) => item}
												horizontal
												showsHorizontalScrollIndicator={false}
												renderItem={({ item }) => {
													const active = item === selectedCategory;
													const label =
														item === 'all'
															? 'All workouts'
															: item.replace(/(^\w|\s\w)/g, (m) =>
																	m.toUpperCase()
																);
													return (
														<TouchableOpacity
															onPress={() => {
																setSelectedCategory(item);
																fetchExercisesByCategory(item);
															}}
															className={`px-4 py-2 rounded-full mr-2 border ${
																active
																	? 'bg-[#F9C513] border-[#F9C513]'
																	: 'bg-bg-darker border-[#F9C513]'
															}`}
															style={{ borderWidth: 0.5 }}
														>
															<Text
																className={`text-sm ${
																	active
																		? 'text-bg-darker font-semibold'
																		: 'text-text-primary'
																}`}
															>
																{label}
															</Text>
														</TouchableOpacity>
													);
												}}
											/>
										</View>
									)}

									{isLoadingWorkouts ? (
										<PremiumLoadingContent embedded message='Please wait..' />
									) : (
										<View style={{ minHeight: 300 }}>
											<FlatList
												data={filteredExercises}
												keyExtractor={(item) => item.id}
												scrollEnabled={false}
												renderItem={({ item }) => {
													const isSelected = selectedWorkouts.some(
														(w) => w.id === item.id
													);
													const gifUrl = buildExerciseImageUrl(item.id);
													return (
														<TouchableOpacity
															onPress={() => {
																if (isSelected) {
																	setSelectedWorkouts(
																		selectedWorkouts.filter(
																			(w) => w.id !== item.id
																		)
																	);
																} else {
																	handleAddWorkout(item);
																}
															}}
															className={`p-3 rounded-lg mb-3 border ${
																isSelected
																	? 'bg-[#F9C513]/20 border-[#F9C513]'
																	: 'bg-bg-darker border-[#F9C513]'
															}`}
															style={{ borderWidth: 0.5 }}
														>
															<View className='flex-row items-center'>
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
																		{item.name}
																	</Text>
																	<Text className='text-text-secondary text-sm'>
																		{item.bodyPart} • {item.target}
																	</Text>
																	{item.equipment && (
																		<Text className='text-text-secondary text-xs mt-1'>
																			Equipment: {item.equipment}
																		</Text>
																	)}
																</View>
																{isSelected && (
																	<Ionicons
																		name='checkmark-circle'
																		size={24}
																		color='#F9C513'
																	/>
																)}
															</View>
														</TouchableOpacity>
													);
												}}
												ListEmptyComponent={
													<View
														className='items-center justify-center'
														style={{ minHeight: 300 }}
													>
														<Text className='text-text-secondary text-center'>
															No workouts found. Try a different search term.
														</Text>
													</View>
												}
											/>
										</View>
									)}

									{selectedWorkouts.length > 0 && (
										<View
											className='mt-4 pt-4 border-t border-[#F9C513]'
											style={{ borderTopWidth: 0.5 }}
										>
											<Text className='text-text-primary font-semibold mb-3'>
												Selected Exercises ({selectedWorkouts.length})
											</Text>
											<ScrollView
												horizontal
												showsHorizontalScrollIndicator={false}
											>
												{selectedWorkouts.map((workout, index) => (
													<View
														key={index}
														className='bg-bg-darker rounded-lg p-3 mr-2 border border-[#F9C513]'
														style={{ borderWidth: 0.5, minWidth: 120 }}
													>
														{workout.gifUrl && (
															<ExpoImage
																source={{ uri: workout.gifUrl }}
																style={{
																	width: 100,
																	height: 100,
																	borderRadius: 8,
																	marginBottom: 8,
																}}
																contentFit='cover'
															/>
														)}
														<Text
															className='text-text-primary font-semibold text-xs mb-2'
															numberOfLines={2}
														>
															{workout.name}
														</Text>
														<Text className='text-[#F9C513] text-xs'>
															{workout.sets} sets × {workout.reps} reps
														</Text>
													</View>
												))}
											</ScrollView>
										</View>
									)}
								</>
							)}
						</ScrollView>

						<View
							className='p-5 pt-4 border-t border-[#F9C513]'
							style={{ borderTopWidth: 0.5 }}
						>
							<GradientButton
								onPress={() => {
									setShowWorkoutModal(false);
									// Reopen create modal if it was open before
									if (wasCreateModalOpen) {
										setTimeout(() => {
											setShowCreateModal(true);
											setWasCreateModalOpen(false);
										}, 300);
									}
								}}
							>
								Done
							</GradientButton>
						</View>
					</View>
				</View>
			</Modal>

			<ConfirmModal
				visible={showCreateSessionSuccess}
				title='Session Created'
				message='Your new session has been scheduled successfully.'
				variant='success'
				confirmLabel='Got it'
				onConfirm={() => setShowCreateSessionSuccess(false)}
				onCancel={() => setShowCreateSessionSuccess(false)}
			/>

			<ConfirmModal
				visible={showTemplateSessionSuccess}
				title='Session Scheduled'
				message='The template was scheduled successfully for your selected clients.'
				variant='success'
				confirmLabel='Got it'
				onConfirm={() => setShowTemplateSessionSuccess(false)}
				onCancel={() => setShowTemplateSessionSuccess(false)}
			/>

			<Modal
				visible={!!classManageSession}
				animationType='slide'
				transparent
				onRequestClose={() => {
					setClassManageSession(null);
					classManageSessionIdRef.current = null;
					setInvitePickClients([]);
					setClassRosterInviteSearch('');
					setRosterConfirmedSearch('');
					setPendingCoachJoinKey(null);
					setRosterMorePending(false);
					setRosterMoreConfirmed(false);
					setRosterMoreInvited(false);
					setRosterMoreInviteList(false);
				}}
			>
				<View className='flex-1 bg-bg-darker justify-end'>
					<View
						className='bg-bg-primary rounded-t-3xl p-5 max-h-[85%] border-t border-[#F9C513]'
						style={{ borderTopWidth: 0.5 }}
					>
						<View className='flex-row justify-between items-center mb-4'>
							<Text className='text-xl font-bold text-text-primary'>Class roster</Text>
							<TouchableOpacity
								onPress={() => {
									setClassManageSession(null);
									classManageSessionIdRef.current = null;
									setInvitePickClients([]);
									setClassRosterInviteSearch('');
									setRosterConfirmedSearch('');
									setPendingCoachJoinKey(null);
									setRosterMorePending(false);
									setRosterMoreConfirmed(false);
									setRosterMoreInvited(false);
									setRosterMoreInviteList(false);
								}}
							>
								<Ionicons name='close' size={28} color='#8E8E93' />
							</TouchableOpacity>
						</View>
						<ScrollView
							showsVerticalScrollIndicator={false}
							keyboardShouldPersistTaps='handled'
							nestedScrollEnabled
						>
							{(() => {
								const enrollments = classManageSession?.enrollments || [];
								const pendingRaw = enrollments.filter((e: any) => e.status === 'pending');
								const pendingSeen = new Set<string>();
								const pending = pendingRaw.filter((e: any) => {
									const id = String(e.clientId || '');
									if (!id || pendingSeen.has(id)) return false;
									pendingSeen.add(id);
									return true;
								});
								const invited = enrollments.filter((e: any) => e.status === 'invited');
								const confirmedRaw = classManageSession?.clients || [];
								const seenClient = new Set<string>();
								const confirmed = confirmedRaw.filter((c: any) => {
									if (!c?.id || seenClient.has(c.id)) return false;
									seenClient.add(c.id);
									return true;
								});
								const qRoster = normalizeInviteSearchText(rosterConfirmedSearch);
								const confirmedFiltered = !qRoster
									? confirmed
									: confirmed.filter((c: any) =>
											memberMatchesInviteSearch(c, rosterConfirmedSearch)
										);
								const maxP =
									classManageSession?.maxParticipants != null
										? Number(classManageSession.maxParticipants)
										: null;
								const enrolleeName = (e: any) =>
									e.client?.firstName || e.client?.lastName
										? `${e.client?.firstName ?? ''} ${e.client?.lastName ?? ''}`.trim()
										: `Member (${String(e.clientId).slice(-6)})`;

								const pendingShown = rosterMorePending
									? pending
									: pending.slice(0, ROSTER_SECTION_PREVIEW);
								const confirmedShown = rosterMoreConfirmed
									? confirmedFiltered
									: confirmedFiltered.slice(0, ROSTER_SECTION_PREVIEW);
								const invitedShown = rosterMoreInvited
									? invited
									: invited.slice(0, ROSTER_SECTION_PREVIEW);
								const inviteClientsShown = rosterMoreInviteList
									? filteredInviteClients
									: filteredInviteClients.slice(0, ROSTER_INVITE_PREVIEW);

								const sectionHeader = (
									title: string,
									count: number,
									expanded: boolean,
									onToggle: () => void,
									subtitle?: string,
									alertRow?: boolean
								) => (
									<TouchableOpacity
										onPress={onToggle}
										activeOpacity={0.75}
										className={`flex-row items-center justify-between py-2.5 px-2 rounded-xl mb-1 ${
											alertRow && count > 0 ? 'bg-[#FF9F0A]/12' : ''
										}`}
									>
										<View className='flex-1 pr-2'>
											<Text className='text-text-primary font-semibold text-base'>{title}</Text>
											{subtitle ? (
												<Text className='text-text-secondary text-xs mt-0.5'>{subtitle}</Text>
											) : null}
										</View>
										<View className='flex-row items-center gap-2'>
											<View
												className={`min-w-[32px] px-2 py-1 rounded-full items-center ${
													count > 0 ? 'bg-[#F9C513]/22' : 'bg-bg-darker border border-[#F9C513]/40'
												}`}
												style={{ borderWidth: count > 0 ? 0 : 0.5 }}
											>
												<Text
													className={`text-xs font-bold ${
														count > 0 ? 'text-[#F9C513]' : 'text-text-secondary'
													}`}
												>
													{count}
												</Text>
											</View>
											<Ionicons
												name={expanded ? 'chevron-up' : 'chevron-down'}
												size={22}
												color='#8E8E93'
											/>
										</View>
									</TouchableOpacity>
								);

								const spotsLine =
									maxP != null && !Number.isNaN(maxP)
										? `${confirmed.length} / ${maxP} spots filled`
										: `${confirmed.length} on roster`;

								return (
									<>
										<Text className='text-text-primary font-semibold text-lg mb-1'>
											{classManageSession?.name}
										</Text>
										<Text className='text-text-secondary text-sm mb-3'>
											{classManageSession?.date
												? formatDate(classManageSession.date)
												: ''}
											{classManageSession?.startTime
												? ` · ${formatTimeTo12Hour(classManageSession.startTime)}`
												: ''}
										</Text>

										<View className='flex-row flex-wrap gap-2 mb-4'>
											<View className='bg-bg-darker px-3 py-1.5 rounded-full border border-[#F9C513]/50'>
												<Text className='text-text-primary text-xs font-medium'>{spotsLine}</Text>
											</View>
											{pending.length > 0 ? (
												<View className='bg-[#FF9F0A]/18 px-3 py-1.5 rounded-full border border-[#FF9F0A]/35'>
													<Text className='text-[#FF9F0A] text-xs font-semibold'>
														{pending.length} need action
													</Text>
												</View>
											) : null}
											{invited.length > 0 ? (
												<View className='bg-bg-darker px-3 py-1.5 rounded-full border border-[#F9C513]/50'>
													<Text className='text-text-secondary text-xs'>
														{invited.length} invite{invited.length === 1 ? '' : 's'} out
													</Text>
												</View>
											) : null}
										</View>

										<View className='h-px bg-[#F9C513]/25 mb-3' />

										{sectionHeader(
											'Join requests',
											pending.length,
											rosterExpandRequests,
											() => setRosterExpandRequests((v) => !v),
											'Accept or decline people who asked to join',
											true
										)}
										{rosterExpandRequests ? (
											pending.length === 0 ? (
												<Text className='text-text-secondary text-sm mb-4 pl-1'>
													No pending requests.
												</Text>
											) : (
												<View className='mb-4'>
													<ScrollView
														nestedScrollEnabled
														keyboardShouldPersistTaps='handled'
														style={{
															maxHeight:
																pending.length > ROSTER_SECTION_PREVIEW || rosterMorePending
																	? ROSTER_LIST_MAX_HEIGHT
																	: undefined,
														}}
														showsVerticalScrollIndicator={pending.length > 3}
													>
														{pendingShown.map((e: any) => (
															<View
																key={e.clientId}
																className='bg-bg-darker rounded-xl p-2.5 mb-2 border border-[#F9C513]/60'
																style={{ borderWidth: 0.5 }}
															>
																<Text className='text-text-primary font-medium text-[15px]'>
																	{enrolleeName(e)}
																</Text>
																<Text className='text-text-secondary text-xs mt-0.5'>
																	Requested to join
																</Text>
																<View className='flex-row gap-2 mt-2'>
																	<TouchableOpacity
																		onPress={() => {
																			if (!classManageSession?.id) return;
																			const cid = e.clientId;
																			setPendingCoachJoinKey(`${cid}:accept`);
																			coachRespondJoin({
																				variables: {
																					sessionId: classManageSession.id,
																					clientId: cid,
																					accept: true,
																				},
																			})
																				.catch(() => {})
																				.finally(() => setPendingCoachJoinKey(null));
																		}}
																		disabled={pendingCoachJoinKey !== null}
																		className='flex-1 bg-[#22C55E]/20 py-2.5 rounded-lg items-center justify-center min-h-[40px]'
																		style={{
																			opacity: pendingCoachJoinKey !== null ? 0.55 : 1,
																		}}
																	>
																		{pendingCoachJoinKey === `${e.clientId}:accept` ? (
																			<ActivityIndicator color='#22C55E' size='small' />
																		) : (
																			<Text className='text-[#22C55E] font-semibold text-sm'>
																				Accept
																			</Text>
																		)}
																	</TouchableOpacity>
																	<TouchableOpacity
																		onPress={() => {
																			if (!classManageSession?.id) return;
																			const cid = e.clientId;
																			setPendingCoachJoinKey(`${cid}:reject`);
																			coachRespondJoin({
																				variables: {
																					sessionId: classManageSession.id,
																					clientId: cid,
																					accept: false,
																				},
																			})
																				.catch(() => {})
																				.finally(() => setPendingCoachJoinKey(null));
																		}}
																		disabled={pendingCoachJoinKey !== null}
																		className='flex-1 bg-[#FF3B30]/20 py-2.5 rounded-lg items-center justify-center min-h-[40px]'
																		style={{
																			opacity: pendingCoachJoinKey !== null ? 0.55 : 1,
																		}}
																	>
																		{pendingCoachJoinKey === `${e.clientId}:reject` ? (
																			<ActivityIndicator color='#FF3B30' size='small' />
																		) : (
																			<Text className='text-[#FF3B30] font-semibold text-sm'>
																				Decline
																			</Text>
																		)}
																	</TouchableOpacity>
																</View>
															</View>
														))}
													</ScrollView>
													{pending.length > ROSTER_SECTION_PREVIEW ? (
														<TouchableOpacity
															onPress={() => setRosterMorePending((m) => !m)}
															className='py-2 items-center'
														>
															<Text className='text-[#F9C513] text-sm font-semibold'>
																{rosterMorePending
																	? 'Show fewer'
																	: `Show all ${pending.length} requests`}
															</Text>
														</TouchableOpacity>
													) : null}
												</View>
											)
										) : (
											<View className='mb-3' />
										)}

										<View className='h-px bg-[#F9C513]/25 mb-2' />

										{sectionHeader(
											'Confirmed on roster',
											confirmed.length,
											rosterExpandRoster,
											() => setRosterExpandRoster((v) => !v),
											spotsLine
										)}
										{rosterExpandRoster ? (
											confirmed.length === 0 ? (
												<Text className='text-text-secondary text-sm mb-4 pl-1'>
													No one confirmed yet.
												</Text>
											) : (
												<View className='mb-4'>
													<Text className='text-text-secondary text-xs mb-1.5 pl-0.5'>
														Filter roster
													</Text>
													<TextInput
														value={rosterConfirmedSearch}
														onChangeText={setRosterConfirmedSearch}
														placeholder='Name, email, or phone'
														placeholderTextColor='#8E8E93'
														autoCorrect={false}
														autoCapitalize='none'
														className='bg-bg-darker rounded-xl px-3 py-2.5 mb-2 border border-[#F9C513]/50'
														style={{ borderWidth: 0.5, color: '#F2F2F7' }}
													/>
													{confirmedFiltered.length === 0 ? (
														<Text className='text-text-secondary text-sm mb-2 pl-1'>
															No matches for this search.
														</Text>
													) : (
														<ScrollView
															nestedScrollEnabled
															style={{
																maxHeight:
																	confirmedFiltered.length > ROSTER_SECTION_PREVIEW ||
																	rosterMoreConfirmed
																		? ROSTER_LIST_MAX_HEIGHT
																		: undefined,
															}}
															showsVerticalScrollIndicator={confirmedFiltered.length > 4}
														>
															{confirmedShown.map((c: any) => (
																<View
																	key={c.id}
																	className='bg-bg-darker rounded-xl px-3 py-2 mb-1.5 border border-[#F9C513]/40 flex-row items-center'
																	style={{ borderWidth: 0.5 }}
																>
																	<View className='flex-1 min-w-0 pr-2'>
																		<Text
																			className='text-text-primary font-medium'
																			numberOfLines={1}
																		>
																			{c.firstName} {c.lastName}
																		</Text>
																		{c.email ? (
																			<Text
																				className='text-text-secondary text-xs mt-0.5'
																				numberOfLines={1}
																			>
																				{c.email}
																			</Text>
																		) : null}
																	</View>
																	<TouchableOpacity
																		disabled={removingRosterClient}
																		onPress={() =>
																			setRemoveRosterMember({
																				id: c.id,
																				name: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim(),
																			})
																		}
																		className='bg-[#FF3B30]/18 px-2.5 py-1.5 rounded-lg border border-[#FF3B30]/40'
																		style={{ opacity: removingRosterClient ? 0.5 : 1 }}
																	>
																		<Text className='text-[#FF3B30] text-xs font-semibold'>
																			Remove
																		</Text>
																	</TouchableOpacity>
																</View>
															))}
														</ScrollView>
													)}
													{confirmedFiltered.length > ROSTER_SECTION_PREVIEW ? (
														<TouchableOpacity
															onPress={() => setRosterMoreConfirmed((m) => !m)}
															className='py-2 items-center'
														>
															<Text className='text-[#F9C513] text-sm font-semibold'>
																{rosterMoreConfirmed
																	? 'Show fewer'
																	: `Show all ${confirmedFiltered.length}`}
															</Text>
														</TouchableOpacity>
													) : null}
												</View>
											)
										) : (
											<View className='mb-3' />
										)}

										<View className='h-px bg-[#F9C513]/25 mb-2' />

										<Text className='text-text-primary font-semibold text-base mb-1'>
											Invite more
										</Text>
										<Text className='text-text-secondary text-xs mb-2'>
											Search any member to invite. Not assigned to you is only a label — you can still
											select and invite them.
											{invitePickClients.length > 0 ? (
												<Text className='text-[#F9C513] font-semibold'>
													{' '}
													({invitePickClients.length} selected)
												</Text>
											) : null}
										</Text>
										<TextInput
											value={classRosterInviteSearch}
											onChangeText={setClassRosterInviteSearch}
											placeholder='Name, email, or phone'
											placeholderTextColor='#8E8E93'
											autoCorrect={false}
											autoCapitalize='none'
											className='bg-bg-darker rounded-xl px-3 py-2.5 mb-2 border border-[#F9C513]/60'
											style={{ borderWidth: 0.5, color: '#F2F2F7' }}
										/>
										{filteredInviteClients.length === 0 ? (
											<Text className='text-text-secondary text-sm mb-3 pl-0.5'>
												{classRosterInviteSearch.trim()
													? 'No matches.'
													: 'No one left to invite here.'}
											</Text>
										) : (
											<View className='mb-2'>
												<Text className='text-text-secondary text-xs mb-1.5'>
													{filteredInviteClients.length} result
													{filteredInviteClients.length === 1 ? '' : 's'}
													{filteredInviteClients.length > ROSTER_INVITE_PREVIEW &&
													!rosterMoreInviteList
														? ` · showing ${ROSTER_INVITE_PREVIEW}`
														: ''}
												</Text>
												<ScrollView
													nestedScrollEnabled
													keyboardShouldPersistTaps='handled'
													style={{
														maxHeight:
															filteredInviteClients.length > 3 ||
															rosterMoreInviteList
																? ROSTER_LIST_MAX_HEIGHT
																: undefined,
													}}
													showsVerticalScrollIndicator={
														filteredInviteClients.length > 4 || rosterMoreInviteList
													}
												>
													{inviteClientsShown.map((client: any) => {
														const cid = String(client.id);
														const isOnCoachClientList = assignableClientIds.has(cid);
														const picked = invitePickClients.some(
															(id) => String(id) === cid
														);
														return (
															<TouchableOpacity
																key={cid}
																activeOpacity={0.7}
																onPress={() => {
																	if (picked) {
																		setInvitePickClients(
																			invitePickClients.filter(
																				(id) => String(id) !== cid
																			)
																		);
																	} else {
																		setInvitePickClients([...invitePickClients, cid]);
																	}
																}}
																className={`rounded-xl px-3 py-2 mb-1.5 border ${
																	picked
																		? 'bg-[#F9C513]/20 border-[#F9C513]'
																		: 'bg-bg-darker border-[#F9C513]/45'
																}`}
																style={{ borderWidth: 0.5 }}
															>
																<Text
																	className='text-text-primary font-medium'
																	numberOfLines={1}
																>
																	{client.firstName}{' '}
																	{client.middleName ? `${client.middleName} ` : ''}
																	{client.lastName}
																</Text>
																{client.email ? (
																	<Text
																		className='text-text-secondary text-xs mt-0.5'
																		numberOfLines={1}
																	>
																		{client.email}
																	</Text>
																) : null}
																{!isOnCoachClientList ? (
																	<Text className='text-[#FF9F0A] text-xs mt-0.5'>
																		Not assigned to you
																	</Text>
																) : null}
															</TouchableOpacity>
														);
													})}
												</ScrollView>
												{filteredInviteClients.length > ROSTER_INVITE_PREVIEW ? (
													<TouchableOpacity
														onPress={() => setRosterMoreInviteList((m) => !m)}
														className='py-2 items-center'
													>
														<Text className='text-[#F9C513] text-sm font-semibold'>
															{rosterMoreInviteList
																? 'Show fewer results'
																: `Show all ${filteredInviteClients.length} results`}
														</Text>
													</TouchableOpacity>
												) : null}
											</View>
										)}
										<GradientButton
											onPress={() => {
												if (!classManageSession || invitePickClients.length === 0) {
													setAlertModal({
														visible: true,
														title: 'Select clients',
														message: 'Pick at least one client to invite.',
														variant: 'warning',
													});
													return;
												}
												inviteClientsToClass({
													variables: {
														sessionId: classManageSession.id,
														clientIds: invitePickClients.map(String),
													},
												});
											}}
											className='mt-1 mb-3'
										>
											Send invitations
										</GradientButton>

										<View className='h-px bg-[#F9C513]/25 mb-2' />

										{sectionHeader(
											'Awaiting invite response',
											invited.length,
											rosterExpandInvited,
											() => setRosterExpandInvited((v) => !v),
											'Invited — not yet accepted'
										)}
										{rosterExpandInvited ? (
											invited.length === 0 ? (
												<Text className='text-text-secondary text-sm mb-8 pl-1'>
													No pending invites.
												</Text>
											) : (
												<View className='mb-8'>
													<ScrollView
														nestedScrollEnabled
														style={{
															maxHeight:
																invited.length > ROSTER_SECTION_PREVIEW || rosterMoreInvited
																	? ROSTER_LIST_MAX_HEIGHT
																	: undefined,
														}}
														showsVerticalScrollIndicator={invited.length > 4}
													>
														{invitedShown.map((e: any) => (
															<View
																key={e.clientId}
																className='bg-bg-darker rounded-xl px-3 py-2 mb-1.5 border border-[#F9C513]/40'
																style={{ borderWidth: 0.5 }}
															>
																<Text
																	className='text-text-primary font-medium'
																	numberOfLines={1}
																>
																	{enrolleeName(e)}
																</Text>
																<Text className='text-text-secondary text-xs mt-0.5'>
																	Invite pending
																</Text>
															</View>
														))}
													</ScrollView>
													{invited.length > ROSTER_SECTION_PREVIEW ? (
														<TouchableOpacity
															onPress={() => setRosterMoreInvited((m) => !m)}
															className='py-2 items-center'
														>
															<Text className='text-[#F9C513] text-sm font-semibold'>
																{rosterMoreInvited
																	? 'Show fewer'
																	: `Show all ${invited.length}`}
															</Text>
														</TouchableOpacity>
													) : null}
												</View>
											)
										) : (
											<View className='h-8' />
										)}
									</>
								);
							})()}
						</ScrollView>
					</View>
				</View>
			</Modal>

			<ConfirmModal
				visible={!!sessionToCancel}
				title='Cancel Session'
				message={
					sessionToCancel
						? `Are you sure you want to cancel "${sessionToCancel.name}" on ${formatDate(sessionToCancel.date)}?`
						: ''
				}
				variant='danger'
				confirmLabel='Cancel'
				cancelLabel='Keep'
				onConfirm={() => {
					if (sessionToCancel) {
						cancelSession({ variables: { id: sessionToCancel.id } });
					}
					setSessionToCancel(null);
				}}
				onCancel={() => setSessionToCancel(null)}
			/>
			<ConfirmModal
				visible={!!removeRosterMember}
				title='Remove from class?'
				message={
					removeRosterMember
						? `Remove ${removeRosterMember.name} from this class roster? They can request to join again later.`
						: ''
				}
				variant='danger'
				confirmLabel='Remove'
				loading={removingRosterClient}
				onCancel={() => {
					if (!removingRosterClient) setRemoveRosterMember(null);
				}}
				onConfirm={() => {
					if (!removeRosterMember || !classManageSession?.id) return;
					removeClientFromClass({
						variables: {
							sessionId: classManageSession.id,
							clientId: removeRosterMember.id,
						},
					});
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

export default CoachSchedule;
