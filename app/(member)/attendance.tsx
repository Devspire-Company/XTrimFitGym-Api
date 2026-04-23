import { PremiumLoadingContent } from '@/components/AuthProcessingScreen';
import FixedView from '@/components/FixedView';
import TabHeader from '@/components/TabHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useMemberMembershipModal } from '@/contexts/MemberMembershipModalContext';
import { memberHasActiveGymMembership } from '@/utils/memberMembership';
import { GET_ATTENDANCE_RECORDS_QUERY } from '@/graphql/queries';
import { useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
	RefreshControl,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

const MemberAttendance = () => {
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
	const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

	const attendanceId = user?.attendanceId?.toString();

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
		skip: !attendanceId,
		fetchPolicy: 'cache-and-network',
	});

	const onRefresh = async () => {
		setRefreshing(true);
		try {
			await refetch();
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

	if (!hasMembership) {
		return (
			<FixedView className='flex-1 bg-bg-darker'>
				<TabHeader showCoachIcon={false} />
			</FixedView>
		);
	}

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

				{loading && !data ? (
					<View className='bg-bg-primary rounded-xl border border-[#F9C513]/20 overflow-hidden'>
						<PremiumLoadingContent embedded message='Please wait..' />
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

export default MemberAttendance;

