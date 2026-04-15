import { WheelColumn, WHEEL_HEIGHT } from '@/components/WheelColumn';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MONTHS_SHORT = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec',
];

function daysInMonth(monthIndex: number, year: number): number {
	return new Date(year, monthIndex + 1, 0).getDate();
}

function clampDay(day: number, monthIndex: number, year: number): number {
	const max = daysInMonth(monthIndex, year);
	return Math.min(Math.max(1, day), max);
}

function startOfDay(d: Date): Date {
	const x = new Date(d);
	x.setHours(0, 0, 0, 0);
	return x;
}

function endOfDay(d: Date): Date {
	const x = new Date(d);
	x.setHours(23, 59, 59, 999);
	return x;
}

function defaultRangeMax(from: Date): Date {
	return new Date(from.getFullYear() + 10, 11, 31);
}

function formatDateFull(date: Date): string {
	if (Number.isNaN(date.getTime())) return '';
	return date.toLocaleDateString('en-US', {
		weekday: 'short',
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	});
}

interface DatePickerProps {
	label?: string;
	/** Bottom sheet header; defaults from `label` (trailing * stripped) or "Select date". */
	sheetTitle?: string;
	value?: Date;
	onChange: (date: Date) => void;
	placeholder?: string;
	error?: string;
	containerClassName?: string;
	maximumDate?: Date;
	minimumDate?: Date;
}

function sheetHeaderFromProps(sheetTitle: string | undefined, label: string | undefined): string {
	const t = sheetTitle?.trim();
	if (t) return t;
	const l = label?.trim();
	if (l) return l.replace(/\s*\*+\s*$/u, '').trim();
	return 'Select date';
}

const DatePicker: React.FC<DatePickerProps> = ({
	label,
	sheetTitle,
	value,
	onChange,
	placeholder = 'Select a date',
	error,
	containerClassName = '',
	maximumDate,
	minimumDate,
}) => {
	const insets = useSafeAreaInsets();
	const [show, setShow] = useState(false);
	const headerTitle = useMemo(
		() => sheetHeaderFromProps(sheetTitle, label),
		[sheetTitle, label],
	);

	/** Optional hard cap from parent; “today” is refreshed every time the modal opens. */
	const propMax = useMemo(
		() => (maximumDate ? new Date(maximumDate) : null),
		[maximumDate],
	);
	/** Earliest selectable calendar day (local midnight). */
	const minD = useMemo(
		() =>
			minimumDate ? startOfDay(new Date(minimumDate)) : new Date(1900, 0, 1),
		[minimumDate],
	);

	/**
	 * Latest selectable calendar day for the wheels. Without maximumDate this must
	 * extend into the future — using "now" made min and max the same day so only
	 * one month/day/year appeared.
	 */
	const [rangeMax, setRangeMax] = useState(() => defaultRangeMax(new Date()));

	const years = useMemo(() => {
		const from = minD.getFullYear();
		const to = rangeMax.getFullYear();
		const list: string[] = [];
		for (let y = from; y <= to; y++) {
			list.push(String(y));
		}
		return list;
	}, [minD, rangeMax]);

	const [draftMonth, setDraftMonth] = useState(() => new Date().getMonth());
	const [draftDay, setDraftDay] = useState(() => new Date().getDate());
	const [draftYear, setDraftYear] = useState(() => new Date().getFullYear());

	const openModal = () => {
		const now = new Date();
		const maxBound = propMax ? endOfDay(new Date(propMax)) : defaultRangeMax(now);
		setRangeMax(maxBound);

		const raw = value ?? now;
		let t = raw.getTime();
		t = Math.min(Math.max(t, minD.getTime()), maxBound.getTime());
		const base = new Date(t);
		let m = base.getMonth();
		let y = base.getFullYear();
		let d = base.getDate();
		y = Math.min(Math.max(y, minD.getFullYear()), maxBound.getFullYear());
		if (y === minD.getFullYear()) m = Math.max(m, minD.getMonth());
		if (y === maxBound.getFullYear()) m = Math.min(m, maxBound.getMonth());
		d = clampDay(d, m, y);
		if (y === maxBound.getFullYear() && m === maxBound.getMonth()) {
			d = Math.min(d, maxBound.getDate());
		}
		if (y === minD.getFullYear() && m === minD.getMonth()) {
			d = Math.max(d, minD.getDate());
		}
		setDraftMonth(m);
		setDraftDay(d);
		setDraftYear(y);
		setShow(true);
	};

	const dayNumbers = useMemo(() => {
		const dim = daysInMonth(draftMonth, draftYear);
		let start = 1;
		let end = dim;
		if (draftYear === minD.getFullYear() && draftMonth === minD.getMonth()) {
			start = minD.getDate();
		}
		if (draftYear === rangeMax.getFullYear() && draftMonth === rangeMax.getMonth()) {
			end = rangeMax.getDate();
		}
		const list: string[] = [];
		for (let d = start; d <= end; d++) {
			list.push(String(d));
		}
		return list;
	}, [draftMonth, draftYear, minD, rangeMax]);

	const monthIndices = useMemo(() => {
		let start = 0;
		let end = 11;
		if (draftYear === minD.getFullYear()) start = minD.getMonth();
		if (draftYear === rangeMax.getFullYear()) end = rangeMax.getMonth();
		return { start, end, labels: MONTHS_SHORT.slice(start, end + 1) };
	}, [draftYear, minD, rangeMax]);

	const selectedMonthLocalIndex = draftMonth - monthIndices.start;
	const selectedYearIndex = years.indexOf(String(draftYear));
	const safeYearIndex = selectedYearIndex >= 0 ? selectedYearIndex : years.length - 1;

	const selectedDayLocalIndex = useMemo(() => {
		const idx = dayNumbers.indexOf(String(draftDay));
		return idx >= 0 ? idx : dayNumbers.length - 1;
	}, [dayNumbers, draftDay]);

	useEffect(() => {
		if (!show) return;
		const dim = daysInMonth(draftMonth, draftYear);
		let maxDay = dim;
		let minDay = 1;
		if (
			draftYear === rangeMax.getFullYear() &&
			draftMonth === rangeMax.getMonth()
		) {
			maxDay = rangeMax.getDate();
		}
		if (draftYear === minD.getFullYear() && draftMonth === minD.getMonth()) {
			minDay = minD.getDate();
		}
		if (draftDay > maxDay) setDraftDay(maxDay);
		if (draftDay < minDay) setDraftDay(minDay);
	}, [show, draftMonth, draftYear, rangeMax, minD, draftDay]);

	const setMonthByLocalIndex = (localIndex: number) => {
		const m = monthIndices.start + localIndex;
		setDraftMonth(m);
		setDraftDay((prev) => clampDay(prev, m, draftYear));
	};

	const setDayByLocalIndex = (localIndex: number) => {
		const d = parseInt(dayNumbers[localIndex] ?? '1', 10);
		setDraftDay(d);
	};

	const setYearByIndex = (index: number) => {
		const y = parseInt(
			years[index] ?? String(rangeMax.getFullYear()),
			10,
		);
		setDraftYear(y);
		let m = draftMonth;
		if (y === minD.getFullYear()) m = Math.max(m, minD.getMonth());
		if (y === rangeMax.getFullYear()) m = Math.min(m, rangeMax.getMonth());
		if (m !== draftMonth) setDraftMonth(m);
		setDraftDay((prev) => clampDay(prev, m, y));
	};

	const handleDone = () => {
		const next = new Date(draftYear, draftMonth, draftDay);
		onChange(next);
		setShow(false);
	};

	return (
		<View className={`mb-4 ${containerClassName}`}>
			{label && (
				<Text className='text-text-secondary text-sm font-medium mb-2'>{label}</Text>
			)}
			<TouchableOpacity
				onPress={openModal}
				className={`border ${
					error ? 'border-red-500' : 'border-input'
				} rounded-lg p-4 bg-input flex-row justify-between items-center`}
				activeOpacity={0.7}
			>
				<Text
					className={`text-base flex-1 pr-1 shrink ${value ? 'text-text-primary' : 'text-placeholder'}`}
				>
					{value ? formatDateFull(value) : placeholder}
				</Text>
				<Ionicons name='calendar-outline' size={22} color='#F9C513' />
			</TouchableOpacity>
			{error ? <Text className='text-red-500 text-sm mt-1'>{error}</Text> : null}

			<Modal
				visible={show}
				transparent
				animationType='slide'
				onRequestClose={() => setShow(false)}
			>
				<View className='flex-1 justify-end'>
					<Pressable
						className='flex-1 bg-black/60'
						onPress={() => setShow(false)}
					/>
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
							<View className='flex-1 flex-row items-center justify-center gap-2 px-1'>
								<Ionicons name='calendar-outline' size={18} color='#F9C513' />
								<Text
									className='text-text-primary text-base font-semibold text-center shrink'
									numberOfLines={2}
								>
									{headerTitle}
								</Text>
							</View>
							<View style={{ width: 76, alignItems: 'flex-end' }}>
								<TouchableOpacity onPress={handleDone} hitSlop={12}>
									<Text className='text-[#F9C513] text-base font-semibold'>Done</Text>
								</TouchableOpacity>
							</View>
						</View>

						<View className='flex-row px-2 pt-2 pb-1' style={{ height: WHEEL_HEIGHT + 8 }}>
							<WheelColumn
								key={`month-${draftYear}`}
								data={monthIndices.labels}
								selectedIndex={Math.max(
									0,
									Math.min(monthIndices.labels.length - 1, selectedMonthLocalIndex),
								)}
								onSelectIndex={setMonthByLocalIndex}
							/>
							<WheelColumn
								key={`day-${draftMonth}-${draftYear}`}
								data={dayNumbers}
								selectedIndex={Math.max(
									0,
									Math.min(dayNumbers.length - 1, selectedDayLocalIndex),
								)}
								onSelectIndex={setDayByLocalIndex}
							/>
							<WheelColumn
								key='year'
								data={years}
								selectedIndex={safeYearIndex}
								onSelectIndex={setYearByIndex}
							/>
						</View>
					</View>
				</View>
			</Modal>
		</View>
	);
};

export default DatePicker;
