import {
	attendanceRecordsForDay,
	formatAttendanceClockLabel,
	formatAttendanceDirectionLabel,
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
		return [...dayRecords].sort((a, b) => {
			const ta = a.authDateTime
				? new Date(a.authDateTime).getTime()
				: new Date(`${dayKey}T${a.authTime || '00:00:00'}`).getTime();
			const tb = b.authDateTime
				? new Date(b.authDateTime).getTime()
				: new Date(`${dayKey}T${b.authTime || '00:00:00'}`).getTime();
			return ta - tb;
		});
	}, [dayRecords, dayKey]);

	return (
		<View className='bg-bg-primary rounded-xl p-4 mb-4 border border-[#F9C513]/40' style={{ borderWidth: 0.5 }}>
			<View className='flex-row items-center gap-2 mb-2'>
				<Ionicons name='log-in-outline' size={20} color='#34C759' />
				<Text className='text-text-primary font-semibold text-base'>
					Gym check-ins — {dayLabel}
				</Text>
			</View>
			{sorted.length === 0 ? (
				<Text className='text-text-secondary text-sm leading-5'>
					{hasSessionsOnDay
						? 'No door check-in recorded for this day. Your sessions for this date are listed below.'
						: 'No check-ins on this date.'}
				</Text>
			) : (
				sorted.map((r, idx) => (
					<View
						key={`${r.authDateTime || ''}-${idx}`}
						className={`flex-row items-start py-2 ${
							idx < sorted.length - 1 ? 'border-b border-[#2C2C2E]' : ''
						}`}
					>
						<View className='w-24 flex-shrink-0'>
							<Text className='text-[#34C759] font-semibold text-sm'>
								{formatAttendanceClockLabel(r)}
							</Text>
						</View>
						<View className='flex-1'>
							<Text className='text-text-primary text-sm font-medium'>
								{formatAttendanceDirectionLabel(r.direction)}
							</Text>
							{r.deviceName ? (
								<Text className='text-text-secondary text-xs mt-0.5' numberOfLines={1}>
									{r.deviceName}
								</Text>
							) : null}
						</View>
					</View>
				))
			)}
		</View>
	);
}
