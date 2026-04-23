import FixedView from '@/components/FixedView';
import TabHeader from '@/components/TabHeader';
import { useAuth } from '@/contexts/AuthContext';
import { GET_ATTENDANCE_RECORDS_QUERY, ME_QUERY } from '@/graphql/queries';
import { useApolloClient, useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setUser } from '@/store/slices/userSlice';
import { convertGraphQLUser } from '@/utils/graphql-utils';
import {
	RefreshControl,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDateYmd(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function getMonthBounds(monthDate: Date): { startDate: string; endDate: string } {
	const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
	const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
	return {
		startDate: formatDateYmd(start),
		endDate: formatDateYmd(end),
	};
}

const CoachAttendance = () => {
	const { user } = useAuth();
	const client = useApolloClient();
	const dispatch = useDispatch();
	const [refreshing, setRefreshing] = useState(false);
	const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
	const [selectedMonth, setSelectedMonth] = useState(() => new Date());

	const attendanceId = user?.attendanceId?.toString();
	const selectedMonthBounds = useMemo(() => getMonthBounds(selectedMonth), [selectedMonth]);

	useFocusEffect(
		useCallback(() => {
			let cancelled = false;
			(async () => {
				try {
					const { data } = await client.query({
						query: ME_QUERY,
						fetchPolicy: 'network-only',
					});
					if (!cancelled && data?.me) {
						dispatch(setUser(convertGraphQLUser(data.me as any)));
					}
				} catch {
					/* ignore */
				}
			})();
			return () => {
				cancelled = true;
			};
		}, [client, dispatch])
	);

	const { data, loading, error, refetch } = useQuery(GET_ATTENDANCE_RECORDS_QUERY, {
		variables: {
			filter: attendanceId
				? {
						cardNo: attendanceId,
					}
				: undefined,
			pagination: {
				limit: 100,
				offset: 0,
			},
		},
		skip: !user?.id,
		fetchPolicy: 'cache-and-network',
	});

	const { data: monthlyData, refetch: refetchMonthly } = useQuery(GET_ATTENDANCE_RECORDS_QUERY, {
		variables: {
			filter: attendanceId
				? {
						cardNo: attendanceId,
						startDate: selectedMonthBounds.startDate,
						endDate: selectedMonthBounds.endDate,
					}
				: undefined,
			pagination: {
				limit: 1000,
				offset: 0,
			},
		},
		skip: !user?.id || !attendanceId,
		fetchPolicy: 'cache-and-network',
	});

	const onRefresh = async () => {
		setRefreshing(true);
		try {
			await Promise.all([refetch(), refetchMonthly()]);
		} finally {
			setRefreshing(false);
		}
	};

	const records = useMemo(() => {
		return (data as any)?.getAttendanceRecords?.records || [];
	}, [data]);

	const totalCount = useMemo(() => {
		return (data as any)?.getAttendanceRecords?.totalCount || 0;
	}, [data]);

	const sortedRecords = useMemo(() => {
		return [...records].sort((a, b) => {
			const dateTimeA = a.authDateTime || `${a.authDate}T${a.authTime || '00:00:00'}`;
			const dateTimeB = b.authDateTime || `${b.authDate}T${b.authTime || '00:00:00'}`;
			return new Date(dateTimeA).getTime() - new Date(dateTimeB).getTime();
		});
	}, [records]);

	const groupedRecords = useMemo(() => {
		const grouped: Record<string, any[]> = {};
		sortedRecords.forEach((record: any) => {
			const date = record.authDate || record.authDateTime?.split('T')[0];
			if (date) {
				if (!grouped[date]) {
					grouped[date] = [];
				}
				grouped[date].push(record);
			}
		});

		// Sort dates descending
		const sortedDates = Object.keys(grouped).sort((a, b) => {
			return new Date(b).getTime() - new Date(a).getTime();
		});

		sortedDates.forEach((date) => {
			grouped[date].sort((a, b) => {
				const timeA = a.authTime || a.authDateTime?.split('T')[1] || '';
				const timeB = b.authTime || b.authDateTime?.split('T')[1] || '';
				return timeB.localeCompare(timeA);
			});
		});

		return { grouped, sortedDates };
	}, [sortedRecords]);

	const monthlyCalendar = useMemo(() => {
		const recordsForMonth = (monthlyData as any)?.getAttendanceRecords?.records || [];
		const checkedInDays = new Set<string>();
		const monthStateByDate = new Map<string, 'checked-in' | 'not-checked-in'>();
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

		recordsForMonth.forEach((record: any) => {
			const dateKey = record.authDate || record.authDateTime?.split('T')[0];
			if (!dateKey) return;
			if ((record.direction || '').toUpperCase() === 'IN') {
				checkedInDays.add(dateKey);
			}
		});

		const year = selectedMonth.getFullYear();
		const month = selectedMonth.getMonth();
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		let checkedInCount = 0;
		let notCheckedInCount = 0;

		for (let day = 1; day <= daysInMonth; day += 1) {
			const currentDate = new Date(year, month, day);
			const dateKey = formatDateYmd(currentDate);
			if (currentDate.getTime() > today.getTime()) continue;
			const status = checkedInDays.has(dateKey) ? 'checked-in' : 'not-checked-in';
			monthStateByDate.set(dateKey, status);
			if (status === 'checked-in') checkedInCount += 1;
			else notCheckedInCount += 1;
		}

		const totalTrackable = checkedInCount + notCheckedInCount;
		const attendanceRate = totalTrackable > 0 ? Math.round((checkedInCount / totalTrackable) * 100) : 0;
		return { monthStateByDate, checkedInCount, notCheckedInCount, attendanceRate };
	}, [monthlyData, selectedMonth]);

	const monthGridDays = useMemo(() => {
		const year = selectedMonth.getFullYear();
		const month = selectedMonth.getMonth();
		const firstDay = new Date(year, month, 1).getDay();
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const leading = Array.from({ length: firstDay }, () => null);
		const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
		return [...leading, ...days];
	}, [selectedMonth]);

	const monthLabel = useMemo(() => {
		return selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
	}, [selectedMonth]);

	const goToPreviousMonth = () => {
		setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
	};

	const goToNextMonth = () => {
		setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
	};

	const formatDate = (dateString: string) => {
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
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	const formatTime = (timeString?: string | null) => {
		if (!timeString) return 'N/A';
		if (timeString.includes(':')) {
			const [hours, minutes] = timeString.split(':');
			const hour = parseInt(hours);
			const ampm = hour >= 12 ? 'PM' : 'AM';
			const hour12 = hour % 12 || 12;
			return `${hour12}:${minutes} ${ampm}`;
		}
		return timeString;
	};

	if (!attendanceId) {
		return (
			<FixedView className='flex-1 bg-bg-darker'>
				<TabHeader showCoachIcon={false} />
				<View className='flex-1 items-center justify-center p-5'>
					<Ionicons name='alert-circle-outline' size={64} color='#8E8E93' />
					<Text className='text-text-primary text-xl font-semibold mt-4 text-center'>
						No Attendance ID
					</Text>
					<Text className='text-text-secondary text-sm mt-2 text-center'>
						Your account does not have an attendance ID assigned. Please contact support.
					</Text>
				</View>
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
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor='#F9C513' />
				}
			>
				<View className='mb-6'>
					<Text className='text-3xl font-bold text-text-primary'>
						My Attendance
					</Text>
					<Text className='text-text-secondary mt-1'>
						Attendance ID: {attendanceId}
					</Text>
					{totalCount > 0 && (
						<Text className='text-text-secondary text-sm mt-1'>
							{totalCount} record{totalCount !== 1 ? 's' : ''} found
						</Text>
					)}
				</View>
				<View className='mb-6 rounded-xl border border-[#F9C513]/30 bg-bg-primary p-4'>
					<View className='mb-4 flex-row items-center justify-between'>
						<Text className='text-text-primary text-lg font-semibold'>Attendance Calendar</Text>
						<View className='flex-row items-center gap-2'>
							<TouchableOpacity
								onPress={goToPreviousMonth}
								activeOpacity={0.8}
								className='h-8 w-8 items-center justify-center rounded-lg border border-[#F9C513]/40 bg-[#F9C513]/10'
							>
								<Ionicons name='chevron-back' size={16} color='#F9C513' />
							</TouchableOpacity>
							<TouchableOpacity
								onPress={goToNextMonth}
								activeOpacity={0.8}
								className='h-8 w-8 items-center justify-center rounded-lg border border-[#F9C513]/40 bg-[#F9C513]/10'
							>
								<Ionicons name='chevron-forward' size={16} color='#F9C513' />
							</TouchableOpacity>
						</View>
					</View>
					<Text className='mb-3 text-text-secondary text-sm'>{monthLabel}</Text>

					<View className='mb-2 flex-row'>
						{WEEKDAY_LABELS.map((day) => (
							<View key={day} className='flex-1 items-center py-1'>
								<Text className='text-text-secondary text-xs font-medium'>{day}</Text>
							</View>
						))}
					</View>

					<View className='flex-row flex-wrap'>
						{monthGridDays.map((day, index) => {
							if (!day) {
								return <View key={`blank-${index}`} className='h-10 w-[14.28%]' />;
							}
							const dateKey = formatDateYmd(
								new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day)
							);
							const status = monthlyCalendar.monthStateByDate.get(dateKey);
							const dayBaseStyle = 'h-9 w-9 items-center justify-center rounded-full';
							const dayStyle =
								status === 'checked-in'
									? `${dayBaseStyle} bg-green-500/20 border border-green-500/40`
									: status === 'not-checked-in'
										? `${dayBaseStyle} bg-red-500/20 border border-red-500/40`
										: `${dayBaseStyle} bg-bg-darker border border-transparent`;
							return (
								<View key={dateKey} className='h-10 w-[14.28%] items-center justify-center'>
									<View className={dayStyle}>
										<Text className='text-text-primary text-xs font-medium'>{day}</Text>
									</View>
								</View>
							);
						})}
					</View>

					<View className='mt-4 flex-row gap-2'>
						<View className='flex-1 rounded-lg border border-green-500/35 bg-green-500/10 p-2'>
							<Text className='text-[11px] uppercase tracking-wide text-text-secondary'>
								Checked-in
							</Text>
							<Text className='text-green-400 text-lg font-semibold'>
								{monthlyCalendar.checkedInCount}
							</Text>
						</View>
						<View className='flex-1 rounded-lg border border-red-500/35 bg-red-500/10 p-2'>
							<Text className='text-[11px] uppercase tracking-wide text-text-secondary'>
								Not checked-in
							</Text>
							<Text className='text-red-400 text-lg font-semibold'>
								{monthlyCalendar.notCheckedInCount}
							</Text>
						</View>
						<View className='flex-1 rounded-lg border border-[#F9C513]/35 bg-[#F9C513]/10 p-2'>
							<Text className='text-[11px] uppercase tracking-wide text-text-secondary'>
								Rate
							</Text>
							<Text className='text-[#F9C513] text-lg font-semibold'>
								{monthlyCalendar.attendanceRate}%
							</Text>
						</View>
					</View>

					<View className='mt-3 flex-row flex-wrap gap-2'>
						<View className='flex-row items-center gap-1 rounded-full border border-green-500/35 bg-green-500/10 px-2 py-1'>
							<View className='h-2.5 w-2.5 rounded-full bg-green-400' />
							<Text className='text-[11px] text-green-300'>Checked-in day</Text>
						</View>
						<View className='flex-row items-center gap-1 rounded-full border border-red-500/35 bg-red-500/10 px-2 py-1'>
							<View className='h-2.5 w-2.5 rounded-full bg-red-400' />
							<Text className='text-[11px] text-red-300'>Not checked-in day</Text>
						</View>
					</View>
				</View>

				{loading && !data ? (
					<View className='items-center justify-center py-10 bg-bg-primary rounded-xl border border-[#F9C513]/20'>
						<Text className='text-text-secondary'>Loading attendance records...</Text>
					</View>
				) : error ? (
					<View className='items-center justify-center py-10 bg-bg-primary rounded-xl border border-red-500/20'>
						<Ionicons name='alert-circle-outline' size={48} color='#FF3B30' />
						<Text className='text-red-400 font-semibold mt-4 text-center'>
							Unable to Load Attendance Records
						</Text>
						<Text className='text-text-secondary text-sm mt-2 text-center'>
							{error.message}
						</Text>
					</View>
				) : records.length === 0 ? (
					<View className='bg-bg-primary rounded-xl p-6 items-center border border-[#F9C513]/20'>
						<Ionicons name='calendar-outline' size={48} color='#8E8E93' />
						<Text className='text-text-secondary mt-4 text-center'>
							No attendance records found
						</Text>
					</View>
				) : (
					<View className='gap-4'>
						{groupedRecords.sortedDates.map((date) => {
							const isExpanded = expandedDates.has(date);
							const toggleDate = () => {
								setExpandedDates((prev) => {
									const newSet = new Set(prev);
									if (isExpanded) {
										newSet.delete(date);
									} else {
										newSet.add(date);
									}
									return newSet;
								});
							};

							return (
								<View
									key={date}
									className='bg-bg-primary rounded-xl p-4 border border-[#F9C513]/20'
								>
									<TouchableOpacity
										onPress={toggleDate}
										activeOpacity={0.7}
										className='flex-row items-center mb-3 pb-3 border-b border-bg-darker/30'
									>
										<View className='bg-[#F9C513]/20 rounded-lg p-2 mr-3'>
											<Ionicons name='calendar' size={20} color='#F9C513' />
										</View>
										<View className='flex-1'>
											<Text className='text-text-primary font-semibold text-base'>
												{formatDate(date)}
											</Text>
											<Text className='text-text-secondary text-xs mt-1'>
												{groupedRecords.grouped[date].length} record
												{groupedRecords.grouped[date].length !== 1 ? 's' : ''}
											</Text>
										</View>
										<Ionicons
											name={isExpanded ? 'chevron-up' : 'chevron-down'}
											size={24}
											color='#F9C513'
										/>
									</TouchableOpacity>

									{isExpanded && (
										<View className='gap-2'>
											{groupedRecords.grouped[date].map((record: any, index: number) => (
												<View
													key={record.id || index}
													className='bg-bg-darker rounded-lg p-3 flex-row items-center justify-between'
												>
													<View className='flex-1'>
														<View className='flex-row items-center mb-1'>
															<Ionicons
																name={
																	record.direction === 'IN'
																		? 'log-in-outline'
																		: 'log-out-outline'
																}
																size={18}
																color={
																	record.direction === 'IN' ? '#4CAF50' : '#FF9800'
																}
															/>
															<Text
																className={`font-semibold ml-2 ${
																	record.direction === 'IN'
																		? 'text-green-400'
																		: 'text-orange-400'
																}`}
															>
																{record.direction || 'UNKNOWN'}
															</Text>
														</View>
														<Text className='text-text-secondary text-sm'>
															{formatTime(record.authTime || record.authDateTime)}
														</Text>
														{record.deviceName && (
															<Text className='text-text-secondary text-xs mt-1'>
																{record.deviceName}
															</Text>
														)}
													</View>
												</View>
											))}
										</View>
									)}
								</View>
							);
						})}
					</View>
				)}
			</ScrollView>
		</FixedView>
	);
};

export default CoachAttendance;

