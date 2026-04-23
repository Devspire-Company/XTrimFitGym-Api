import {
	attendanceRecordSortMs,
	attendanceRecordsForDay,
	formatAttendanceClockLabel,
	formatAttendanceDirectionLabel,
	isAttendanceTimedOut,
	type AttendanceRecordLike,
} from '@/utils/attendanceCalendar';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

type Props = {
	dayKey: string;
	dayLabel: string;
	allRecords: AttendanceRecordLike[];
	/** When true and there are no check-ins, hint that sessions may still apply. */
	hasSessionsOnDay: boolean;
};

export function ScheduleDayAttendancePanel({
	dayKey,
	dayLabel,
	allRecords,
	hasSessionsOnDay,
}: Props) {
	const dayRecords = useMemo(
		() => attendanceRecordsForDay(allRecords, dayKey),
		[allRecords, dayKey]
	);

	const sorted = useMemo(() => {
		return [...dayRecords].sort(
			(a, b) => attendanceRecordSortMs(a, dayKey) - attendanceRecordSortMs(b, dayKey)
		);
	}, [dayRecords, dayKey]);

	const hasCheckIns = sorted.length > 0;
	const headerIconBg = hasCheckIns ? 'bg-emerald-500/15' : 'bg-[#F9C513]/10';
	const headerIconColor = hasCheckIns ? '#34C759' : '#F9C513';

	return (
		<View
			className='mb-4 overflow-hidden rounded-2xl border border-[#F9C513]/30 bg-bg-primary'
			style={{ borderWidth: 1 }}
			accessibilityLabel={`Gym check-ins for ${dayLabel}`}
		>
			<View className='flex-row items-center border-b border-[#2C2C2E] bg-bg-darker/60 px-4 py-3'>
				<View
					className={`mr-3 h-11 w-11 items-center justify-center rounded-xl ${headerIconBg}`}
				>
					<Ionicons name='log-in-outline' size={22} color={headerIconColor} />
				</View>
				<View className='min-w-0 flex-1'>
					<Text className='text-[10px] font-bold uppercase tracking-wider text-text-secondary'>
						Door activity
					</Text>
					<Text className='text-base font-semibold text-text-primary'>Gym check-ins</Text>
				</View>
			</View>

			<View className='px-4 py-4'>
				{sorted.length === 0 ? (
					<View className='items-center py-5'>
						<View className='mb-3 h-14 w-14 items-center justify-center rounded-full bg-bg-darker'>
							<Ionicons name='footsteps-outline' size={28} color='#6B7280' />
						</View>
						<Text className='text-center text-base font-semibold text-text-primary'>
							No check-ins on this date
						</Text>
						<Text className='mt-2 max-w-xs text-center text-sm leading-5 text-text-secondary'>
							{hasSessionsOnDay
								? 'No door check-in recorded for this day. Your sessions for this date are listed below.'
								: 'When you enter through the gym door, your visits will show up here.'}
						</Text>
					</View>
				) : (
					sorted.map((r, idx) => {
						const isOut = isAttendanceTimedOut(r.direction);
						const rowAccent = isOut ? '#EF4444' : '#34C759';
						return (
							<View
								key={
									r.id
										? String(r.id)
										: `att-${r.authDateTime || ''}-${r.direction || ''}-${idx}`
								}
								className={`flex-row items-start py-3 ${
									idx < sorted.length - 1 ? 'border-b border-[#2C2C2E]' : ''
								}`}
							>
								<View className='w-24 flex-shrink-0'>
									<Text className='text-sm font-semibold' style={{ color: rowAccent }}>
										{formatAttendanceClockLabel(r)}
									</Text>
								</View>
								<View className='min-w-0 flex-1'>
									<Text className='text-sm font-medium' style={{ color: rowAccent }}>
										{formatAttendanceDirectionLabel(r.direction)}
									</Text>
									{r.deviceName ? (
										<Text
											className={`mt-0.5 text-xs ${isOut ? '' : 'text-text-secondary'}`}
											style={isOut ? { color: '#F87171' } : undefined}
											numberOfLines={1}
										>
											{r.deviceName}
										</Text>
									) : null}
								</View>
							</View>
						);
					})
				)}
			</View>
		</View>
	);
}
