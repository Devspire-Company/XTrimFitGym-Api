import { WheelColumn, WHEEL_HEIGHT } from '@/components/WheelColumn';
import { getGymMinutesBoundsNoReferenceDate } from '@/constants/gym-hours';
import {
	buildQuarterMinuteSlots,
	formatMinutesAs12hClock,
	minutesOfDayFromDate,
} from '@/utils/time-utils';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const defaultBounds = getGymMinutesBoundsNoReferenceDate();

interface TimePickerProps {
	label?: string;
	value?: Date;
	onChange: (date: Date) => void;
	placeholder?: string;
	error?: string;
	containerClassName?: string;
	disabled?: boolean;
	/** Total minutes from midnight; default gym standard 10:00 AM–10:00 PM */
	minMinutes?: number;
	maxMinutes?: number;
	/** Shown in modal header */
	modalTitle?: string;
}

const TimePicker: React.FC<TimePickerProps> = ({
	label,
	value,
	onChange,
	placeholder = 'Select a time',
	error,
	containerClassName = '',
	disabled = false,
	minMinutes = defaultBounds.min,
	maxMinutes = defaultBounds.max,
	modalTitle = 'Select time',
}) => {
	const insets = useSafeAreaInsets();
	const [show, setShow] = useState(false);

	const slots = useMemo(
		() => buildQuarterMinuteSlots(minMinutes, maxMinutes),
		[minMinutes, maxMinutes],
	);

	const labels = useMemo(() => slots.map((s) => s.label), [slots]);

	const indexFromValue = (d?: Date) => {
		if (!d || slots.length === 0) return 0;
		const target = minutesOfDayFromDate(d);
		let best = 0;
		let bestDist = Infinity;
		slots.forEach((s, i) => {
			const dist = Math.abs(s.totalMinutes - target);
			if (dist < bestDist) {
				bestDist = dist;
				best = i;
			}
		});
		return best;
	};

	const [draftIndex, setDraftIndex] = useState(0);

	const openModal = () => {
		setDraftIndex(indexFromValue(value));
		setShow(true);
	};

	const handleDone = () => {
		const slot = slots[draftIndex];
		if (slot) {
			const d = new Date();
			d.setHours(
				Math.floor(slot.totalMinutes / 60),
				slot.totalMinutes % 60,
				0,
				0,
			);
			onChange(d);
		}
		setShow(false);
	};

	const displayText = value ? formatMinutesAs12hClock(minutesOfDayFromDate(value)) : placeholder;

	return (
		<View className={`${containerClassName}`}>
			{label && (
				<Text className='text-text-primary text-sm font-medium mb-2'>{label}</Text>
			)}
			<TouchableOpacity
				onPress={() => !disabled && openModal()}
				disabled={disabled}
				className={`border ${
					error ? 'border-red-500' : 'border-input'
				} rounded-lg p-4 bg-input flex-row justify-between items-center ${
					disabled ? 'opacity-50' : ''
				}`}
				activeOpacity={0.7}
			>
				<Text
					className={`text-base flex-1 pr-2 shrink ${
						value ? 'text-text-primary' : 'text-placeholder'
					}`}
				>
					{displayText}
				</Text>
				<Ionicons name='time-outline' size={22} color='#F9C513' />
			</TouchableOpacity>
			{error ? <Text className='text-red-500 text-sm mt-1'>{error}</Text> : null}

			<Modal
				visible={show}
				transparent
				animationType='slide'
				onRequestClose={() => setShow(false)}
			>
				<View className='flex-1 justify-end'>
					<Pressable className='flex-1 bg-black/60' onPress={() => setShow(false)} />
					<View
						className='bg-[#252830] rounded-t-[20px] overflow-hidden'
						style={{ paddingBottom: Math.max(insets.bottom, 16) }}
					>
						<View className='flex-row items-center px-4 pt-4 pb-3 border-b border-white/10'>
							<View style={{ width: 76 }}>
								<TouchableOpacity onPress={() => setShow(false)} hitSlop={12}>
									<Text className='text-[#b8bcc8] text-base'>Cancel</Text>
								</TouchableOpacity>
							</View>
							<View className='flex-1 flex-row items-center justify-center gap-2'>
								<Ionicons name='time-outline' size={18} color='#F9C513' />
								<Text className='text-text-primary text-base font-semibold' numberOfLines={1}>
									{modalTitle}
								</Text>
							</View>
							<View style={{ width: 76, alignItems: 'flex-end' }}>
								<TouchableOpacity onPress={handleDone} hitSlop={12}>
									<Text className='text-[#F9C513] text-base font-semibold'>Done</Text>
								</TouchableOpacity>
							</View>
						</View>

						{slots.length > 0 ? (
							<View className='px-2 pt-2 pb-1' style={{ height: WHEEL_HEIGHT + 8 }}>
								<WheelColumn
									key={`${minMinutes}-${maxMinutes}`}
									data={labels}
									selectedIndex={Math.min(
										Math.max(0, draftIndex),
										labels.length - 1,
									)}
									onSelectIndex={setDraftIndex}
								/>
							</View>
						) : (
							<View className='py-8 px-4'>
								<Text className='text-text-secondary text-center'>
									No times in this range
								</Text>
							</View>
						)}
					</View>
				</View>
			</Modal>
		</View>
	);
};

export default TimePicker;
